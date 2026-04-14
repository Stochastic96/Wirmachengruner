from pathlib import Path

from flask import Blueprint, current_app, jsonify, render_template, request, send_file

from .db import execute, fetch_all, fetch_one
from .storage import delete_file_if_exists, save_uploaded_file

bp = Blueprint("web", __name__)


@bp.get("/")
def index():
    return render_template("index.html")


@bp.get("/api/receipts")
def list_receipts():
    q = (request.args.get("q") or "").strip().lower()
    category = (request.args.get("category") or "").strip().lower()

    rows = fetch_all(
        """
        SELECT id, vendor, amount, currency, purchase_date, category, notes,
               original_filename, mime_type, file_path, created_at
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
    currency = (request.form.get("currency") or "USD").strip().upper()
    purchase_date = (request.form.get("purchase_date") or "").strip() or None
    category = (request.form.get("category") or "").strip() or None
    notes = (request.form.get("notes") or "").strip() or None

    if not vendor:
        return jsonify({"error": "vendor is required"}), 400

    try:
        amount = float(amount_raw)
    except ValueError:
        return jsonify({"error": "amount must be a valid number"}), 400

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
            original_filename, mime_type, file_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            vendor,
            amount,
            currency,
            purchase_date,
            category,
            notes,
            original_filename,
            mime_type,
            file_path,
        ),
    )

    created = fetch_one(
        """
        SELECT id, vendor, amount, currency, purchase_date, category, notes,
               original_filename, mime_type, file_path, created_at
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
