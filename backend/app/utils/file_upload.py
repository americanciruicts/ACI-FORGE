"""
File Upload Utilities for Maintenance Requests
Handles secure file uploads, validation, and storage
"""
import os
import uuid
import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import UploadFile, HTTPException, status
import mimetypes


# Configuration
UPLOAD_DIR = Path("uploads/maintenance_requests")
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {
    # Images
    ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp",
    # Documents
    ".pdf", ".doc", ".docx", ".txt", ".rtf",
    # Spreadsheets
    ".xls", ".xlsx", ".csv",
    # Other
    ".zip", ".rar"
}

ALLOWED_MIME_TYPES = {
    # Images
    "image/jpeg", "image/png", "image/gif", "image/bmp", "image/webp",
    # Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain", "application/rtf",
    # Spreadsheets
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    # Archives
    "application/zip", "application/x-rar-compressed"
}


def init_upload_directory():
    """Initialize upload directory if it doesn't exist"""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Upload directory initialized: {UPLOAD_DIR.absolute()}")


def validate_file(file: UploadFile) -> None:
    """
    Validate uploaded file

    Args:
        file: The uploaded file

    Raises:
        HTTPException: If validation fails
    """
    # Check if file exists
    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided"
        )

    # Check filename
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename"
        )

    # Get file extension
    file_ext = Path(file.filename).suffix.lower()

    # Validate extension
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Validate MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type: {file.content_type}"
        )


def generate_unique_filename(original_filename: str) -> str:
    """
    Generate unique filename to prevent collisions

    Args:
        original_filename: Original filename from upload

    Returns:
        Unique filename with UUID prefix
    """
    file_ext = Path(original_filename).suffix.lower()
    unique_id = str(uuid.uuid4())
    # Sanitize original filename
    safe_filename = "".join(c for c in Path(original_filename).stem if c.isalnum() or c in (' ', '-', '_'))
    safe_filename = safe_filename.strip()[:50]  # Limit length

    return f"{unique_id}_{safe_filename}{file_ext}"


async def save_upload_file(file: UploadFile) -> str:
    """
    Save uploaded file to disk

    Args:
        file: The uploaded file

    Returns:
        Filename of saved file

    Raises:
        HTTPException: If file validation or saving fails
    """
    # Validate file
    validate_file(file)

    # Initialize upload directory
    init_upload_directory()

    # Generate unique filename
    filename = generate_unique_filename(file.filename)
    file_path = UPLOAD_DIR / filename

    try:
        # Check file size
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to beginning

        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE / (1024 * 1024)}MB"
            )

        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return filename

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    finally:
        file.file.close()


async def save_multiple_files(files: List[UploadFile]) -> List[str]:
    """
    Save multiple uploaded files

    Args:
        files: List of uploaded files

    Returns:
        List of saved filenames
    """
    saved_files = []

    for file in files:
        try:
            filename = await save_upload_file(file)
            saved_files.append(filename)
        except HTTPException as e:
            # Clean up already saved files if one fails
            for saved_file in saved_files:
                delete_file(saved_file)
            raise e

    return saved_files


def delete_file(filename: str) -> bool:
    """
    Delete a file from uploads directory

    Args:
        filename: Name of file to delete

    Returns:
        True if successful, False otherwise
    """
    try:
        file_path = UPLOAD_DIR / filename
        if file_path.exists() and file_path.is_file():
            file_path.unlink()
            return True
        return False
    except Exception as e:
        print(f"Error deleting file {filename}: {e}")
        return False


def delete_multiple_files(filenames: List[str]) -> int:
    """
    Delete multiple files

    Args:
        filenames: List of filenames to delete

    Returns:
        Number of successfully deleted files
    """
    deleted_count = 0
    for filename in filenames:
        if delete_file(filename):
            deleted_count += 1
    return deleted_count


def get_file_path(filename: str) -> Path:
    """
    Get full path to uploaded file

    Args:
        filename: Name of the file

    Returns:
        Full path to file

    Raises:
        HTTPException: If file doesn't exist or path is invalid
    """
    # Prevent path traversal attacks
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename"
        )

    file_path = UPLOAD_DIR / filename

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    return file_path


def get_file_info(filename: str) -> dict:
    """
    Get information about an uploaded file

    Args:
        filename: Name of the file

    Returns:
        Dictionary with file information
    """
    file_path = get_file_path(filename)
    stat = file_path.stat()

    return {
        "filename": filename,
        "size": stat.st_size,
        "created": stat.st_ctime,
        "modified": stat.st_mtime,
        "mime_type": mimetypes.guess_type(filename)[0]
    }
