from app import create_app

app = create_app()


if __name__ == "__main__":
    # Bind to all interfaces so devices on the same Wi-Fi can access the app.
    # Note: macOS AirPlay Receiver uses port 5000 by default.
    # If port 5000 is in use, change to 5001 or disable AirPlay Receiver in System Settings.
    app.run(host="0.0.0.0", port=5001, debug=True)
