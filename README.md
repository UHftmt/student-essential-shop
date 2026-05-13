# Student Essential Shop

A full-stack e-commerce solution tailored for student needs, featuring a React/Vite frontend and a Flask/SQLite backend. The application supports secure Google OAuth authentication with JWT, role-based route guards, and a robust inventory management system. Key features include a dynamic product storefront with search and category filtering, a persistence-aware shopping cart, a specialized POS (Point of Sale) system for cashiers, and comprehensive order tracking for both students and administrators.

![App Screenshot](./screenshots/homepage.png)

## Features

- **Student Interface:** browse products, manage cart, place orders, and track order history.
- **Admin Dashboard:** manage inventory, track orders, manage discounts, and generate receipts.
- **Point of Sale (POS):** fast transaction interface for cashiers to process orders.
- **Authentication:** Google OAuth with secure JWT-based session management.
- **Role-Based Access:** granular permissions for customers, cashiers, and admins.
- **Responsive Design:** modern, mobile-friendly user experience.
- **Persistence-Aware Cart:** cart data persists across sessions and device changes.

## 🚀 Live Links
- **Frontend:** [https://student-essential-shop.vercel.app](https://student-essential-shop.vercel.app)
- **Backend:** [https://yuhe.pythonanywhere.com](https://yuhe.pythonanywhere.com)

## 💻 Local Setup
Run these commands to start the full stack:
1. **Setup Backend:** `cd backend && pip install -r requirements.txt && python app.py`
2. **Setup Frontend:** `cd frontend/my-app && npm install && npm run dev`
3. **Visit App:** Open [http://localhost:5173](http://localhost:5173) in your browser.

*(Note: Ensure you have your `.env` files configured in both directories based on the provided `.env.example` files.)*
