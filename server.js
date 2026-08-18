const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

require('./db'); // initializes and seeds the database

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- API ROUTES ----------
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`\n🛒 ShopNest server running at http://localhost:${PORT}`);
  console.log(`   Admin login -> email: admin@shopnest.com | password: admin123\n`);
});
