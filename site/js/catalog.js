const header = document.querySelector('.header');
const burgerButton = document.querySelector('.header__burger');
const closeButton = document.querySelector('.header__close');
const overlay = document.querySelector('.header__overlay');
const mobileLinks = document.querySelectorAll('.header__mobile-link');
const cartCounter = document.querySelector('.header__cart-count');

const catalogProducts = document.querySelector('#catalogProducts');
const catalogFilters = document.querySelector('#catalogFilters');
const catalogCount = document.querySelector('#catalogCount');
const catalogEmpty = document.querySelector('#catalogEmpty');

let lastScrollTop = 0;
let allProducts = [];
let activeFilter = 'all';

function openMobileMenu() {
  if (!header) return;

  header.classList.add('header--menu-open');
  document.body.classList.add('lock');
}

function closeMobileMenu() {
  if (!header) return;

  header.classList.remove('header--menu-open');
  document.body.classList.remove('lock');
}

if (burgerButton) burgerButton.addEventListener('click', openMobileMenu);
if (closeButton) closeButton.addEventListener('click', closeMobileMenu);
if (overlay) overlay.addEventListener('click', closeMobileMenu);

mobileLinks.forEach((link) => {
  link.addEventListener('click', closeMobileMenu);
});

window.addEventListener('scroll', () => {
  if (!header || header.classList.contains('header--menu-open')) return;

  const currentScrollTop =
    window.pageYOffset || document.documentElement.scrollTop;

  if (currentScrollTop > lastScrollTop && currentScrollTop > 120) {
    header.classList.add('header--hidden');
  } else {
    header.classList.remove('header--hidden');
  }

  lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
});

function getCart() {
  try {
    return JSON.parse(localStorage.getItem('cart')) || [];
  } catch (error) {
    localStorage.removeItem('cart');
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCounter() {
  if (!cartCounter) return;

  const cart = getCart();

  const totalCount = cart.reduce((sum, item) => {
    return sum + Number(item.quantity || 0);
  }, 0);

  cartCounter.textContent = totalCount;
}

function addToCart(productId) {
  const cart = getCart();

  const existingItem = cart.find((item) => {
    return Number(item.productId) === Number(productId);
  });

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      productId: Number(productId),
      quantity: 1,
    });
  }

  saveCart(cart);
  updateCartCounter();
}

function showToast(title, text, type = 'success') {
  const toast = document.querySelector('#toast');

  if (!toast) return;

  toast.classList.remove('toast--success', 'toast--error');
  toast.classList.add(`toast--${type}`);

  const icon = toast.querySelector('.toast__icon');
  const titleElement = toast.querySelector('strong');
  const textElement = toast.querySelector('span');

  if (icon) icon.textContent = type === 'success' ? '✓' : '!';
  if (titleElement) titleElement.textContent = title;
  if (textElement) textElement.textContent = text;

  toast.classList.add('active');

  clearTimeout(toast.hideTimeout);

  toast.hideTimeout = setTimeout(() => {
    toast.classList.remove('active');
  }, 3200);
}

function escapeHTML(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatPrice(price) {
  return Number(price || 0).toLocaleString('ru-RU');
}

async function getProducts() {
  if (allProducts.length) return allProducts;

  const response = await fetch('/api/products');

  if (!response.ok) {
    throw new Error('Не удалось загрузить каталог');
  }

  allProducts = await response.json();

  return allProducts;
}

function getFilteredProducts(products) {
  if (activeFilter === 'hit') {
    return products.filter((product) => product.isHit);
  }

  if (activeFilter === 'sale') {
    return products.filter((product) => product.isSale);
  }

  if (activeFilter === 'small') {
    return products.filter((product) => Number(product.berriesCount || 0) <= 9);
  }

  if (activeFilter === 'classic') {
    return products.filter((product) => {
      const berries = Number(product.berriesCount || 0);

      return berries >= 10 && berries <= 15;
    });
  }

  if (activeFilter === 'big') {
    return products.filter((product) => Number(product.berriesCount || 0) >= 21);
  }

  return products;
}

function getProductBadge(product) {
  if (product.isSale) {
    return '<span class="catalog-card__badge catalog-card__badge--sale">Акция</span>';
  }

  if (product.isHit) {
    return '<span class="catalog-card__badge">Хит</span>';
  }

  return '';
}

function createCatalogCard(product) {
  const title = escapeHTML(product.title);
  const description = escapeHTML(product.shortDescription || '');
  const image = product.image || '/site/img/products/product-placeholder.jpg';
  const price = formatPrice(product.price);
  const oldPrice = product.oldPrice ? formatPrice(product.oldPrice) : '';
  const berriesText = product.berriesCount
    ? `${product.berriesCount} ягод`
    : 'Количество уточним';

  return `
    <article class="catalog-card">
      <a class="catalog-card__image" href="/product/${encodeURIComponent(product.slug)}">
        <img src="${image}" alt="${title}" />
        ${getProductBadge(product)}
      </a>

      <div class="catalog-card__content">
        <a class="catalog-card__title" href="/product/${encodeURIComponent(product.slug)}">
          ${title}
        </a>

        <p class="catalog-card__description">
          ${description}
        </p>

        <div class="catalog-card__meta">
          ${berriesText}
        </div>

        <div class="catalog-card__prices">
          <strong>${price} ₽</strong>
          ${oldPrice ? `<span>${oldPrice} ₽</span>` : ''}
        </div>

        <div class="catalog-card__actions">
          <button
            class="catalog-card__button catalog-card__button--cart"
            type="button"
            data-product-id="${product.id}"
          >
            В корзину
          </button>

          <button
            class="catalog-card__button catalog-card__button--quick"
            type="button"
            data-product-id="${product.id}"
          >
            Быстрый заказ
          </button>
        </div>
      </div>
    </article>
  `;
}

async function renderCatalog() {
  if (!catalogProducts) return;

  try {
    const products = await getProducts();
    const filteredProducts = getFilteredProducts(products);

    if (catalogCount) {
      catalogCount.textContent = filteredProducts.length;
    }

    if (!filteredProducts.length) {
      catalogProducts.innerHTML = '';

      if (catalogEmpty) {
        catalogEmpty.hidden = false;
      }

      return;
    }

    if (catalogEmpty) {
      catalogEmpty.hidden = true;
    }

    catalogProducts.innerHTML = filteredProducts
      .map(createCatalogCard)
      .join('');
  } catch (error) {
    console.error('Catalog render error:', error);

    catalogProducts.innerHTML = `
      <div class="catalog-empty catalog-empty--static">
        <h3>Каталог временно не загрузился</h3>
        <p>Обновите страницу или попробуйте позже.</p>
      </div>
    `;
  }
}

function setActiveFilterButton(filter) {
  document.querySelectorAll('.catalog-filters__button').forEach((button) => {
    button.classList.toggle('active', button.dataset.filter === filter);
  });
}

function setQuickFormStartedAt() {
  const startedAtInput = document.querySelector('#quickFormStartedAt');

  if (startedAtInput) {
    startedAtInput.value = String(Date.now());
  }
}

async function openQuickOrder(productId = null) {
  const modal = document.querySelector('#quickOrderModal');
  const productBox = document.querySelector('#quickOrderProduct');
  const productIdInput = document.querySelector('#quickProductId');

  if (!modal) return;

  let product = null;

  if (productId) {
    const products = await getProducts();

    product = products.find((item) => {
      return Number(item.id) === Number(productId);
    });
  }

  if (product && productBox && productIdInput) {
    productIdInput.value = product.id;

    productBox.innerHTML = `
      <img src="${product.image || '/site/img/products/product-placeholder.jpg'}" alt="${escapeHTML(product.title)}" />

      <div>
        <strong>${escapeHTML(product.title)}</strong>
        <span>${formatPrice(product.price)} ₽</span>
      </div>
    `;
  }

  if (!product && productBox && productIdInput) {
    productIdInput.value = '';

    productBox.innerHTML = `
      <div>
        <strong>Быстрый заказ</strong>
        <span>Мы поможем подобрать букет</span>
      </div>
    `;
  }

  setQuickFormStartedAt();

  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeQuickOrder() {
  const modal = document.querySelector('#quickOrderModal');

  if (!modal) return;

  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

catalogFilters?.addEventListener('click', (event) => {
  const filterButton = event.target.closest('.catalog-filters__button');

  if (!filterButton) return;

  activeFilter = filterButton.dataset.filter || 'all';

  setActiveFilterButton(activeFilter);
  renderCatalog();
});

document.addEventListener('click', async (event) => {
  const cartButton = event.target.closest('.catalog-card__button--cart');
  const quickProductButton = event.target.closest('.catalog-card__button--quick');
  const quickTriggerButton = event.target.closest('.quick-order-trigger');
  const closeQuickButton = event.target.closest('[data-quick-close]');

  if (closeQuickButton) {
    closeQuickOrder();
    return;
  }

  if (cartButton) {
    const productId = Number(cartButton.dataset.productId);

    if (!productId) return;

    addToCart(productId);
    showToast('Букет добавлен', 'Букет успешно добавлен в корзину', 'success');
    return;
  }

  if (quickProductButton) {
    const productId = Number(quickProductButton.dataset.productId);

    if (!productId) return;

    await openQuickOrder(productId);
    return;
  }

  if (quickTriggerButton) {
    await openQuickOrder();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeQuickOrder();
  }
});

document
  .querySelector('#quickOrderForm')
  ?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const orderData = Object.fromEntries(formData);

    try {
      submitButton.disabled = true;
      submitButton.textContent = 'Отправляем...';

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Ошибка отправки заявки');
      }

      closeQuickOrder();
      form.reset();

      showToast(
        'Заявка отправлена',
        'Мы скоро свяжемся с вами для подтверждения заказа',
        'success',
      );
    } catch (error) {
      console.error('Catalog order error:', error);

      showToast(
        'Заявка не отправлена',
        error.message || 'Попробуйте ещё раз позже',
        'error',
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Отправить заявку';
    }
  });

updateCartCounter();
renderCatalog();
