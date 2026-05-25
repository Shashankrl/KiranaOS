// KiranaOS Platform Core Logic and Architecture Workflow Telemetry Simulator

// 1. Initial State Data Model (Store products database)
const catalogDatabase = [
  { id: "k1", name: "Aashirvaad Shudh Chakki Atta 5kg", category: "grocery", price: 275, stock: 35, unit: "bag" },
  { id: "k2", name: "Fortune Soya Health Oil 1L", category: "grocery", price: 165, stock: 50, unit: "bottle" },
  { id: "k3", name: "Amul Pasteurised Butter 100g", category: "dairy", price: 58, stock: 8, unit: "pack" },
  { id: "k4", name: "Mother Dairy Toned Milk 1L", category: "dairy", price: 68, stock: 90, unit: "packet" },
  { id: "k5", name: "Thums Up Cola 750ml", category: "beverages", price: 40, stock: 4, unit: "bottle" },
  { id: "k6", name: "Tata Iodized Salt 1kg", category: "grocery", price: 30, stock: 150, unit: "packet" },
  { id: "k7", name: "Maggi 2-Minute Masala Noodles", category: "snacks", price: 15, stock: 6, unit: "pack" },
  { id: "k8", name: "Britannia Bourbon Biscuits", category: "snacks", price: 25, stock: 22, unit: "pack" }
];

const posCart = [];
const wholesaleDrafts = [];
let currentPanel = "pos";
let posSearchTerm = "";
let inventorySearchTerm = "";
let currentInventoryCategory = "all";
let todaySalesTotal = 15820; // Starts with preloaded initial offline sales

// 2. Initial Setup on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  setupNavigationControllers();
  renderPOSGrid();
  renderPOSCart();
  renderInventoryTable();
  updateAnalyticsDashboard();
  renderSVGRevenueChart();
  logSystemFlow("System Initialized", "Room SQLite", "Loaded offline-first database cache successfully.");
  feather.replace();
});

// 3. Navigation Controls
function setupNavigationControllers() {
  const tabs = document.querySelectorAll(".nav-item");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentPanel = tab.dataset.target;
      
      // Update workspaces visibility
      document.querySelectorAll(".workspace-panel").forEach(p => {
        if (!p.id) return;
        if (p.id === `workspace-${currentPanel}`) {
          p.style.display = "flex";
        } else p.style.display = "none";
      });
      
      logSystemFlow(`Panel Opened: ${currentPanel.toUpperCase()}`, "Inventory UI", `Switched layout module view.`);
      feather.replace();
    });
  });
}

// 4. POS Billing Logic
function renderPOSGrid() {
  const grid = document.getElementById("pos-catalog-grid");
  if (!grid) return;
  
  grid.innerHTML = "";
  
  const filtered = catalogDatabase.filter(p => 
    p.name.toLowerCase().includes(posSearchTerm.toLowerCase())
  );
  
  if (filtered.length === 0) {
    grid.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: var(--color-text-muted); padding: 3rem 1rem;'>No products matched your query.</p>";
    return;
  }
  
  filtered.forEach(p => {
    const card = document.createElement("div");
    card.className = "pos-card-item";
    
    let icon = "package";
    if (p.category === "dairy") icon = "coffee";
    if (p.category === "beverages") icon = "droplet";
    
    card.innerHTML = `
      <div class="pos-card-icon"><i data-feather="${icon}" style="width: 1.1rem;"></i></div>
      <h4 class="pos-card-title">${p.name}</h4>
      <span class="pos-card-price">₹${p.price}</span>
    `;
    
    card.addEventListener("click", () => addItemToCart(p));
    grid.appendChild(card);
  });
  
  feather.replace();
}

function addItemToCart(product) {
  const existing = posCart.find(item => item.product.id === product.id);
  if (existing) {
    if (existing.qty >= product.stock) {
      logSystemFlow("Stock Limit Alert", "Sales / Billing UI", `Cannot add more ${product.name}. Max stock is ${product.stock}.`);
      return;
    }
    existing.qty++;
  } else {
    posCart.push({ product, qty: 1 });
  }
  
  logSystemFlow("Cart Updated", "Sales / Billing UI", `Added 1x ${product.name} to checkout cart.`);
  renderPOSCart();
}

function renderPOSCart() {
  const list = document.getElementById("pos-cart-list");
  if (!list) return;
  
  list.innerHTML = "";
  
  if (posCart.length === 0) {
    list.innerHTML = "<div style='text-align: center; padding: 4rem 1rem; color: var(--color-text-muted);'><i data-feather='shopping-cart' style='width: 2.5rem; height: 2.5rem; stroke-width: 1.5; margin-bottom: 0.75rem;'></i><p>Your checkout cart is empty.</p></div>";
    feather.replace();
    updateCartTotals(0, 0, 0);
    return;
  }
  
  let subtotal = 0;
  
  posCart.forEach(item => {
    const sum = item.product.price * item.qty;
    subtotal += sum;
    
    const row = document.createElement("div");
    row.className = "cart-item-block";
    row.innerHTML = `
      <div class="cart-item-info">
        <h5>${item.product.name}</h5>
        <span>₹${item.product.price} / ${item.product.unit}</span>
      </div>
      <div class="cart-item-controls">
        <button class="cart-btn-qty" onclick="changeCartItemQty('${item.product.id}', -1)">-</button>
        <span>${item.qty}</span>
        <button class="cart-btn-qty" onclick="changeCartItemQty('${item.product.id}', 1)">+</button>
      </div>
      <span class="cart-item-price">₹${sum}</span>
    `;
    list.appendChild(row);
  });
  
  const tax = Math.round(subtotal * 0.18); // 18% GST (CGST/SGST)
  const discount = subtotal >= 400 ? 40 : 0; // Discount rule
  const total = subtotal + tax - discount;
  
  updateCartTotals(subtotal, tax, discount, total);
}

window.changeCartItemQty = function(id, delta) {
  const index = posCart.findIndex(item => item.product.id === id);
  if (index === -1) return;
  
  const cartItem = posCart[index];
  cartItem.qty += delta;
  
  if (cartItem.qty <= 0) {
    posCart.splice(index, 1);
    logSystemFlow("Item Removed", "Sales / Billing UI", `Removed ${cartItem.product.name} from checkout cart.`);
  } else if (cartItem.qty > cartItem.product.stock) {
    cartItem.qty = cartItem.product.stock;
    logSystemFlow("Stock Limit Reach", "Sales / Billing UI", `Adjusted quantity. Cannot exceed stock limit of ${cartItem.product.stock}.`);
  } else {
    logSystemFlow("Quantity Adjusted", "Sales / Billing UI", `Updated quantity of ${cartItem.product.name} to ${cartItem.qty}.`);
  }
  
  renderPOSCart();
};

window.clearPOSCart = function() {
  if (posCart.length === 0) return;
  posCart.length = 0;
  logSystemFlow("Cart Cleared", "Sales / Billing UI", "Emptied all items in active checkout cart.");
  renderPOSCart();
};

function updateCartTotals(subtotal, tax, discount, total = 0) {
  document.getElementById("sum-subtotal").innerText = `₹${subtotal}`;
  document.getElementById("sum-tax").innerText = `₹${tax}`;
  document.getElementById("sum-discount").innerText = `₹${discount}`;
  document.getElementById("sum-total").innerText = `₹${total}`;
}

// 5. Checkout Print Flow Simulation
window.checkoutCartItems = function() {
  if (posCart.length === 0) return;
  
  let subtotal = 0;
  const list = document.getElementById("bill-rows-list");
  list.innerHTML = "";
  
  posCart.forEach(item => {
    const sum = item.product.price * item.qty;
    subtotal += sum;
    
    // Deduct stock locally
    const catalogItem = catalogDatabase.find(p => p.id === item.product.id);
    if (catalogItem) {
      catalogItem.stock = Math.max(0, catalogItem.stock - item.qty);
    }
    
    const line = document.createElement("div");
    line.className = "bill-line";
    line.innerHTML = `
      <span>${item.product.name} (x${item.qty})</span>
      <span>₹${sum}</span>
    `;
    list.appendChild(line);
  });
  
  const tax = Math.round(subtotal * 0.18);
  const discount = subtotal >= 400 ? 40 : 0;
  const total = subtotal + tax - discount;
  
  todaySalesTotal += total;
  
  document.getElementById("bill-subtotal").innerText = `₹${subtotal}`;
  document.getElementById("bill-tax").innerText = `₹${tax}`;
  document.getElementById("bill-discount").innerText = `₹${discount}`;
  document.getElementById("bill-total").innerText = `₹${total}`;
  document.getElementById("bill-date").innerText = new Date().toLocaleString();
  
  // Show modal
  document.getElementById("bill-modal-overlay").style.display = "flex";
  
  // Dynamic Architecture Telemetry Pipeline Logs (Matches your SVG system layers flow!)
  logSystemFlow("Checkout Initiated", "Sales / Billing UI", "Processing checkout sequence.");
  setTimeout(() => logSystemFlow("Write DB Success", "Room SQLite", "Persisted updated inventory stocks and sales registers locally."), 400);
  setTimeout(() => logSystemFlow("Sync Payload Added", "Sync Manager", "Enqueued transaction delta in background synchronization worker queue."), 800);
  setTimeout(() => logSystemFlow("Payload Router Active", "API Gateway", "API Gateway authenticated JWT token and verified rate-limit limits."), 1200);
  setTimeout(() => logSystemFlow("Domain Event Dispatched", "Kafka Cluster", "Published 'SaleCreated' integration event securely to topic queues."), 1600);
  setTimeout(() => logSystemFlow("PostgreSQL Updated", "PostgreSQL Master", "Master record updated securely in primary transactional tables."), 2000);
  
  posCart.length = 0;
  renderPOSCart();
  renderInventoryTable();
  updateAnalyticsDashboard();
};

window.closeReceiptModal = function() {
  document.getElementById("bill-modal-overlay").style.display = "none";
};

// 6. Inventory Manager Logic
function renderInventoryTable() {
  const tbody = document.getElementById("inventory-rows");
  if (!tbody) return;
  
  tbody.innerHTML = "";
  
  const filtered = catalogDatabase.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(inventorySearchTerm.toLowerCase());
    const matchesCategory = currentInventoryCategory === "all" || p.category === currentInventoryCategory;
    return matchesSearch && matchesCategory;
  });
  
  filtered.forEach(p => {
    let statusClass = "success";
    let statusText = "In Stock";
    
    if (p.stock <= 5) {
      statusClass = "danger";
      statusText = "Low Stock";
    } else if (p.stock <= 15) {
      statusClass = "warning";
      statusText = "Reorder Warning";
    }
    
    const row = document.createElement("tr");
    row.innerHTML = `
      <td style="font-weight: 600;">${p.name}</td>
      <td style="text-transform: capitalize;">${p.category}</td>
      <td style="font-weight: 700;">₹${p.price}</td>
      <td>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <button class="cart-btn-qty" onclick="changeInventoryStock('${p.id}', -5)">-5</button>
          <span style="font-weight: bold; width: 30px; text-align: center;">${p.stock}</span>
          <button class="cart-btn-qty" onclick="changeInventoryStock('${p.id}', 5)">+5</button>
        </div>
      </td>
      <td><span class="badge ${statusClass}">${statusText}</span></td>
    `;
    tbody.appendChild(row);
  });
}

window.changeInventoryStock = function(id, amt) {
  const prod = catalogDatabase.find(p => p.id === id);
  if (!prod) return;
  
  prod.stock = Math.max(0, prod.stock + amt);
  logSystemFlow("Stock Adjusted Manually", "Inventory UI", `Adjusted ${prod.name} quantity by ${amt}. New stock: ${prod.stock}.`);
  
  // Trigger system flow pipeline
  setTimeout(() => logSystemFlow("Write DB Success", "Room SQLite", "Modified stock levels persisted local database cache."), 200);
  setTimeout(() => logSystemFlow("Event Stream Dispatched", "Kafka Cluster", "Pushed domain event 'StockUpdated' safely."), 800);
  
  renderInventoryTable();
  renderPOSGrid();
  updateAnalyticsDashboard();
};

window.filterInventoryCategory = function(category, buttonEl) {
  currentInventoryCategory = category;
  
  document.querySelectorAll(".category-badge-btn").forEach(btn => btn.classList.remove("active"));
  buttonEl.classList.add("active");
  
  logSystemFlow(`Category Switched: ${category.toUpperCase()}`, "Inventory UI", `Switched catalog view filter.`);
  renderInventoryTable();
};

// Search Handlers
window.handleSearchPOS = function(query) {
  posSearchTerm = query;
  renderPOSGrid();
};

window.handleSearchInventory = function(query) {
  inventorySearchTerm = query;
  renderInventoryTable();
};

// 7. Wholesale Order Booking
window.submitWholesaleOrder = function(event) {
  event.preventDefault();
  
  const distributor = document.getElementById("order-distributor").value;
  const product = document.getElementById("order-product").value;
  const qty = parseInt(document.getElementById("order-qty").value);
  
  if (!distributor || !product || isNaN(qty) || qty <= 0) {
    alert("Please enter a valid wholesale booking target.");
    return;
  }
  
  const draft = {
    id: `DRAFT-${Math.floor(1000 + Math.random() * 9000)}`,
    distributor,
    product,
    qty,
    date: new Date().toLocaleDateString()
  };
  
  wholesaleDrafts.push(draft);
  
  const queue = document.getElementById("wholesale-queue-list");
  const row = document.createElement("div");
  row.className = "terminal-entry";
  row.innerHTML = `<span><strong>${draft.id}</strong>: Order ${draft.qty}x ${draft.product} to ${draft.distributor}</span>`;
  queue.appendChild(row);
  
  document.getElementById("order-qty").value = "";
  
  logSystemFlow("Wholesale Draft Formed", "Orders UI", `Created draft order ${draft.id} in local storage.`);
  setTimeout(() => logSystemFlow("Vendor Sync Active", "Procurement Service", "Procurement agent created vendor purchase request."), 500);
  setTimeout(() => logSystemFlow("API Payload Sync", "API Gateway", "Pushed procurement payload securely to main servers."), 1000);
};

// 8. Analytics & Visual SVG Charts
function renderSVGRevenueChart() {
  const box = document.getElementById("svg-chart-container");
  if (!box) return;
  
  box.innerHTML = `
    <svg width="100%" height="180px" viewBox="0 0 500 180" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-accent)" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="var(--color-accent)" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      <line x1="0" y1="40" x2="500" y2="40" stroke="var(--color-border)" stroke-dasharray="3"/>
      <line x1="0" y1="95" x2="500" y2="95" stroke="var(--color-border)" stroke-dasharray="3"/>
      <line x1="0" y1="150" x2="500" y2="150" stroke="var(--color-border)" stroke-dasharray="3"/>
      
      <!-- Chart line paths -->
      <path d="M 0 150 Q 80 120, 160 85 T 320 60 T 500 15 L 500 180 L 0 180 Z" fill="url(#chart-grad)" />
      <path d="M 0 150 Q 80 120, 160 85 T 320 60 T 500 15" fill="none" stroke="var(--color-primary)" stroke-width="3.5" />
      
      <!-- Bullet node indicators -->
      <circle cx="160" cy="85" r="5" fill="var(--color-accent)" stroke="var(--color-primary)" stroke-width="2.5"/>
      <circle cx="320" cy="60" r="5" fill="var(--color-accent)" stroke="var(--color-primary)" stroke-width="2.5"/>
      <circle cx="500" cy="15" r="5" fill="var(--color-accent)" stroke="var(--color-primary)" stroke-width="2.5"/>
    </svg>
  `;
}

function updateAnalyticsDashboard() {
  const stockSum = catalogDatabase.reduce((acc, p) => acc + p.stock, 0);
  const lowCount = catalogDatabase.filter(p => p.stock <= 5).length;
  
  const salesEl = document.getElementById("metrics-sales-sum");
  if (salesEl) {
    salesEl.innerText = `₹${todaySalesTotal.toLocaleString()}`;
  }
  document.getElementById("metrics-stock-sum").innerText = stockSum;
  document.getElementById("metrics-lowstock-sum").innerText = lowCount;
}

// 9. Architecture Telemetry Flow logs
function logSystemFlow(action, component, details) {
  const logs = document.getElementById("terminal-logs");
  if (!logs) return;
  
  const time = new Date().toLocaleTimeString();
  const entry = document.createElement("div");
  entry.className = "terminal-entry";
  entry.innerHTML = `<span class="timestamp">[${time}]</span> <span class="label">[${component}]</span> ${action}: ${details}`;
  
  logs.prepend(entry);
  logs.scrollTop = 0;
}
