# Khoga E-commerce Platform ☕

An e-commerce platform built for Khoga Coffee, focused on providing a seamless and trustworthy shopping experience. This project was developed as a graduation project to study the impact of visual layout, localization, and local payment preferences on user trust and purchase intent.

## Tech Stack
- **Frontend:** React.js, Vanilla CSS
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Architecture:** FARM Stack (FastAPI, React, MongoDB)

## Key Features
- 🌍 **Bilingual Support:** Full Arabic and English localization.
- 💳 **Local Payment:** Simulates Cash on Delivery (COD) as the primary payment method for the Egyptian market.
- 🛡️ **Trust Signals:** Integrated reviews, trust badges, and clear refund policies.
- 📱 **Responsive Design:** Optimized for mobile and desktop viewing.

## How to Run the Project Locally

### 1. Backend Setup
1. Open your terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Activate the virtual environment (macOS/Linux):
   ```bash
   source venv/bin/activate
   ```
3. Run the FastAPI server:
   ```bash
   python -m uvicorn server:app --host 0.0.0.0 --port 8001
   ```
   *The backend API will run on `http://localhost:8001`*

### 2. Frontend Setup
1. Open a new terminal tab and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
   *The website will open automatically at `http://localhost:3000`*

## Project Structure
- `/frontend`: Contains all React components, pages, and UI styling.
- `/backend`: Contains the FastAPI server, MongoDB schemas (`models.py`), and API routes.

---
*Developed as part of an Information Systems graduation research project.*
