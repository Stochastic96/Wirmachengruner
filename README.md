# Wirmachengruner

🌱 Receipt vault and digital receipt storage with CO2 footprint tracking.

## Features

- 📊 **Dashboard**: Overview of receipts, spending, and CO2 emissions
- 💚 **Green/Eco Theme**: Earth-tone design inspired by sustainability
- 🌍 **CO2 Calculator**: Automatic emission estimates based on category
- 🌐 **Multilingual**: German (Deutsch) and English support
- 📄 **Receipt Management**: Add, search, filter, download, and delete receipts
- 📸 **File Uploads**: Store images and PDFs with receipts
- 📱 **Mobile-Ready**: Fully responsive design for iPhone and tablets

## What is included

- Flask backend API with REST endpoints
- SQLite storage (auto-created)
- File upload storage for receipt images/PDFs
- Multilingual UI (English/German) with Flask-Babel
- CO2 emission calculator by category
- Dashboard with statistics and monthly breakdown
- Settings page for language and user preferences
- Green/earth-tone color scheme
- Sidebar navigation (Home, Receipts, Settings)

## Project structure

```
.
├── app/
│   ├── __init__.py
│   ├── co2.py                      # CO2 calculator logic
│   ├── db.py                       # Database helpers
│   ├── routes.py                   # API and web routes
│   ├── storage.py                  # File storage helpers
│   ├── static/
│   │   ├── common.js               # Shared functionality
│   │   ├── i18n.js                 # Language switching
│   │   └── styles.css              # Green/eco theme
│   ├── templates/
│   │   ├── base.html               # Base layout with sidebar
│   │   ├── dashboard.html          # Stats and overview
│   │   ├── index.html              # Dashboard (same as dashboard.html)
│   │   ├── receipts.html           # Receipt add/list/manage
│   │   └── settings.html           # User settings and prefs
│   └── translations/
│       ├── de/LC_MESSAGES/messages.po  # German translations
│       └── en/LC_MESSAGES/messages.po  # English translations
├── babel.cfg                       # Babel configuration
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

## Features explained

### Dashboard
- Total receipts, spending, and CO2 emissions overview
- Category breakdown with spending and emissions per category
- Monthly stats showing trends
- Carbon footprint tips based on your total emissions

### Receipts
- Form to add new receipts with vendor, amount, date, category, notes, and optional file
- List view with search and category filtering
- CO2 emissions displayed per receipt
- Download attached files
- Delete receipts

### Settings
- Switch between English and German
- Currency selection (EUR, USD, GBP, CHF)
- About section with app information

### CO2 Calculator
Automatic calculation based on category and amount:
- **Food**: ~2.5 kg CO₂ per €100
- **Transport**: ~5.0 kg CO₂ per €100
- **Office**: ~1.5 kg CO₂ per €100
- **Shopping**: ~2.0 kg CO₂ per €100
- **Accommodation**: ~3.5 kg CO₂ per €100
- **Entertainment**: ~1.2 kg CO₂ per €100
- **Utilities**: ~4.0 kg CO₂ per €100
- **Healthcare**: ~1.0 kg CO₂ per €100

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

Example: `http://192.168.0.101:5000`

### Port conflict on macOS

If you see "Port 5000 is in use by another program", do one of:

1. **Disable AirPlay Receiver** (recommended):
   - System Settings → General → AirDrop & Handoff
   - Turn off "AirPlay Receiver"
   - Run `python run.py` again
   - Then use `http://<ip>:5000` on phone

2. **Use a different port**:
   - Edit [run.py](run.py) and change `port=5000` to `port=5001` or another free port
   - Run `python run.py`
   - Use `http://<ip>:5001` on phone

If it does not load:
- Confirm both devices are on the same network.
- Temporarily allow inbound port `5000` (or your chosen port) in your firewall.
- Keep the terminal running while testing.

## API endpoints

### Stats
- `GET /api/stats`
  - Returns total receipts, spending, CO2, category breakdown, monthly stats, and carbon tips

### Receipts
- `GET /api/receipts`
  - Optional query params: `q` (search), `category` (filter)
- `POST /api/receipts`
  - `multipart/form-data`
  - Fields: `vendor` (required), `amount` (required), `currency`, `purchase_date`, `category`, `notes`, `file`
- `GET /api/receipts/<id>/file`
  - Download an uploaded file for a receipt
- `DELETE /api/receipts/<id>`
  - Remove receipt and associated file

### Settings
- `POST /api/settings/language`
  - Body: `{"language": "en"}` or `{"language": "de"}`
- `GET /api/settings`
  - Returns current settings (language, currency)

## Database

The SQLite DB is created automatically at `instance/receipts.sqlite3`.
Uploaded files are stored under `instance/uploads/`.

### Tables
- **receipts**: id, vendor, amount, currency, purchase_date, category, notes, co2_kg, original_filename, mime_type, file_path, created_at
- **settings**: language, currency (singleton row)
