# Khoga E-commerce Platform ☕

An e-commerce platform built for Khoga Coffee, focused on providing a seamless and trustworthy shopping experience. This project was developed as a graduation project to study the impact of visual layout, localization, and local payment preferences on user trust and purchase intent.

## Tech Stack
- **Frontend:** React.js, Vanilla CSS
- **Backend:** FastAPI (Python)
- **Database:** MongoDB (local)
- **Architecture:** FARM Stack (FastAPI, React, MongoDB)

## Key Features
- 🌍 **Bilingual Support:** Full Arabic and English localization
- 💳 **Local Payment:** Cash on Delivery (COD) as primary payment method
- 🛡️ **Trust Signals:** Product reviews, trust badges, refund policies
- ❤️ **Wishlist:** Save products for later
- 🛒 **Smart Cart:** Guest cart merges automatically on login
- 👤 **Account:** Profile edit, addresses, order history
- 📧 **Email:** Order confirmation (logs locally; sends when SMTP is configured)
- 📱 **Responsive Design:** Optimized for mobile and desktop

---

## Run Locally

### Prerequisites
- MongoDB running locally (`brew services start mongodb-community`)
- Python 3 + Node.js

### Quick start
```bash
chmod +x scripts/start-local.sh
./scripts/start-local.sh
```

### Manual start

**Backend** (terminal 1):
```bash
cd backend
cp .env.example .env          # first time only
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn server:app --host 0.0.0.0 --port 8001
```
→ API: http://localhost:8001/api/

**Frontend** (terminal 2):
```bash
cd frontend
npm install
npm start
```
→ Site: http://localhost:3000

### Admin login
- URL: http://localhost:3000/admin
- Email: `admin@khogaeg.com` / Password: `Admin@123`

---

## Share Temporarily (Demo Link)

Keep backend + frontend running, then in a third terminal:
```bash
cloudflared tunnel --url http://127.0.0.1:3000
```

Copy the `https://….trycloudflare.com` link and share it.

> Works only while your laptop is on and the tunnel is running.

**Project showcase slides:** `https://….trycloudflare.com/project_showcase.html`

---

## Project Structure
```
/backend          FastAPI server, routes, models, tests
/frontend         React storefront + admin panel
/scripts          Local start helper
```

---
*Developed as part of an Information Systems graduation research project.*
