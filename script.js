/* ============================================================
   PCUD SUPPLIES HUB — script.js
   "Database" powered by localStorage
   ============================================================ */

/* ============================================================
   SECTION 1: DATABASE (localStorage)
   All data is stored here — acts as the database
   ============================================================ */

// --- Users Table ---
const DB_USERS    = 'pcud_users';
const DB_ORDERS   = 'pcud_orders';
const DB_PRODUCTS = 'pcud_products';
const DB_SESSION  = 'pcud_session';

function dbGetUsers()      { return JSON.parse(localStorage.getItem(DB_USERS)    || '[]'); }
function dbSaveUsers(data) { localStorage.setItem(DB_USERS,    JSON.stringify(data)); }

function dbGetOrders()      { return JSON.parse(localStorage.getItem(DB_ORDERS)   || '[]'); }
function dbSaveOrders(data) { localStorage.setItem(DB_ORDERS,   JSON.stringify(data)); }

function dbGetProducts()      { return JSON.parse(localStorage.getItem(DB_PRODUCTS) || 'null'); }
function dbSaveProducts(data) { localStorage.setItem(DB_PRODUCTS, JSON.stringify(data)); }

function dbGetSession()      { return JSON.parse(localStorage.getItem(DB_SESSION)  || 'null'); }
function dbSaveSession(data) { localStorage.setItem(DB_SESSION,  JSON.stringify(data)); }
function dbClearSession()    { localStorage.removeItem(DB_SESSION); }

/* ============================================================
   SECTION 2: SEED DATA (Default records on first load)
   ============================================================ */

// Default Products (16 items) — stock field added
const DEFAULT_PRODUCTS = [
  { id: 1,  name: 'Ballpen Blue',      price: 8,  cat: 'writing', em: 'fa-solid fa-pen',             stock: 50 },
  { id: 2,  name: 'Ballpen Black',     price: 8,  cat: 'writing', em: 'fa-solid fa-pen-nib',          stock: 50 },
  { id: 3,  name: 'Pencil #2',         price: 6,  cat: 'writing', em: 'fa-solid fa-pencil',           stock: 30 },
  { id: 4,  name: 'Highlighter',       price: 25, cat: 'writing', em: 'fa-solid fa-highlighter',      stock: 20 },
  { id: 5,  name: 'Permanent Marker',  price: 30, cat: 'writing', em: 'fa-solid fa-marker',           stock: 3  },
  { id: 6,  name: 'Notebook Big',      price: 55, cat: 'paper',   em: 'fa-solid fa-book',             stock: 15 },
  { id: 7,  name: 'Notebook Small',    price: 35, cat: 'paper',   em: 'fa-solid fa-book-open',        stock: 25 },
  { id: 8,  name: 'Pad Paper',         price: 18, cat: 'paper',   em: 'fa-solid fa-file-lines',       stock: 40 },
  { id: 9,  name: 'Index Cards',       price: 15, cat: 'paper',   em: 'fa-solid fa-layer-group',      stock: 0  },
  { id: 10, name: 'Bond Paper (10s)',  price: 12, cat: 'paper',   em: 'fa-solid fa-file',             stock: 10 },
  { id: 11, name: 'Coloring Pens',     price: 75, cat: 'art',     em: 'fa-solid fa-palette',          stock: 8  },
  { id: 12, name: 'Watercolor Set',    price: 95, cat: 'art',     em: 'fa-solid fa-paintbrush',       stock: 5  },
  { id: 13, name: 'Ruler 30cm',        price: 20, cat: 'org',     em: 'fa-solid fa-ruler',            stock: 0  },
  { id: 14, name: 'Folder',            price: 18, cat: 'org',     em: 'fa-solid fa-folder',           stock: 22 },
  { id: 15, name: 'Scotch Tape',       price: 15, cat: 'org',     em: 'fa-solid fa-tape',             stock: 12 },
  { id: 16, name: 'Stapler',           price: 85, cat: 'org',     em: 'fa-solid fa-stapler',          stock: 4  },
];

// Default Users
const DEFAULT_USERS = [
  { id: 'admin',    name: 'Admin',        course: '',         role: 'admin',   pw: 'admin123' },
  { id: 'student1', name: 'Maria Santos', course: 'BSCPE-2A', role: 'student', pw: '1234'    },
];

// Version check — clears old emoji products so FA icons load fresh
const DB_VERSION = 'pcud_ver';
const CURRENT_VERSION = '2';
if (localStorage.getItem(DB_VERSION) !== CURRENT_VERSION) {
  localStorage.removeItem(DB_PRODUCTS);
  localStorage.setItem(DB_VERSION, CURRENT_VERSION);
}

if (!dbGetProducts())       { dbSaveProducts(DEFAULT_PRODUCTS); }
if (!dbGetUsers().length)   { dbSaveUsers(DEFAULT_USERS); }

/* ============================================================
   SECTION 3: APP STATE (in-memory variables)
   ============================================================ */
let currentUser = null;   // logged-in user object
let cart        = [];     // current cart items
let currentCat  = 'all'; // active product category filter
let selectedPay = null;   // selected payment method

/* ============================================================
   SECTION 4: PAGE NAVIGATION
   ============================================================ */
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');

  // Render page content when navigating
  if (pageId === 'page-store')    renderStore();
  if (pageId === 'page-cart')     renderCart();
  if (pageId === 'page-checkout') renderCheckoutSummary();
  if (pageId === 'page-orders')   renderMyOrders();
  if (pageId === 'page-admin')    renderAdminOrders();
}

/* ============================================================
   SECTION 5: AUTHENTICATION
   ============================================================ */

// LOGIN
function doLogin() {
  const id = document.getElementById('lid').value.trim();
  const pw = document.getElementById('lpw').value;
  const errEl = document.getElementById('lerr');

  if (!id || !pw) { showError(errEl, 'Please fill in all fields.'); return; }

  const user = dbGetUsers().find(u => u.id === id && u.pw === pw);
  if (!user)  { showError(errEl, 'Invalid ID or password. Try: student1 / 1234'); return; }

  errEl.classList.remove('show');
  loginUser(user);
}

// REGISTER
function doRegister() {
  const name   = document.getElementById('rname').value.trim();
  const id     = document.getElementById('rid').value.trim();
  const course = document.getElementById('rcourse').value.trim();
  const role   = document.getElementById('rrole').value;
  const pw     = document.getElementById('rpw').value;
  const pw2    = document.getElementById('rpw2').value;
  const errEl  = document.getElementById('rerr');

  if (!name || !id || !pw || !pw2) { showError(errEl, 'Please fill in all required fields.'); return; }
  if (pw !== pw2)  { showError(errEl, 'Passwords do not match.'); return; }
  if (pw.length < 4) { showError(errEl, 'Password must be at least 4 characters.'); return; }

  const users = dbGetUsers();
  if (users.find(u => u.id === id)) { showError(errEl, 'Student ID already registered.'); return; }

  // Save new user to database
  const newUser = { id, name, course, role, pw };
  users.push(newUser);
  dbSaveUsers(users);

  // Clear register form
  ['rname', 'rid', 'rcourse', 'rpw', 'rpw2'].forEach(fieldId => {
    document.getElementById(fieldId).value = '';
  });
  errEl.classList.remove('show');

  loginUser(newUser);
  showToast('🎉 Account created! Welcome, ' + newUser.name.split(' ')[0] + '!');
}

// ADMIN QUICK LOGIN — now hidden, triggered by secret modal only
function adminLogin() {
  const u = dbGetUsers().find(u => u.id === 'admin');
  if (u) loginUser(u);
}

// LOGIN USER — set session and navigate
function loginUser(user) {
  currentUser = user;
  dbSaveSession(user); // auto-login session

  cart = []; // reset cart on login
  updateCartBadge();

  if (user.role === 'admin') {
    showPage('page-admin');
  } else {
    document.getElementById('nav-av').textContent = user.name.charAt(0).toUpperCase();
    updateNotifBadge();
    showPage('page-store');
  }
}

// LOGOUT
function doLogout() {
  currentUser = null;
  cart        = [];
  selectedPay = null;
  dbClearSession();
  updateCartBadge();

  // Clear login form
  document.getElementById('lid').value = '';
  document.getElementById('lpw').value = '';
  document.getElementById('lerr').classList.remove('show');

  showPage('page-login');
}

/* ============================================================
   SECTION 6: STORE — PRODUCTS
   ============================================================ */

function renderStore() {
  const products = dbGetProducts();
  const searchQ  = (document.getElementById('search-inp').value || '').toLowerCase();

  // Filter by category and search query
  const filtered = products.filter(p => {
    const matchCat    = currentCat === 'all' || p.cat === currentCat;
    const matchSearch = p.name.toLowerCase().includes(searchQ);
    return matchCat && matchSearch;
  });

  const grid = document.getElementById('prod-grid');

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty-msg">
        <div class="empty-ic">🔍</div>
        <p>No products found.</p>
        <small>Try a different search or category.</small>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map((p, i) => {
    const stock    = p.stock ?? 0;
    const outStock = stock === 0;
    const lowStock = stock > 0 && stock <= 5;
    const stockBadge = outStock
      ? `<span class="stock-badge out"><i class="fa-solid fa-xmark"></i> Out of Stock</span>`
      : lowStock
        ? `<span class="stock-badge low"><i class="fa-solid fa-triangle-exclamation"></i> Low: ${stock} left</span>`
        : `<span class="stock-badge ok"><i class="fa-solid fa-check"></i> In Stock (${stock})</span>`;
    return `
    <div class="prod-card ${outStock ? 'out-of-stock' : ''}" style="animation-delay:${i * 0.04}s">
      <div class="prod-em"><i class="${p.em}"></i></div>
      <div class="prod-name">${p.name}</div>
      <div class="prod-price">&#8369;${p.price.toFixed(2)}</div>
      ${stockBadge}
      <button class="btn-atc" onclick="addToCart(${p.id})" ${outStock ? 'disabled' : ''}>${outStock ? '<i class="fa-solid fa-ban"></i> Out of Stock' : '<i class="fa-solid fa-plus"></i> Add to Cart'}</button>
    </div>`;
  }).join('');

  // Update stats
  const myOrders = dbGetOrders().filter(o => o.userId === currentUser?.id);
  document.getElementById('s-prods').textContent  = products.length;
  document.getElementById('s-cart').textContent   = cart.reduce((sum, c) => sum + c.qty, 0);
  document.getElementById('s-orders').textContent = myOrders.length;
}

function setCat(cat, btn) {
  currentCat = cat;
  document.querySelectorAll('.fb').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderStore();
}

function filterProds() { renderStore(); }

/* ============================================================
   SECTION 7: CART
   ============================================================ */

function addToCart(productId) {
  const products = dbGetProducts();
  const product  = products.find(p => p.id === productId);
  if (!product) return;

  const stock = product.stock ?? 0;
  if (stock <= 0) { showToast('❌ ' + product.name + ' is out of stock!'); return; }

  // Check if adding more than available stock
  const existing = cart.find(c => c.id === productId);
  const currentQty = existing ? existing.qty : 0;
  if (currentQty >= stock) {
    showToast('⚠️ Only ' + stock + ' left in stock!');
    return;
  }

  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  updateCartBadge();
  showToast(product.em + ' ' + product.name + ' added to cart!');
  renderStore();
}

function updateCartBadge() {
  const total = cart.reduce((sum, c) => sum + c.qty, 0);
  document.getElementById('cart-badge').textContent = total;
}

function goCart() { showPage('page-cart'); }

function renderCart() {
  const listEl = document.getElementById('cart-list');
  const sumEl  = document.getElementById('cart-sum');

  if (!cart.length) {
    listEl.innerHTML = `
      <div class="empty-msg">
        <div class="empty-ic">🛒</div>
        <p>Your cart is empty.</p>
        <small>Go back and add some products!</small>
      </div>`;
    sumEl.innerHTML = '';
    return;
  }

  listEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="ci-em"><i class="${item.em}"></i></div>
      <div class="ci-info">
        <div class="ci-name">${item.name}</div>
        <div class="ci-price">&#8369;${(item.price * item.qty).toFixed(2)}</div>
      </div>
      <div class="ci-ctrl">
        <button class="qbtn" onclick="changeQty(${item.id}, -1)">&#8722;</button>
        <span class="qnum">${item.qty}</span>
        <button class="qbtn" onclick="changeQty(${item.id}, 1)">+</button>
        <button class="rem-btn" onclick="removeFromCart(${item.id})"><i class="fa-solid fa-trash"></i> Remove</button>
      </div>
    </div>`).join('');

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

  sumEl.innerHTML = `
    <div class="cart-sum">
      <div class="sum-row"><span>Subtotal</span><span>&#8369;${subtotal.toFixed(2)}</span></div>
      <div class="sum-row"><span>Delivery</span><span style="color:var(--green);font-weight:700"><i class="fa-solid fa-truck"></i> FREE</span></div>
      <div class="sum-row total"><span>Total</span><span>&#8369;${subtotal.toFixed(2)}</span></div>
      <br/>
      <button class="btn-main" onclick="showPage('page-checkout')"><i class="fa-solid fa-arrow-right"></i> Proceed to Checkout</button>
    </div>`;
}

function changeQty(productId, delta) {
  const item = cart.find(c => c.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(productId);
  else { updateCartBadge(); renderCart(); }
}

function removeFromCart(productId) {
  cart = cart.filter(c => c.id !== productId);
  updateCartBadge();
  renderCart();
  showToast('Item removed from cart.');
}

/* ============================================================
   SECTION 8: CHECKOUT
   ============================================================ */

function renderCheckoutSummary() {
  const el       = document.getElementById('ck-summary');
  const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

  el.innerHTML = cart.map(item => `
    <div class="ck-sum-item">
      <span><i class="${item.em}"></i> ${item.name} &times;${item.qty}</span>
      <span>&#8369;${(item.price * item.qty).toFixed(2)}</span>
    </div>`).join('')
    + `<div class="ck-sum-total"><span>Total</span><span>&#8369;${subtotal.toFixed(2)}</span></div>`;

  // Reset payment selection
  selectedPay = null;
  document.querySelectorAll('.pay-card').forEach(p => p.classList.remove('sel'));
  document.getElementById('gcash-box').classList.remove('show');
}

function selPay(type) {
  selectedPay = type;
  document.querySelectorAll('.pay-card').forEach(p => p.classList.remove('sel'));
  document.getElementById('pc-' + type).classList.add('sel');

  if (type === 'gcash') document.getElementById('gcash-box').classList.add('show');
  else                  document.getElementById('gcash-box').classList.remove('show');
}

function placeOrder() {
  // Validations
  if (!cart.length)    { showToast('⚠️ Your cart is empty!'); return; }
  if (!selectedPay)    { showToast('⚠️ Please select a payment method.'); return; }

  const note = document.getElementById('ck-note').value.trim();
  if (!note) { showToast('⚠️ Please enter your room number or pickup location.'); return; }

  // Build order object
  const orderId  = 'ORD-' + Date.now().toString().slice(-6);
  const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const newOrder = {
    id:       orderId,
    userId:   currentUser.id,
    userName: currentUser.name,
    items:    [...cart],
    total:    subtotal,
    payment:  selectedPay,
    note:     note,
    status:   'Processing',
    date:     new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
  };

  // Save order to database
  const orders = dbGetOrders();
  orders.push(newOrder);
  dbSaveOrders(orders);

  // Deduct stock for each ordered item
  const products = dbGetProducts();
  cart.forEach(item => {
    const prod = products.find(p => p.id === item.id);
    if (prod) prod.stock = Math.max(0, (prod.stock ?? 0) - item.qty);
  });
  dbSaveProducts(products);

  // Reset cart and payment
  cart        = [];
  selectedPay = null;
  updateCartBadge();
  document.getElementById('ck-note').value = '';

  // Show confirmation
  document.getElementById('conf-msg').textContent =
    `Order #${orderId} received! Payment: ${newOrder.payment === 'gcash' ? 'GCash QR' : 'Cash on Pickup'}. Pickup/Delivery: ${note}.`;

  showPage('page-confirm');
  showToast('🎉 Order placed successfully!');
}

/* ============================================================
   SECTION 9: MY ORDERS
   ============================================================ */

function renderMyOrders() {
  const el     = document.getElementById('orders-wrap');
  const orders = dbGetOrders()
    .filter(o => o.userId === currentUser?.id)
    .reverse(); // newest first

  if (!orders.length) {
    el.innerHTML = `
      <div class="empty-msg">
        <div class="empty-ic">📦</div>
        <p>No orders yet.</p>
        <small>Place your first order to see it here.</small>
      </div>`;
    return;
  }

  el.innerHTML = orders.map(o => `
    <div class="ord-card">
      <div class="ord-top">
        <span class="ord-id"><i class="fa-solid fa-hashtag"></i> ${o.id}</span>
        <span class="ord-badge ${o.status.toLowerCase().replace(/ /g, '')}">${o.status}</span>
      </div>
      <div class="ord-items">${o.items.map(i => `<i class="${i.em}"></i> ${i.name} &times;${i.qty}`).join(' &nbsp;&bull;&nbsp; ')}</div>
      <div class="ord-meta"><strong>&#8369;${o.total.toFixed(2)}</strong> &bull; ${o.date} &bull; ${o.payment === 'gcash' ? '<i class="fa-solid fa-mobile-screen-button"></i> GCash' : '<i class="fa-solid fa-money-bills"></i> Cash'}</div>
      <div class="ord-meta" style="margin-top:4px"><i class="fa-solid fa-location-dot" style="color:var(--red)"></i> ${o.note}</div>
    </div>`).join('');
}

/* ============================================================
   SECTION 10: ADMIN PANEL
   ============================================================ */

function aTab(tab, btn) {
  document.querySelectorAll('.adm-sec').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('adm-' + tab).classList.add('active');
  if (btn) btn.classList.add('active');

  if (tab === 'orders')    renderAdminOrders();
  if (tab === 'products')  renderAdminProducts();
  if (tab === 'inquiries') renderAdminInquiries();
}

// --- Admin: All Orders --- (FIXED: select value set via JS, not HTML attribute)
function renderAdminOrders() {
  const el     = document.getElementById('adm-ord-list');
  const orders = dbGetOrders().slice().reverse();

  if (!orders.length) {
    el.innerHTML = '<p style="color:var(--muted)">No orders yet.</p>';
    return;
  }

  el.innerHTML = orders.map(o => `
    <div class="adm-ord-card" id="ord-card-${o.id}">
      <div class="adm-ord-top">
        <strong><i class="fa-solid fa-hashtag"></i> ${o.id}</strong>
        <span class="ord-badge ${o.status.toLowerCase().replace(/ /g,'')}">${o.status}</span>
      </div>
      <div class="adm-det"><i class="fa-solid fa-user" style="color:var(--blue)"></i> ${o.userName} &nbsp;&bull;&nbsp; <i class="fa-solid fa-credit-card" style="color:var(--blue)"></i> ${o.payment === 'gcash' ? 'GCash QR' : 'Cash on Pickup'}</div>
      <div class="adm-det"><i class="fa-solid fa-location-dot" style="color:var(--red)"></i> ${o.note}</div>
      <div class="adm-det">${o.items.map(it => `<i class="${it.em}"></i> ${it.name} &times;${it.qty}`).join(' &nbsp;&bull;&nbsp; ')}</div>
      <div class="adm-det"><strong>Total: &#8369;${o.total.toFixed(2)}</strong></div>
      <div style="display:flex;align-items:center;gap:10px;margin-top:8px;flex-wrap:wrap">
        <select class="status-sel" data-orderid="${o.id}">
          <option value="Processing">Processing</option>
          <option value="On the Way">On the Way</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <button class="btn-stock" onclick="saveOrderStatus('${o.id}')">
          <i class="fa-solid fa-floppy-disk"></i> Save Status
        </button>
      </div>
    </div>`).join('');

  // Set correct select value via JS AFTER innerHTML renders
  // This avoids the bug where HTML 'selected' attribute doesn't reflect properly
  orders.forEach(o => {
    const sel = document.querySelector(`#ord-card-${o.id} .status-sel`);
    if (sel) sel.value = o.status;
  });
}

// Triggered by the Save Status button — reads the select value and saves
function saveOrderStatus(orderId) {
  const sel = document.querySelector(`#ord-card-${orderId} .status-sel`);
  if (!sel) return;
  const newStatus = sel.value;
  updateOrderStatus(orderId, newStatus);
}

// FIXED: now uses order ID (unique) instead of array index
function updateOrderStatus(orderId, newStatus) {
  // 1. Read fresh copy from localStorage
  const orders = dbGetOrders();
  const order  = orders.find(o => o.id === orderId);

  if (!order) { showToast('Order not found.'); return; }

  // 2. Update status
  order.status = newStatus;

  // 3. Save back to localStorage immediately
  dbSaveOrders(orders);

  // 4. Verify it was saved correctly
  const verify = dbGetOrders().find(o => o.id === orderId);
  if (!verify || verify.status !== newStatus) {
    showToast('Save failed — please try again.');
    return;
  }

  // 5. Update the badge in the card
  const badge = document.querySelector(`#ord-card-${orderId} .ord-badge`);
  if (badge) {
    badge.className  = 'ord-badge ' + newStatus.toLowerCase().replace(/ /g, '');
    badge.textContent = newStatus;
  }

  // 6. Make sure the select shows the correct value
  const sel = document.querySelector(`#ord-card-${orderId} .status-sel`);
  if (sel) sel.value = newStatus;

  showToast('Saved: ' + orderId + ' is now ' + newStatus);

  // 7. Notify the student
  addNotification(order.userId, {
    orderId: orderId,
    message: 'Your order #' + orderId + ' is now: ' + newStatus,
    status:  newStatus,
    time:    new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
    date:    new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
    read:    false,
  });
}

// --- Admin: Products ---
function renderAdminProducts() {
  const el       = document.getElementById('adm-prod-list');
  const products = dbGetProducts();

  el.innerHTML = products.map(p => {
    const stock    = p.stock ?? 0;
    const outStock = stock === 0;
    const lowStock = stock > 0 && stock <= 5;
    const stockColor = outStock ? 'var(--red)' : lowStock ? '#c49b00' : 'var(--green)';
    const stockIcon  = outStock ? 'fa-xmark' : lowStock ? 'fa-triangle-exclamation' : 'fa-check';
    const stockLabel = outStock ? 'Out of Stock' : lowStock ? 'Low Stock' : 'In Stock';
    return `
    <div class="adm-prod-item">
      <div class="prod-icon-box"><i class="${p.em}"></i></div>
      <div class="info">
        <strong>${p.name}</strong>
        <span>&#8369;${p.price} &nbsp;&bull;&nbsp; ${p.cat} &nbsp;&bull;&nbsp; <span style="color:${stockColor};font-weight:700"><i class="fa-solid ${stockIcon}"></i> ${stockLabel} (${stock})</span></span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
        <input type="number" min="0" value="${stock}" id="stock-${p.id}"
          style="width:70px;padding:6px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-family:inherit;outline:none;"
          onkeydown="if(event.key==='Enter') updateStock(${p.id})"
        />
        <button class="btn-stock" onclick="updateStock(${p.id})"><i class="fa-solid fa-floppy-disk"></i> Save</button>
        <button class="btn-del" onclick="deleteProduct(${p.id})"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`;
  }).join('');
}

function updateStock(productId) {
  const input    = document.getElementById('stock-' + productId);
  const newStock = parseInt(input.value);
  if (isNaN(newStock) || newStock < 0) { showToast('⚠️ Enter a valid stock number.'); return; }

  const products = dbGetProducts();
  const product  = products.find(p => p.id === productId);
  if (!product) return;

  product.stock = newStock;
  dbSaveProducts(products);
  renderAdminProducts();
  showToast('📦 Stock updated: ' + product.name + ' → ' + newStock + ' pcs');
}

function addProd() {
  const name  = document.getElementById('np-name').value.trim();
  const price = parseFloat(document.getElementById('np-price').value);
  const cat   = document.getElementById('np-cat').value;
  const em    = document.getElementById('np-em').value.trim() || '📦';
  const stock = parseInt(document.getElementById('np-stock').value) || 0;

  if (!name || isNaN(price)) {
    showToast('⚠️ Please fill in product name and price.');
    return;
  }

  const products = dbGetProducts();
  const newId    = Math.max(...products.map(p => p.id), 0) + 1;
  products.push({ id: newId, name, price, cat, em, stock });
  dbSaveProducts(products);

  // Clear form
  document.getElementById('np-name').value  = '';
  document.getElementById('np-price').value = '';
  document.getElementById('np-em').value    = '';
  document.getElementById('np-stock').value = '';

  renderAdminProducts();
  showToast('✅ Product "' + name + '" added with ' + stock + ' stock!');
}

function deleteProduct(productId) {
  if (!confirm('Delete this product?')) return;
  dbSaveProducts(dbGetProducts().filter(p => p.id !== productId));
  renderAdminProducts();
  showToast('🗑️ Product deleted.');
}

// --- Admin: Inquiries (Delivery Notes) ---
function renderAdminInquiries() {
  const el    = document.getElementById('adm-inq-list');
  const notes = dbGetOrders().filter(o => o.note).slice().reverse();

  if (!notes.length) {
    el.innerHTML = '<p style="color:var(--muted)">No delivery notes yet.</p>';
    return;
  }

  el.innerHTML = notes.map(o => `
    <div class="inq-card">
      <strong><i class="fa-solid fa-hashtag"></i> ${o.id} &mdash; <i class="fa-solid fa-user"></i> ${o.userName}</strong>
      <p><i class="fa-solid fa-location-dot" style="color:var(--red)"></i> ${o.note} &nbsp;&bull;&nbsp; <i class="fa-regular fa-calendar"></i> ${o.date}</p>
    </div>`).join('');
}

/* ============================================================
   SECTION 11: TOAST NOTIFICATION
   ============================================================ */
let toastTimer;
function showToast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ============================================================
   SECTION 12: HELPERS
   ============================================================ */
function showError(el, message) {
  el.textContent = '⚠️ ' + message;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 4000);
}

/* ============================================================
   SECTION 13: NOTIFICATION SYSTEM
   Students get notified when their order status changes
   ============================================================ */

const DB_NOTIFS = 'pcud_notifs';

function dbGetNotifs(userId)      { return JSON.parse(localStorage.getItem(DB_NOTIFS + '_' + userId) || '[]'); }
function dbSaveNotifs(userId, data) { localStorage.setItem(DB_NOTIFS + '_' + userId, JSON.stringify(data)); }

// Add a new notification for a user
function addNotification(userId, notif) {
  const notifs = dbGetNotifs(userId);
  notifs.unshift(notif); // newest first
  dbSaveNotifs(userId, notifs);

  // If the current user is logged in and it's their notif, show bell badge
  if (currentUser && currentUser.id === userId) {
    updateNotifBadge();
    showOrderNotifPopup(notif);
  }
}

// Count unread notifs for current user
function getUnreadCount() {
  if (!currentUser) return 0;
  return dbGetNotifs(currentUser.id).filter(n => !n.read).length;
}

// Update the bell badge on navbar
function updateNotifBadge() {
  const count = getUnreadCount();
  const badge = document.getElementById('notif-badge');
  if (!badge) return;
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

// Show popup toast when student's order status changes
function showOrderNotifPopup(notif) {
  const icons = {
    'Processing': '<i class="fa-solid fa-rotate"></i>',
    'On the Way': '<i class="fa-solid fa-truck"></i>',
    'Delivered':  '<i class="fa-solid fa-circle-check"></i>',
    'Cancelled':  '<i class="fa-solid fa-circle-xmark"></i>',
  };
  showToast((icons[notif.status] || '') + ' ' + notif.message);
}

// Render notifications panel
function renderNotifications() {
  const panel  = document.getElementById('notif-panel');
  const notifs = dbGetNotifs(currentUser?.id || '');

  // Mark all as read
  const updated = notifs.map(n => ({ ...n, read: true }));
  dbSaveNotifs(currentUser.id, updated);
  updateNotifBadge();

  if (!notifs.length) {
    panel.innerHTML = `
      <div class="notif-header">
        <strong><i class="fa-solid fa-bell"></i> Notifications</strong>
        <button onclick="closeNotifPanel()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="notif-empty">
        <div style="font-size:40px;margin-bottom:10px;color:var(--border)"><i class="fa-solid fa-bell-slash"></i></div>
        <p>No notifications yet.</p>
        <small>You'll be notified when your order status changes.</small>
      </div>`;
    return;
  }

  const icons = {
    'Processing': '<i class="fa-solid fa-rotate" style="color:#856404"></i>',
    'On the Way': '<i class="fa-solid fa-truck" style="color:#055160"></i>',
    'Delivered':  '<i class="fa-solid fa-circle-check" style="color:var(--green)"></i>',
    'Cancelled':  '<i class="fa-solid fa-circle-xmark" style="color:var(--red)"></i>',
  };

  panel.innerHTML = `
    <div class="notif-header">
      <strong><i class="fa-solid fa-bell"></i> Notifications</strong>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="notif-clear-btn" onclick="clearNotifications()">Clear all</button>
        <button onclick="closeNotifPanel()"><i class="fa-solid fa-xmark"></i></button>
      </div>
    </div>
    <div class="notif-list">
      ${notifs.map(n => `
        <div class="notif-item ${n.read ? '' : 'unread'}">
          <div class="notif-icon">${icons[n.status] || '<i class="fa-solid fa-box"></i>'}</div>
          <div class="notif-body">
            <div class="notif-msg">${n.message}</div>
            <div class="notif-time">${n.date} &bull; ${n.time}</div>
          </div>
        </div>`).join('')}
    </div>`;
}

function toggleNotifPanel() {
  const panel = document.getElementById('notif-panel');
  if (panel.classList.contains('open')) {
    closeNotifPanel();
  } else {
    panel.classList.add('open');
    renderNotifications();
  }
}

function closeNotifPanel() {
  document.getElementById('notif-panel').classList.remove('open');
}

function clearNotifications() {
  dbSaveNotifs(currentUser.id, []);
  updateNotifBadge();
  renderNotifications();
}

// Close panel when clicking outside
document.addEventListener('click', function(e) {
  const panel   = document.getElementById('notif-panel');
  const bellBtn = document.getElementById('notif-btn');
  if (panel && panel.classList.contains('open')) {
    if (!panel.contains(e.target) && e.target !== bellBtn && !bellBtn?.contains(e.target)) {
      closeNotifPanel();
    }
  }
});

/* ============================================================
   SECTION 14: SECRET ADMIN ACCESS
   Hidden from students — only you know this shortcut!
   Shortcut: Ctrl + Shift + A  (on the Login page)
   ============================================================ */

function showAdminModal() {
  // Only show on login page
  if (!document.getElementById('page-login').classList.contains('active')) return;

  // Create modal if not existing
  if (document.getElementById('admin-modal')) {
    document.getElementById('admin-modal').style.display = 'flex';
    document.getElementById('adm-pw-inp').value = '';
    document.getElementById('adm-pw-inp').focus();
    document.getElementById('adm-modal-err').style.display = 'none';
    return;
  }

  const modal = document.createElement('div');
  modal.id = 'admin-modal';
  modal.innerHTML = `
    <div id="admin-modal-box">
      <div id="adm-modal-icon"><i class="fa-solid fa-screwdriver-wrench" style="font-size:38px;color:var(--blue)"></i></div>
      <h3>Admin Access</h3>
      <p>Enter your admin password to continue.</p>
      <div id="adm-modal-err"></div>
      <input type="password" id="adm-pw-inp" placeholder="Admin password" autocomplete="off"/>
      <div id="adm-modal-btns">
        <button id="adm-cancel-btn" onclick="closeAdminModal()"><i class="fa-solid fa-xmark"></i> Cancel</button>
        <button id="adm-login-btn" onclick="submitAdminLogin()"><i class="fa-solid fa-right-to-bracket"></i> Enter</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  // Close on backdrop click
  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeAdminModal();
  });

  // Enter key submits
  document.getElementById('adm-pw-inp').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') submitAdminLogin();
  });

  setTimeout(() => document.getElementById('adm-pw-inp').focus(), 100);
}

function submitAdminLogin() {
  const pw    = document.getElementById('adm-pw-inp').value;
  const errEl = document.getElementById('adm-modal-err');
  const admin = dbGetUsers().find(u => u.id === 'admin');

  if (!pw) { showModalErr(errEl, 'Please enter the password.'); return; }
  if (!admin || pw !== admin.pw) {
    showModalErr(errEl, 'Incorrect password.');
    document.getElementById('adm-pw-inp').value = '';
    document.getElementById('adm-pw-inp').focus();
    return;
  }

  closeAdminModal();
  loginUser(admin);
}

function closeAdminModal() {
  const modal = document.getElementById('admin-modal');
  if (modal) modal.style.display = 'none';
}

function showModalErr(el, msg) {
  el.textContent = '⚠️ ' + msg;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 3000);
}

// ---- Secret Keyboard Shortcut: Ctrl + Shift + A ----
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    e.preventDefault();
    showAdminModal();
  }
});

// ---- You can also change admin password here ----
// To change: go to Browser Console → type:
// changeAdminPassword('yournewpassword')
function changeAdminPassword(newPw) {
  if (!newPw || newPw.length < 4) { console.log('Password too short!'); return; }
  const users = dbGetUsers();
  const admin = users.find(u => u.id === 'admin');
  if (admin) {
    admin.pw = newPw;
    dbSaveUsers(users);
    console.log('✅ Admin password changed successfully!');
  }
}

(function initApp() {
  const session = dbGetSession();
  if (!session) return;

  const user = dbGetUsers().find(u => u.id === session.id && u.pw === session.pw);
  if (user) loginUser(user);
})();
