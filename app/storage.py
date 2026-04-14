from pathlib import Path
from uuid import uuid4

from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename


def save_uploaded_file(file: FileStorage, upload_folder: str) -> tuple[str, str, str]:
    original_name = file.filename or "receipt"
    safe_name = secure_filename(original_name)
    ext = Path(safe_name).suffix
    generated_name = f"{uuid4().hex}{ext}"

    destination = Path(upload_folder) / generated_name
    file.save(destination)

    mime_type = file.mimetype or "application/octet-stream"
    return str(destination), original_name, mime_type


def delete_file_if_exists(path: str | None) -> None:
    if not path:
        return
    target = Path(path)
    if target.exists() and target.is_file():
        target.unlink()
