// db.js - SQLite database setup for ShopNest E-Commerce
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'shopnest.db'));

// ---------- CREATE TABLES ----------
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'customer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    category TEXT,
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total REAL NOT NULL,
    status TEXT DEFAULT 'placed',
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
`);

// ---------- SEED DATA (only if empty) ----------
const productCount = db.prepare('SELECT COUNT(*) as c FROM products').get().c;

if (productCount === 0) {
  const insertProduct = db.prepare(
    `INSERT INTO products (name, description, price, stock, category, image) VALUES (?, ?, ?, ?, ?, ?)`
  );

  const sampleProducts = [
    ['Wireless Headphones', 'Over-ear Bluetooth headphones with noise cancellation', 1999, 25, 'Electronics', 'https://picsum.photos/seed/headphones/400/300'],
    ['Smart Watch', 'Fitness tracker smartwatch with heart-rate monitor', 2499, 18, 'Electronics', 'https://picsum.photos/seed/smartwatch/400/300'],
    ['Running Shoes', 'Lightweight breathable running shoes', 1499, 40, 'Footwear', 'https://picsum.photos/seed/shoes/400/300'],
    ['Backpack', 'Water-resistant 30L travel backpack', 999, 30, 'Bags', 'https://picsum.photos/seed/backpack/400/300'],
    ['Coffee Maker', 'Automatic drip coffee maker, 1.5L capacity', 1799, 15, 'Home Appliances', 'https://picsum.photos/seed/coffeemaker/400/300'],
    ['Desk Lamp', 'LED desk lamp with adjustable brightness', 599, 50, 'Home Appliances', 'https://picsum.photos/seed/lamp/400/300'],
    ['Yoga Mat', 'Non-slip eco-friendly yoga mat', 499, 60, 'Fitness', 'https://picsum.photos/seed/yogamat/400/300'],
    ['Sunglasses', 'UV-protection polarized sunglasses', 799, 35, 'Accessories', 'https://picsum.photos/seed/sunglasses/400/300']
  ];

  const insertMany = db.transaction((rows) => {
    for (const row of rows) insertProduct.run(...row);
  });
  insertMany(sampleProducts);
  console.log('Seeded sample products.');
}

// ---------- SEED ADMIN USER (only if not exists) ----------
const admin = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@shopnest.com');
if (!admin) {
  const hashedPw = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)')
    .run('Admin', 'admin@shopnest.com', hashedPw, 'admin');
  console.log('Seeded admin user: admin@shopnest.com / admin123');
}

module.exports = db;
