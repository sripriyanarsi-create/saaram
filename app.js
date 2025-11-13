const MENU_STORAGE_KEY = 'saaraam_coffee_menu';
const CART_STORAGE_KEY = 'saaraam_coffee_cart';
const SALES_STORAGE_KEY = 'saaraam_coffee_sales';
const SHIPPING_FEE = 50;

const clone = (value) => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

const defaultMenu = [
  {
    id: 'bold-beautiful',
    name: "Saaraam's Bold & Beautiful",
    description: 'Bold 80:20 blend balanced with chicory for a creamy filter experience.',
    ratio: '80:20 blend',
    options: [
      { grams: 125, price: 125 },
      { grams: 250, price: 250 }
    ],
    image: 'assets/bold-beautiful.svg'
  },
  {
    id: 'noon-special',
    name: "Saaraam's Noon Special",
    description: 'Comforting 70:30 blend, perfect for noon pick-me-ups or iced coffee.',
    ratio: '70:30 blend',
    options: [
      { grams: 125, price: 125 },
      { grams: 250, price: 250 }
    ],
    image: 'assets/noon-special.svg'
  },
  {
    id: 'evergreen',
    name: "Saaraam's Evergreen",
    description: '100% arabica beans delivering a smooth, well-rounded cup every brew.',
    ratio: '100% coffee',
    options: [
      { grams: 125, price: 160 },
      { grams: 250, price: 320 }
    ],
    image: 'assets/evergreen.svg'
  },
  {
    id: 'specialty',
    name: 'Saaraam Specialty Reserve',
    description: 'Custom-roasted micro lot beans. Roast-to-order in tiny batches for you.',
    ratio: 'Custom roast',
    options: [
      { grams: 100, price: 350 },
      { grams: 200, price: 700 }
    ],
    image: 'assets/specialty.svg'
  }
];

const menuGrid = document.querySelector('#menuGrid');
const cartContainer = document.querySelector('#cartItems');
const subtotalEl = document.querySelector('#subtotal');
const shippingEl = document.querySelector('#shipping');
const totalEl = document.querySelector('#total');
const menuModal = document.querySelector('#menuModal');
const menuForm = document.querySelector('#menuForm');
const deleteMenuBtn = document.querySelector('#deleteMenuBtn');
const menuModalTitle = document.querySelector('#menuModalTitle');
const manageMenuBtn = document.querySelector('#manageMenuBtn');
const closeMenuModalBtn = document.querySelector('#closeMenuModal');
const viewReportBtn = document.querySelector('#viewReportBtn');
const reportSection = document.querySelector('#reportSection');
const closeReportBtn = document.querySelector('#closeReportBtn');
const reportContent = document.querySelector('#reportContent');
const payNowBtn = document.querySelector('#payNowBtn');
const paymentModal = document.querySelector('#paymentModal');
const closePaymentModal = document.querySelector('#closePaymentModal');
const confirmPaymentBtn = document.querySelector('#confirmPaymentBtn');
const clearCartBtn = document.querySelector('#clearCartBtn');
const printBillBtn = document.querySelector('#printBillBtn');

let menu = loadMenu();
let cart = loadCart();
let sales = loadSales();

document.addEventListener('DOMContentLoaded', init);

function init() {
  renderMenu();
  renderCart();
  attachCoreEvents();
}

function loadMenu() {
  try {
    const raw = localStorage.getItem(MENU_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(defaultMenu));
      return clone(defaultMenu);
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) {
      throw new Error('Invalid menu data');
    }
    return parsed;
  } catch (error) {
    console.warn('Falling back to default menu', error);
    localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(defaultMenu));
    return clone(defaultMenu);
  }
}

function saveMenu(data) {
  localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(data));
}

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Could not load cart', error);
    return [];
  }
}

function saveCart(data) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(data));
}

function loadSales() {
  try {
    const raw = localStorage.getItem(SALES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Could not load sales history', error);
    return [];
  }
}

function saveSales(data) {
  localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(data));
}

function attachCoreEvents() {
  manageMenuBtn.addEventListener('click', () => openMenuModal());
  closeMenuModalBtn.addEventListener('click', () => menuModal.close());
  menuModal.addEventListener('cancel', (event) => {
    event.preventDefault();
    menuModal.close();
  });

  menuForm.addEventListener('submit', handleMenuSubmit);
  deleteMenuBtn.addEventListener('click', handleMenuDelete);

  viewReportBtn.addEventListener('click', () => {
    renderReport();
    reportSection.hidden = false;
    reportSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  closeReportBtn.addEventListener('click', () => {
    reportSection.hidden = true;
  });

  payNowBtn.addEventListener('click', () => {
    if (!cart.length) return;
    paymentModal.showModal();
  });

  closePaymentModal.addEventListener('click', () => paymentModal.close());
  paymentModal.addEventListener('cancel', (event) => {
    event.preventDefault();
    paymentModal.close();
  });

  confirmPaymentBtn.addEventListener('click', handlePaymentConfirmation);

  clearCartBtn.addEventListener('click', () => {
    cart = [];
    saveCart(cart);
    renderCart();
  });

  printBillBtn.addEventListener('click', () => {
    if (!cart.length) {
      alert('Your cart is empty.');
      return;
    }
    window.print();
  });
}

function renderMenu() {
  const template = document.querySelector('#menuCardTemplate');
  menuGrid.innerHTML = '';

  menu.forEach((item) => {
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector('.menu-card');
    const image = fragment.querySelector('.menu-image');
    const title = fragment.querySelector('.menu-title');
    const description = fragment.querySelector('.menu-description');
    const ratio = fragment.querySelector('.menu-ratio');
    const weightSelector = fragment.querySelector('.weight-selector');
    const priceDisplay = fragment.querySelector('.menu-price');
    const addToCartBtn = fragment.querySelector('.add-to-cart');
    const editBtn = fragment.querySelector('.edit-item');

    card.dataset.id = item.id;
    image.src = item.image;
    image.alt = item.name;
    title.textContent = item.name;
    description.textContent = item.description;
    ratio.textContent = item.ratio;

    weightSelector.innerHTML = '';

    item.options.forEach((option, index) => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `weight-${item.id}`;
      input.value = option.grams;
      input.dataset.price = option.price;
      if (index === 0) input.checked = true;
      label.append(input, ` ${option.grams}g`);
      weightSelector.appendChild(label);
    });

    const updateCardPrice = () => {
      const selected = weightSelector.querySelector('input:checked');
      const price = selected ? Number(selected.dataset.price) : 0;
      priceDisplay.textContent = `₹${price}`;
    };

    weightSelector.addEventListener('change', updateCardPrice);
    updateCardPrice();

    addToCartBtn.addEventListener('click', () => {
      const selected = weightSelector.querySelector('input:checked');
      if (!selected) return;
      addItemToCart(item.id, Number(selected.value));
    });

    editBtn.addEventListener('click', () => openMenuModal(item.id));

    menuGrid.appendChild(fragment);
  });
}

function addItemToCart(itemId, grams) {
  const menuItem = menu.find((item) => item.id === itemId);
  if (!menuItem) return;

  const option = menuItem.options.find((opt) => opt.grams === grams);
  if (!option) return;

  const existing = cart.find((line) => line.itemId === itemId && line.grams === grams);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      itemId,
      grams,
      quantity: 1
    });
  }

  saveCart(cart);
  renderCart();
}

function renderCart() {
  const template = document.querySelector('#cartItemTemplate');
  cartContainer.innerHTML = '';

  if (!cart.length) {
    cartContainer.innerHTML = '<p class="muted">Cart is empty. Add your favourite roast!</p>';
  } else {
    cart.forEach((line) => {
      const fragment = template.content.cloneNode(true);
      const container = fragment.querySelector('.cart-item');
      const title = fragment.querySelector('.cart-item-title');
      const meta = fragment.querySelector('.cart-item-meta');
      const quantityEl = fragment.querySelector('.quantity');
      const totalEl = fragment.querySelector('.cart-item-total');
      const decreaseBtn = fragment.querySelector('.decrease');
      const increaseBtn = fragment.querySelector('.increase');
      const removeBtn = fragment.querySelector('.remove');

      const menuItem = menu.find((item) => item.id === line.itemId);
      if (!menuItem) return;
      const option = menuItem.options.find((opt) => opt.grams === line.grams);
      if (!option) return;

      title.textContent = menuItem.name;
      meta.textContent = `${line.grams}g • ₹${option.price} each`;
      quantityEl.textContent = String(line.quantity);
      totalEl.textContent = `₹${option.price * line.quantity}`;

      decreaseBtn.addEventListener('click', () => updateCartQuantity(line.itemId, line.grams, -1));
      increaseBtn.addEventListener('click', () => updateCartQuantity(line.itemId, line.grams, 1));
      removeBtn.addEventListener('click', () => removeCartLine(line.itemId, line.grams));

      cartContainer.appendChild(fragment);
    });
  }

  const { subtotal, shipping, total } = computeTotals();
  subtotalEl.textContent = `₹${subtotal}`;
  shippingEl.textContent = `₹${shipping}`;
  totalEl.textContent = `₹${total}`;
  payNowBtn.disabled = cart.length === 0;
  printBillBtn.disabled = cart.length === 0;
  clearCartBtn.disabled = cart.length === 0;
}

function updateCartQuantity(itemId, grams, delta) {
  const line = cart.find((entry) => entry.itemId === itemId && entry.grams === grams);
  if (!line) return;
  line.quantity += delta;
  if (line.quantity <= 0) {
    cart = cart.filter((entry) => !(entry.itemId === itemId && entry.grams === grams));
  }
  saveCart(cart);
  renderCart();
}

function removeCartLine(itemId, grams) {
  cart = cart.filter((entry) => !(entry.itemId === itemId && entry.grams === grams));
  saveCart(cart);
  renderCart();
}

function computeTotals() {
  let subtotal = 0;
  cart.forEach((line) => {
    const menuItem = menu.find((item) => item.id === line.itemId);
    if (!menuItem) return;
    const option = menuItem.options.find((opt) => opt.grams === line.grams);
    if (!option) return;
    subtotal += option.price * line.quantity;
  });

  const shipping = cart.length ? SHIPPING_FEE : 0;
  const total = subtotal + shipping;
  return { subtotal, shipping, total };
}

function openMenuModal(itemId) {
  menuForm.reset();
  deleteMenuBtn.hidden = true;
  menuModalTitle.textContent = 'Add Menu Item';
  menuForm.elements.id.value = '';
  menuForm.elements.weightA.value = 125;
  menuForm.elements.weightB.value = 250;
  menuForm.elements.priceA.value = '';
  menuForm.elements.priceB.value = '';


  if (itemId) {
    const item = menu.find((entry) => entry.id === itemId);
    if (!item) return;
    menuModalTitle.textContent = 'Edit Menu Item';
    menuForm.elements.id.value = item.id;
    menuForm.elements.name.value = item.name;
    menuForm.elements.description.value = item.description;
    menuForm.elements.ratio.value = item.ratio;
    menuForm.elements.image.value = item.image;
    const [optionA, optionB] = item.options;
    if (optionA) {
      menuForm.elements.weightA.value = optionA.grams;
      menuForm.elements.priceA.value = optionA.price;
    }
    if (optionB) {
      menuForm.elements.weightB.value = optionB.grams;
      menuForm.elements.priceB.value = optionB.price;
    } else {
      menuForm.elements.weightB.value = '';
      menuForm.elements.priceB.value = '';
    }
    deleteMenuBtn.hidden = false;
  }

  menuModal.showModal();
}

function handleMenuSubmit(event) {
  event.preventDefault();
  const formData = new FormData(menuForm);
  const id = formData.get('id') || createId(formData.get('name'));
  const name = formData.get('name')?.trim();
  const description = formData.get('description')?.trim();
  const ratio = formData.get('ratio')?.trim();
  const image = formData.get('image')?.trim();
  const weightA = Number(formData.get('weightA'));
  const priceA = Number(formData.get('priceA'));
  const weightB = formData.get('weightB') ? Number(formData.get('weightB')) : null;
  const priceB = formData.get('priceB') ? Number(formData.get('priceB')) : null;

  if (!name || !description || !ratio || !image || !weightA || !priceA) {
    alert('Please fill in all required fields.');
    return;
  }

  const options = [{ grams: weightA, price: priceA }];
  if (weightB && priceB) {
    options.push({ grams: weightB, price: priceB });
  }
  options.sort((a, b) => a.grams - b.grams);

  const existingIndex = menu.findIndex((item) => item.id === id);
  const payload = { id, name, description, ratio, image, options };

  if (existingIndex >= 0) {
    menu[existingIndex] = payload;
  } else {
    menu.push(payload);
  }

  saveMenu(menu);
  renderMenu();
  renderCart(); // prices may have changed
  menuModal.close();
}

function createId(base) {
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `item-${Date.now()}`;
}

function handleMenuDelete() {
  const id = menuForm.elements.id.value;
  if (!id) return;
  const confirmed = confirm('Delete this menu item?');
  if (!confirmed) return;
  menu = menu.filter((item) => item.id !== id);
  cart = cart.filter((line) => line.itemId !== id);
  saveMenu(menu);
  saveCart(cart);
  renderMenu();
  renderCart();
  menuModal.close();
}

function handlePaymentConfirmation() {
  if (!cart.length) return;
  const totals = computeTotals();
  const timestamp = new Date().toISOString();

  const itemsSnapshot = cart.map((line) => {
    const menuItem = menu.find((item) => item.id === line.itemId);
    const option = menuItem?.options.find((opt) => opt.grams === line.grams);
    return {
      itemId: line.itemId,
      name: menuItem?.name ?? 'Unknown Item',
      grams: line.grams,
      quantity: line.quantity,
      unitPrice: option?.price ?? 0,
      lineTotal: (option?.price ?? 0) * line.quantity
    };
  });

  sales.push({
    id: `sale-${Date.now()}`,
    date: timestamp,
    subtotal: totals.subtotal,
    shipping: totals.shipping,
    total: totals.total,
    items: itemsSnapshot
  });

  saveSales(sales);

  cart = [];
  saveCart(cart);
  renderCart();
  paymentModal.close();
  alert('Payment recorded! Your roast will be on its way soon.');
}

function renderReport() {
  if (!sales.length) {
    reportContent.innerHTML = '<div class="report-empty">No orders recorded yet. Complete a payment to populate the report.</div>';
    return;
  }

  const monthlyMap = new Map();

  sales.forEach((sale) => {
    const monthKey = sale.date.slice(0, 7); // YYYY-MM
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, {
        month: monthKey,
        orders: 0,
        revenue: 0,
        items: new Map()
      });
    }
    const entry = monthlyMap.get(monthKey);
    entry.orders += 1;
    entry.revenue += sale.total;

    sale.items.forEach((item) => {
      const key = `${item.name} ${item.grams}g`;
      const stored = entry.items.get(key) || { name: item.name, grams: item.grams, quantity: 0, revenue: 0 };
      stored.quantity += item.quantity;
      stored.revenue += item.lineTotal;
      entry.items.set(key, stored);
    });
  });

  const months = Array.from(monthlyMap.values()).sort((a, b) => (a.month < b.month ? 1 : -1));

  const container = document.createElement('div');
  container.className = 'report-grid';

  const headerRow = document.createElement('header');
  headerRow.innerHTML = '<span>Month</span><span>Orders</span><span>Revenue</span><span>Top Seller</span>';
  container.appendChild(headerRow);

  months.forEach((entry) => {
    const topSeller = Array.from(entry.items.values()).sort((a, b) => b.quantity - a.quantity)[0];
    const topLabel = topSeller
      ? `${topSeller.name} (${topSeller.grams}g × ${topSeller.quantity})`
      : '—';

    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
      <span>${formatMonth(entry.month)}</span>
      <span>${entry.orders}</span>
      <span>₹${entry.revenue}</span>
      <span>${topLabel}</span>
    `;
    container.appendChild(row);
  });

  reportContent.innerHTML = '';
  reportContent.appendChild(container);
}

function formatMonth(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1);
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

