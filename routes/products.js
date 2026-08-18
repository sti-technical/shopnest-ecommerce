const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// ---------- GET all products (public, supports ?search= & ?category=) ----------
router.get('/', (req, res) => {
  const { search, category } = req.query;
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  query += ' ORDER BY created_at DESC';

  const products = db.prepare(query).all(...params);
  res.json(products);
});

// ---------- GET distinct categories (public) ----------
router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT DISTINCT category FROM products').all();
  res.json(categories.map((c) => c.category));
});

// ---------- GET single product (public) ----------
router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json(product);
});

// ---------- CREATE product (admin only) ----------
router.post('/', authenticate, requireAdmin, (req, res) => {
  const { name, description, price, stock, category, image } = req.body;
  if (!name || !price) {
    return res.status(400).json({ error: 'Name and price are required.' });
  }

  const info = db
    .prepare(
      'INSERT INTO products (name, description, price, stock, category, image) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(
      name,
      description || '',
      price,
      stock || 0,
      category || 'General',
      image || 'https://picsum.photos/400/300'
    );

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(product);
});

// ---------- UPDATE product (admin only) ----------
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  const { name, description, price, stock, category, image } = req.body;
  db.prepare(
    `UPDATE products SET name=?, description=?, price=?, stock=?, category=?, image=? WHERE id=?`
  ).run(
    name ?? product.name,
    description ?? product.description,
    price ?? product.price,
    stock ?? product.stock,
    category ?? product.category,
    image ?? product.image,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// ---------- DELETE product (admin only) ----------
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ message: 'Product deleted successfully.' });
});

module.exports = router;
