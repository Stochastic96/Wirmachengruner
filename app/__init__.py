from pathlib import Path

from flask import Flask

from .db import close_db, init_db
from .routes import bp


def create_app() -> Flask:
    app = Flask(__name__, instance_relative_config=True)

    data_dir = Path(app.instance_path)
    upload_dir = data_dir / "uploads"

    app.config.update(
        DATABASE=str(data_dir / "receipts.sqlite3"),
        UPLOAD_FOLDER=str(upload_dir),
        MAX_CONTENT_LENGTH=10 * 1024 * 1024,
    )

    data_dir.mkdir(parents=True, exist_ok=True)
    upload_dir.mkdir(parents=True, exist_ok=True)

    app.teardown_appcontext(close_db)
    app.register_blueprint(bp)

    with app.app_context():
        init_db()

    return app
