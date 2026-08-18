const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'shopnest.db'));
db.pragma('journal_mode = WAL');

// ---------- Schema ----------
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  category TEXT NOT NULL,
  image TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(product_id) REFERENCES products(id),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  FOREIGN KEY(order_id) REFERENCES orders(id),
  FOREIGN KEY(product_id) REFERENCES products(id)
);
`);

// ---------- Auto-seed ----------
const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
if (userCount === 0) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)')
    .run('Admin', 'admin@shopnest.com', hash, 'admin');
  console.log('Seeded admin user: admin@shopnest.com / admin123');
}

const productCount = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
if (productCount === 0) {
  const products = [
    ['Wireless Headphones', 'Over-ear Bluetooth headphones with noise cancellation.', 2499, 'Electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', 25],
    ['Smart Watch', 'Fitness tracking smart watch with heart-rate monitor.', 3499, 'Electronics', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500', 18],
    ['Cotton T-Shirt', 'Soft 100% cotton crew-neck t-shirt.', 499, 'Fashion', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500', 60],
    ['Running Shoes', 'Lightweight breathable running shoes.', 2999, 'Fashion', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', 30],
    ['Coffee Maker', 'Automatic drip coffee maker, 1.2L capacity.', 1899, 'Home', 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500', 15],
    ['Table Lamp', 'Minimalist LED table lamp with touch control.', 899, 'Home', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500', 40],
    ['Yoga Mat', 'Non-slip eco-friendly yoga mat, 6mm thick.', 799, 'Sports', 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=500', 35],
    ['Backpack', 'Water-resistant travel backpack, 30L.', 1599, 'Fashion', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', 22],
  ];
  const insert = db.prepare('INSERT INTO products (name, description, price, category, image, stock) VALUES (?, ?, ?, ?, ?, ?)');
  const insertMany = db.transaction((rows) => { for (const r of rows) insert.run(...r); });
  insertMany(products);
  console.log('Seeded 8 sample products');
}

module.exports = db;
