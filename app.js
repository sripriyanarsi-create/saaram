const MENU_STORAGE_KEY = 'saaram_coffee_menu';
const CART_STORAGE_KEY = 'saaram_coffee_cart';
const PRODUCT_IMAGES_STORAGE_KEY = 'saaram_coffee_product_images';
const TESTIMONIALS_STORAGE_KEY = 'saaram_coffee_testimonials';
const BRAND_LOGO_STORAGE_KEY = 'saaram_coffee_brand_logo';
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
    name: "Saaram's Bold & Beautiful",
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
    name: "Saaram's Noon Special",
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
    name: "Saaram's Evergreen",
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
    name: 'Saaram Specialty Reserve',
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
const brandLogo = document.querySelector('#brandLogo');
const brandLogoInput = document.querySelector('#brandLogoInput');
const productUploadFields = document.querySelector('#productUploadFields');
const feedbackForm = document.querySelector('#feedbackForm');
const feedbackSuccess = document.querySelector('#feedbackSuccess');
const testimonialsList = document.querySelector('#testimonialsList');
const testimonialsEmpty = document.querySelector('#testimonialsEmpty');
const payNowBtn = document.querySelector('#payNowBtn');
const paymentModal = document.querySelector('#paymentModal');
const closePaymentModal = document.querySelector('#closePaymentModal');
const confirmPaymentBtn = document.querySelector('#confirmPaymentBtn');
const clearCartBtn = document.querySelector('#clearCartBtn');
const printBillBtn = document.querySelector('#printBillBtn');

let menu = loadMenu();
let cart = loadCart();
let productImages = loadProductImages();
let testimonials = loadTestimonials();

document.addEventListener('DOMContentLoaded', init);

function init() {
  renderMenu();
  renderCart();
  applyStoredBrandLogo();
  renderProductUploadFields();
  renderTestimonials();
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
  if (brandLogoInput) {
    brandLogoInput.addEventListener('change', handleBrandLogoUpload);
  }

  if (productUploadFields) {
    productUploadFields.addEventListener('change', handleProductImageUpload);
  }

  if (feedbackForm) {
    feedbackForm.addEventListener('submit', handleFeedbackSubmit);
  }

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
    const customImage = productImages[item.id];
    image.src = customImage || item.image;
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
  if (feedbackForm) {
    feedbackForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    feedbackForm.elements.name?.focus?.();
  }
}

function loadProductImages() {
  try {
    const raw = localStorage.getItem(PRODUCT_IMAGES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.warn('Could not load product images', error);
    return {};
  }
}

function saveProductImages(data) {
  localStorage.setItem(PRODUCT_IMAGES_STORAGE_KEY, JSON.stringify(data));
}

function renderProductUploadFields() {
  if (!productUploadFields) return;
  productUploadFields.innerHTML = '';
  menu.forEach((item) => {
    const wrapper = document.createElement('label');
    wrapper.className = 'file-field';

    const title = document.createElement('span');
    title.textContent = item.name;
    title.className = 'file-label';

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.dataset.itemId = item.id;

    wrapper.append(title, input);

    if (productImages[item.id]) {
      const note = document.createElement('span');
      note.className = 'file-note';
      note.textContent = 'Custom image in use';
      wrapper.appendChild(note);
    }

    productUploadFields.appendChild(wrapper);
  });
}

function handleProductImageUpload(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || target.type !== 'file') return;
  const { itemId } = target.dataset;
  if (!itemId || !target.files?.length) return;
  const file = target.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    if (typeof dataUrl !== 'string') return;
    productImages[itemId] = dataUrl;
    saveProductImages(productImages);
    const card = menuGrid.querySelector(`[data-id="${itemId}"]`);
    if (card) {
      const img = card.querySelector('.menu-image');
      if (img instanceof HTMLImageElement) {
        img.src = dataUrl;
      }
    }
    renderProductUploadFields();
  };
  reader.readAsDataURL(file);
}

function applyStoredBrandLogo() {
  if (!brandLogo) return;
  try {
    const stored = localStorage.getItem(BRAND_LOGO_STORAGE_KEY);
    if (stored) {
      brandLogo.src = stored;
    }
  } catch (error) {
    console.warn('Could not apply stored brand logo', error);
  }
}

function handleBrandLogoUpload(event) {
  const file = event.target.files?.[0];
  if (!file || !brandLogo) return;
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    if (typeof dataUrl !== 'string') return;
    brandLogo.src = dataUrl;
    try {
      localStorage.setItem(BRAND_LOGO_STORAGE_KEY, dataUrl);
    } catch (error) {
      console.warn('Could not persist brand logo', error);
    }
  };
  reader.readAsDataURL(file);
}

function loadTestimonials() {
  try {
    const raw = localStorage.getItem(TESTIMONIALS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Could not load testimonials', error);
    return [];
  }
}

function saveTestimonials(data) {
  localStorage.setItem(TESTIMONIALS_STORAGE_KEY, JSON.stringify(data));
}

function handleFeedbackSubmit(event) {
  event.preventDefault();
  const formData = new FormData(feedbackForm);
  const name = (formData.get('name') || 'Guest').toString().trim();
  const beverage = (formData.get('beverage') || '').toString().trim();
  const message = (formData.get('message') || '').toString().trim();
  if (!message) {
    alert('Please share a few words about your experience.');
    return;
  }
  const entry = {
    id: `testimonial-${Date.now()}`,
    name: name || 'Guest',
    beverage,
    message,
    date: new Date().toISOString()
  };
  testimonials.unshift(entry);
  saveTestimonials(testimonials);
  feedbackForm.reset();
  renderTestimonials();
  if (feedbackSuccess) {
    feedbackSuccess.hidden = false;
    feedbackSuccess.textContent = 'Thank you for your heartfelt note! We have added it to our testimonial wall.';
    setTimeout(() => {
      feedbackSuccess.hidden = true;
    }, 4000);
  }
}

function renderTestimonials() {
  if (!testimonialsList) return;
  testimonialsList.innerHTML = '';
  if (!testimonials.length) {
    if (testimonialsEmpty) testimonialsEmpty.hidden = false;
    return;
  }
  if (testimonialsEmpty) testimonialsEmpty.hidden = true;
  testimonials.forEach((entry) => {
    const card = document.createElement('article');
    card.className = 'testimonial-card';

    const quote = document.createElement('p');
    quote.className = 'testimonial-quote';
    quote.textContent = entry.message;

    const meta = document.createElement('div');
    meta.className = 'testimonial-meta';
    const name = document.createElement('span');
    name.className = 'testimonial-name';
    name.textContent = entry.name;
    const beverage = document.createElement('span');
    beverage.className = 'testimonial-beverage';
    if (entry.beverage) {
      beverage.textContent = `• ${entry.beverage}`;
    }
    const date = document.createElement('time');
    date.className = 'testimonial-date';
    date.dateTime = entry.date;
    date.textContent = new Date(entry.date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    meta.append(name, beverage, date);
    card.append(quote, meta);
    testimonialsList.appendChild(card);
  });
}
