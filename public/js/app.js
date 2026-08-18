// app.js - shared helpers used across all pages

const API = '/api';

function getToken() {
  return localStorage.getItem('token');
}
function getUser() {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
}
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}
function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

// ---------- NAVBAR RENDER ----------
function renderNavbar(activePage) {
  const user = getUser();
  const navEl = document.getElementById('navbar');
  if (!navEl) return;

  const cartCount = window.__cartCount || 0;

  navEl.innerHTML = `
    <div class="container">
      <a href="index.html" class="brand"><span class="brand-mark">SN</span> ShopNest</a>
      <div class="nav-links">
        <a href="index.html" class="${activePage === 'home' ? 'active' : ''}">Home</a>
        ${user ? `<a href="cart.html" class="${activePage === 'cart' ? 'active' : ''}">Cart <span class="cart-badge" id="navCartBadge">${cartCount}</span></a>` : ''}
        ${user ? `<a href="orders.html" class="${activePage === 'orders' ? 'active' : ''}">My Orders</a>` : ''}
        ${user && user.role === 'admin' ? `<a href="admin.html" class="${activePage === 'admin' ? 'active' : ''}">Admin</a>` : ''}
        ${user
          ? `<span style="color:var(--ink-soft)">Hi, ${user.name.split(' ')[0]}</span><button class="btn btn-outline btn-sm" onclick="logout()">Logout</button>`
          : `<a href="login.html" class="btn btn-outline btn-sm">Login</a><a href="register.html" class="btn btn-primary btn-sm">Sign Up</a>`}
      </div>
    </div>
  `;

  if (user) refreshCartCount();
}

async function refreshCartCount() {
  try {
    const data = await apiFetch('/cart');
    const count = data.items.reduce((s, i) => s + i.quantity, 0);
    window.__cartCount = count;
    const badge = document.getElementById('navCartBadge');
    if (badge) badge.textContent = count;
  } catch (e) {
    // not logged in or error - ignore
  }
}

function requireLogin(redirectTo = 'login.html') {
  if (!getToken()) {
    window.location.href = redirectTo;
    return false;
  }
  return true;
}

function requireAdmin() {
  const user = getUser();
  if (!user || user.role !== 'admin') {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

function formatPrice(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
