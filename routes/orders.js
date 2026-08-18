const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);

// ---------- PLACE ORDER (checkout) ----------
router.post('/checkout', (req, res) => {
  const { address } = req.body;

  const cartItems = db
    .prepare(
      `SELECT cart_items.*, products.price, products.stock, products.name
       FROM cart_items JOIN products ON cart_items.product_id = products.id
       WHERE cart_items.user_id = ?`
    )
    .all(req.user.id);

  if (cartItems.length === 0) {
    return res.status(400).json({ error: 'Your cart is empty.' });
  }

  // check stock
  for (const item of cartItems) {
    if (item.quantity > item.stock) {
      return res.status(400).json({ error: `Not enough stock for ${item.name}.` });
    }
  }

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const placeOrder = db.transaction(() => {
    const orderInfo = db
      .prepare('INSERT INTO orders (user_id, total, address, status) VALUES (?, ?, ?, ?)')
      .run(req.user.id, total, address || '', 'placed');

    const orderId = orderInfo.lastInsertRowid;

    const insertOrderItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)'
    );
    const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

    for (const item of cartItems) {
      insertOrderItem.run(orderId, item.product_id, item.quantity, item.price);
      updateStock.run(item.quantity, item.product_id);
    }

    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);

    return orderId;
  });

  const orderId = placeOrder();
  res.status(201).json({ message: 'Order placed successfully!', order_id: orderId, total });
});

// ---------- GET my orders ----------
router.get('/my-orders', (req, res) => {
  const orders = db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.id);

  const ordersWithItems = orders.map((order) => {
    const items = db
      .prepare(
        `SELECT order_items.*, products.name, products.image
         FROM order_items JOIN products ON order_items.product_id = products.id
         WHERE order_id = ?`
      )
      .all(order.id);
    return { ...order, items };
  });

  res.json(ordersWithItems);
});

// ---------- GET all orders (admin only) ----------
router.get('/all', requireAdmin, (req, res) => {
  const orders = db
    .prepare(
      `SELECT orders.*, users.name as customer_name, users.email as customer_email
       FROM orders JOIN users ON orders.user_id = users.id
       ORDER BY orders.created_at DESC`
    )
    .all();
  res.json(orders);
});

// ---------- UPDATE order status (admin only) ----------
router.put('/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: 'Order status updated.' });
});

module.exports = router;
