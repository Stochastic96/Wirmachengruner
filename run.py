import os

from app import create_app

app = create_app()


if __name__ == "__main__":
    # Bind to all interfaces so devices on the same Wi-Fi can access the app.
    # Note: macOS AirPlay Receiver uses port 5000 by default.
    # If a port is busy, run with: PORT=5002 python run.py
    port = int(os.getenv("PORT", "5001"))
    app.run(host="0.0.0.0", port=port, debug=True)
