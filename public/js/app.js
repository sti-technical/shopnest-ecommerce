// ---------- API helper ----------
const API = '/api';

function getToken() { return localStorage.getItem('token'); }
function getUser() {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
}
function setSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
function isLoggedIn() { return !!getToken(); }
function isAdmin() { const u = getUser(); return u && u.role === 'admin'; }

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  let data = null;
  try { data = await res.json(); } catch (e) { /* no body */ }
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

function money(n) { return `₹${Number(n).toFixed(2)}`; }

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ---------- Navbar ----------
async function renderNavbar() {
  const el = document.getElementById('navbar');
  if (!el) return;
  const user = getUser();
  let cartCount = 0;
  if (isLoggedIn()) {
    try {
      const cart = await api('/cart');
      cartCount = cart.reduce((s, i) => s + i.quantity, 0);
    } catch (e) { /* ignore */ }
  }

  el.innerHTML = `
    <a href="/index.html" class="brand">Shop<span>Nest</span></a>
    <div class="nav-links">
      <a href="/index.html">Home</a>
      ${isLoggedIn() ? `
        <a href="/cart.html">Cart${cartCount ? `<span class="badge">${cartCount}</span>` : ''}</a>
        <a href="/orders.html">My Orders</a>
        ${isAdmin() ? '<a href="/admin.html">Admin</a>' : ''}
        <span style="color:#6b6b6b;font-size:0.9rem;">Hi, ${escapeHtml(user.name)}</span>
        <button id="logoutBtn">Logout</button>
      ` : `
        <a href="/login.html">Login</a>
        <a href="/register.html" class="btn btn-sm">Register</a>
      `}
    </div>
  `;

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearSession();
      window.location.href = '/index.html';
    });
  }
}

function requireLogin() {
  if (!isLoggedIn()) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

function requireAdmin() {
  if (!isLoggedIn() || !isAdmin()) {
    window.location.href = '/index.html';
    return false;
  }
  return true;
}

document.addEventListener('DOMContentLoaded', renderNavbar);
