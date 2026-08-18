# ShopNest — Mini E-Commerce Project

A full-stack e-commerce web application built as a college mini-project.

## Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** SQLite (via `better-sqlite3` — no separate DB server needed)
- **Auth:** JWT (JSON Web Tokens) + bcrypt password hashing
- **Frontend:** HTML, CSS, Vanilla JavaScript (no framework needed)

## Features
- User registration & login (JWT-based authentication)
- Product catalog with search & category filter
- Shopping cart (add / update quantity / remove)
- Checkout & order placement (with stock deduction)
- Order history for customers
- Admin dashboard:
  - Add / Edit / Delete products
  - View all orders and update order status

## Project Structure
```
ecommerce-project/
├── server.js              # Express app entry point
├── db.js                  # SQLite setup + auto-seeding
├── middleware/
│   └── auth.js             # JWT auth + admin-check middleware
├── routes/
│   ├── auth.js              # register / login
│   ├── products.js          # CRUD for products
│   ├── cart.js               # cart operations
│   └── orders.js             # checkout + order history
└── public/                  # Frontend
    ├── index.html            # Home page / product listing
    ├── login.html
    ├── register.html
    ├── cart.html
    ├── orders.html
    ├── admin.html             # Admin dashboard
    ├── css/style.css
    └── js/app.js               # shared frontend logic
```

## How to Run

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```
   (or `node server.js`)

3. Open your browser at:
   ```
   http://localhost:3000
   ```

The SQLite database (`shopnest.db`) and 8 sample products are created automatically
on first run — no manual DB setup required.

## Demo Login Credentials

**Admin account** (auto-created):
- Email: `admin@shopnest.com`
- Password: `admin123`

**Customer:** Just register a new account from the Sign Up page.

## API Endpoints (for reference)

| Method | Endpoint                  | Description                  | Auth        |
|--------|----------------------------|-------------------------------|-------------|
| POST   | /api/auth/register         | Register new user             | No          |
| POST   | /api/auth/login             | Login                          | No          |
| GET    | /api/products                | List products (search/category)| No          |
| GET    | /api/products/:id             | Get single product              | No          |
| POST   | /api/products                | Add product                     | Admin       |
| PUT    | /api/products/:id              | Update product                   | Admin       |
| DELETE | /api/products/:id                | Delete product                    | Admin       |
| GET    | /api/cart                        | Get logged-in user's cart          | Yes         |
| POST   | /api/cart                          | Add item to cart                    | Yes         |
| PUT    | /api/cart/:cartItemId                | Update quantity                      | Yes         |
| DELETE | /api/cart/:cartItemId                  | Remove item                            | Yes         |
| POST   | /api/orders/checkout                     | Place order from cart                   | Yes         |
| GET    | /api/orders/my-orders                      | Get my order history                     | Yes         |
| GET    | /api/orders/all                              | Get all orders                            | Admin       |
| PUT    | /api/orders/:id/status                         | Update order status                        | Admin       |

## Notes for Viva / Submission
- Passwords are hashed with **bcrypt** before storing — never stored in plain text.
- Authentication uses **JWT tokens** stored in the browser's `localStorage` and sent
  via `Authorization: Bearer <token>` header on protected requests.
- Admin-only routes are protected by an `requireAdmin` middleware that checks the
  `role` field decoded from the JWT.
- Stock is automatically reduced when an order is placed, and checked before
  checkout to prevent overselling.
