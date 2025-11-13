const MENU_STORAGE_KEY = 'saaraam_coffee_menu';
const CART_STORAGE_KEY = 'saaraam_coffee_cart';
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
const payNowBtn = document.querySelector('#payNowBtn');
const paymentModal = document.querySelector('#paymentModal');
const closePaymentModal = document.querySelector('#closePaymentModal');
const confirmPaymentBtn = document.querySelector('#confirmPaymentBtn');
const clearCartBtn = document.querySelector('#clearCartBtn');
const printBillBtn = document.querySelector('#printBillBtn');

let menu = loadMenu();
let cart = loadCart();

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

function attachCoreEvents() {
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

function handlePaymentConfirmation() {
  if (!cart.length) return;
  cart = [];
  saveCart(cart);
  renderCart();
  paymentModal.close();
  alert('Payment recorded! Your roast will be on its way soon.');
}
