const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// All cart routes require login
router.use(authenticate);

// ---------- GET cart items for logged-in user ----------
router.get('/', (req, res) => {
  const items = db
    .prepare(
      `SELECT cart_items.id as cart_item_id, cart_items.quantity, products.*
       FROM cart_items
       JOIN products ON cart_items.product_id = products.id
       WHERE cart_items.user_id = ?`
    )
    .all(req.user.id);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  res.json({ items, total });
});

// ---------- ADD item to cart ----------
router.post('/', (req, res) => {
  const { product_id, quantity } = req.body;
  const qty = quantity && quantity > 0 ? quantity : 1;

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  const existing = db
    .prepare('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?')
    .get(req.user.id, product_id);

  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(qty, existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)').run(
      req.user.id,
      product_id,
      qty
    );
  }

  res.status(201).json({ message: 'Added to cart.' });
});

// ---------- UPDATE cart item quantity ----------
router.put('/:cartItemId', (req, res) => {
  const { quantity } = req.body;
  const item = db
    .prepare('SELECT * FROM cart_items WHERE id = ? AND user_id = ?')
    .get(req.params.cartItemId, req.user.id);

  if (!item) return res.status(404).json({ error: 'Cart item not found.' });
  if (quantity <= 0) {
    db.prepare('DELETE FROM cart_items WHERE id = ?').run(req.params.cartItemId);
    return res.json({ message: 'Item removed from cart.' });
  }

  db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, req.params.cartItemId);
  res.json({ message: 'Cart updated.' });
});

// ---------- REMOVE item from cart ----------
router.delete('/:cartItemId', (req, res) => {
  const item = db
    .prepare('SELECT * FROM cart_items WHERE id = ? AND user_id = ?')
    .get(req.params.cartItemId, req.user.id);

  if (!item) return res.status(404).json({ error: 'Cart item not found.' });

  db.prepare('DELETE FROM cart_items WHERE id = ?').run(req.params.cartItemId);
  res.json({ message: 'Item removed from cart.' });
});

module.exports = router;
