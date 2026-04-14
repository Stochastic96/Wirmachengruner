# Wirmachengruner

Receipt vault and digital receipt storage MVP.

## What is included

- Flask backend API
- SQLite storage (auto-created)
- File upload storage for receipt images/PDFs
- Simple web UI to add, search, filter, download, and delete receipts

## Project structure

```
.
├── app/
│   ├── __init__.py
│   ├── db.py
│   ├── routes.py
│   ├── storage.py
│   ├── static/
│   │   ├── app.js
│   │   └── styles.css
│   └── templates/
│       └── index.html
├── requirements.txt
└── run.py
```

## Quick start

1. Create and activate a virtual environment:

	 ```bash
	 python3 -m venv .venv
	 source .venv/bin/activate
	 ```

2. Install dependencies:

	 ```bash
	 pip install -r requirements.txt
	 ```

3. Run the app:

	 ```bash
	 python run.py
	 ```

4. Open in your browser:

	 ```
	 http://127.0.0.1:5000
	 ```

## Test on iPhone (Apple mobile)

1. Make sure your computer and iPhone are on the same Wi-Fi network.
2. Start the app:

	```bash
	python run.py
	```

3. Get your computer's local IP address:

	```bash
	hostname -I
	```

4. On your iPhone Safari, open:

	```
	http://<YOUR_LOCAL_IP>:5000
	```

Example: `http://192.168.1.23:5000`

If it does not load:
- Confirm both devices are on the same network.
- Temporarily allow inbound port `5000` in your firewall.
- Keep the terminal running while testing.

The SQLite DB is created automatically at `instance/receipts.sqlite3`.
Uploaded files are stored under `instance/uploads/`.

## API endpoints

- `GET /api/receipts`
	- Optional query params: `q`, `category`
- `POST /api/receipts`
	- `multipart/form-data`
	- Fields: `vendor` (required), `amount` (required), `currency`, `purchase_date`, `category`, `notes`, `file`
- `GET /api/receipts/<id>/file`
	- Download an uploaded file for a receipt
- `DELETE /api/receipts/<id>`
	- Remove receipt and associated file
