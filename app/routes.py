from datetime import datetime, timedelta
from pathlib import Path

from flask import Blueprint, current_app, jsonify, make_response, render_template, request, send_file

from .co2 import calculate_co2, get_co2_tips
from .db import execute, fetch_all, fetch_one
from .storage import delete_file_if_exists, save_uploaded_file

bp = Blueprint("web", __name__)


@bp.get("/")
def index():
    return render_template("index.html")


@bp.get("/dashboard")
def dashboard():
    return render_template("index.html")


@bp.get("/receipts")
def receipts_page():
    return render_template("receipts.html")


@bp.get("/profiles")
def profiles_page():
    return render_template("settings.html")


@bp.get("/settings")
def settings_page():
    return render_template("settings.html")


@bp.get("/impressum")
def impressum_page():
    return render_template("impressum.html")


@bp.get("/datenschutz")
def datenschutz_page():
    return render_template("datenschutz.html")


@bp.get("/api/stats")
def get_stats():
    rows = fetch_all("SELECT amount, category, co2_kg FROM receipts")

    total_receipts = len(rows)
    total_spent = sum(r["amount"] for r in rows)
    total_co2 = sum(r["co2_kg"] or 0 for r in rows)

    category_totals = {}
    for row in rows:
        cat = row["category"] or "Uncategorized"
        if cat not in category_totals:
            category_totals[cat] = {"count": 0, "amount": 0, "co2": 0}
        category_totals[cat]["count"] += 1
        category_totals[cat]["amount"] += row["amount"]
        category_totals[cat]["co2"] += row["co2_kg"] or 0

    six_months_ago = (datetime.now() - timedelta(days=180)).isoformat()
    monthly_rows = fetch_all(
        "SELECT strftime('%Y-%m', created_at) as month, SUM(amount) as total, SUM(co2_kg) as co2 "
        "FROM receipts WHERE created_at > ? GROUP BY month ORDER BY month DESC LIMIT 6",
        (six_months_ago,),
    )

    return jsonify(
        {
            "total_receipts": total_receipts,
            "total_spent": round(total_spent, 2),
            "total_co2": round(total_co2, 2),
            "category_breakdown": category_totals,
            "monthly_stats": [dict(r) for r in monthly_rows],
            "carbon_tip": get_co2_tips(total_co2),
        }
    )


@bp.get("/api/receipts")
def list_receipts():
    q = (request.args.get("q") or "").strip().lower()
    category = (request.args.get("category") or "").strip().lower()

    rows = fetch_all(
        """
        SELECT id, vendor, amount, currency, purchase_date, category, notes,
               co2_kg, original_filename, mime_type, file_path, created_at
        FROM receipts
        ORDER BY datetime(created_at) DESC, id DESC
        """
    )

    data = [dict(row) for row in rows]

    if q:
        data = [
            item
            for item in data
            if q in (item.get("vendor") or "").lower()
            or q in (item.get("notes") or "").lower()
            or q in (item.get("category") or "").lower()
        ]

    if category:
        data = [item for item in data if category in (item.get("category") or "").lower()]

    return jsonify(data)


@bp.post("/api/receipts")
def create_receipt():
    vendor = (request.form.get("vendor") or "").strip()
    amount_raw = (request.form.get("amount") or "").strip()
    currency = (request.form.get("currency") or "EUR").strip().upper()
    purchase_date = (request.form.get("purchase_date") or "").strip() or None
    category = (request.form.get("category") or "").strip() or None
    notes = (request.form.get("notes") or "").strip() or None

    if not vendor:
        return jsonify({"error": "vendor is required"}), 400

    try:
        amount = float(amount_raw)
    except ValueError:
        return jsonify({"error": "amount must be a valid number"}), 400

    co2_kg = calculate_co2(amount, category)

    file_path = None
    original_filename = None
    mime_type = None

    file = request.files.get("file")
    if file and file.filename:
        file_path, original_filename, mime_type = save_uploaded_file(
            file,
            current_app.config["UPLOAD_FOLDER"],
        )

    new_id = execute(
        """
        INSERT INTO receipts (
            vendor, amount, currency, purchase_date, category, notes,
            co2_kg, original_filename, mime_type, file_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            vendor,
            amount,
            currency,
            purchase_date,
            category,
            notes,
            co2_kg,
            original_filename,
            mime_type,
            file_path,
        ),
    )

    created = fetch_one(
        """
        SELECT id, vendor, amount, currency, purchase_date, category, notes,
               co2_kg, original_filename, mime_type, file_path, created_at
        FROM receipts
        WHERE id = ?
        """,
        (new_id,),
    )

    return jsonify(dict(created)), 201


@bp.get("/api/receipts/<int:receipt_id>/file")
def download_receipt_file(receipt_id: int):
    row = fetch_one("SELECT file_path, original_filename FROM receipts WHERE id = ?", (receipt_id,))
    if row is None or not row["file_path"]:
        return jsonify({"error": "file not found"}), 404

    file_path = Path(row["file_path"])
    if not file_path.exists():
        return jsonify({"error": "file not found on disk"}), 404

    return send_file(file_path, as_attachment=True, download_name=row["original_filename"] or file_path.name)


@bp.delete("/api/receipts/<int:receipt_id>")
def delete_receipt(receipt_id: int):
    row = fetch_one("SELECT file_path FROM receipts WHERE id = ?", (receipt_id,))
    if row is None:
        return jsonify({"error": "receipt not found"}), 404

    execute("DELETE FROM receipts WHERE id = ?", (receipt_id,))
    delete_file_if_exists(row["file_path"])

    return jsonify({"status": "deleted", "id": receipt_id})


@bp.post("/api/settings/language")
def set_language():
    lang = request.json.get("language", "en")
    if lang not in ["en", "de"]:
        return jsonify({"error": "unsupported language"}), 400

    response = make_response(jsonify({"status": "ok"}))
    response.set_cookie("language", lang, max_age=31536000, samesite="Lax")
    return response


@bp.get("/api/settings")
def get_settings():
    lang = request.cookies.get("language", "en")
    return jsonify({"language": lang, "currency": "EUR"})
