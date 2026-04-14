from pathlib import Path

from flask import Flask, request
from flask_babel import Babel

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
        BABEL_DEFAULT_LOCALE="en",
        BABEL_DEFAULT_TIMEZONE="UTC",
    )

    data_dir.mkdir(parents=True, exist_ok=True)
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Initialize Babel for i18n
    babel = Babel(app)

    @babel.localeselector
    def get_locale():
        # Check request args first, then session, then browser preference
        lang = request.args.get("lang") or request.cookies.get("language", None)
        if lang in ["de", "en"]:
            return lang
        return request.accept_languages.best_match(["de", "en"]) or "en"

    app.teardown_appcontext(close_db)
    app.register_blueprint(bp)

    with app.app_context():
        init_db()

    return app
