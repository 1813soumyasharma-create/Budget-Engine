# BE — Budget Engine

Full-stack accounting web application for manufacturing organizations.

## Tech Stack
- **Frontend**: Vanilla HTML/CSS/JS, Chart.js
- **Backend**: Node.js, Express.js
- **Database**: SQLite (better-sqlite3)
- **Integrations**: Tally XML/HTTP Sync, ExcelJS

## Features
- **Industrial Dark UI**: Brutalist design with teal/amber accents.
- **Dashboard**: Real-time KPI cards and interactive performance charts.
- **Income/Expenses**: Full CRUD with GST auto-calculation.
- **Tally Sync**: Two-way XML synchronization (Push/Pull).
- **Auto-Reports**: Automated Excel spreadsheet generation on sync events.
- **Auto-Sync**: Background polling for Tally integration.

## Installation
```bash
npm install
npm start
```

## Usage
1. Open `http://localhost:3000`
2. Login with `admin / admin123`
3. Configure Tally host/port in Settings if using Tally Prime.

## Project Structure
- `/public`: Frontend assets.
- `/server`: Node/Express backend logic.
- `/db`: SQLite database file location.
