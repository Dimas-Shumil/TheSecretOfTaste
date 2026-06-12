// const header = document.querySelector('.header');
// const burgerButton = document.querySelector('.header__burger');
// const closeButton = document.querySelector('.header__close');
// const overlay = document.querySelector('.header__overlay');
// const mobileLinks = document.querySelectorAll('.header__mobile-link');
// const cartCounter = document.querySelector('.header__cart-count');

// const productPage = document.querySelector('#productPage');
// const productBreadcrumb = document.querySelector('#productBreadcrumb');
// const productSeoTitle = document.querySelector('#productSeoTitle');

// let lastScrollTop = 0;
// let currentProduct = null;
// let currentQuantity = 1;

// function openMobileMenu() {
//   if (!header) return;

//   header.classList.add('header--menu-open');
//   document.body.classList.add('lock');
// }

// function closeMobileMenu() {
//   if (!header) return;

//   header.classList.remove('header--menu-open');
//   document.body.classList.remove('lock');
// }

// if (burgerButton) burgerButton.addEventListener('click', openMobileMenu);
// if (closeButton) closeButton.addEventListener('click', closeMobileMenu);
// if (overlay) overlay.addEventListener('click', closeMobileMenu);

// mobileLinks.forEach((link) => {
//   link.addEventListener('click', closeMobileMenu);
// });

// window.addEventListener('scroll', () => {
//   if (!header || header.classList.contains('header--menu-open')) return;

//   const currentScrollTop =
//     window.pageYOffset || document.documentElement.scrollTop;

//   if (currentScrollTop > lastScrollTop && currentScrollTop > 120) {
//     header.classList.add('header--hidden');
//   } else {
//     header.classList.remove('header--hidden');
//   }

//   lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
// });

// function getCart() {
//   try {
//     return JSON.parse(localStorage.getItem('cart')) || [];
//   } catch (error) {
//     localStorage.removeItem('cart');
//     return [];
//   }
// }

// function saveCart(cart) {
//   localStorage.setItem('cart', JSON.stringify(cart));
// }

// function updateCartCounter() {
//   if (!cartCounter) return;

//   const cart = getCart();

//   const totalCount = cart.reduce((sum, item) => {
//     return sum + Number(item.quantity || 0);
//   }, 0);

//   cartCounter.textContent = totalCount;
// }

// function addToCart(productId, quantity = 1) {
//   const cart = getCart();

//   const existingItem = cart.find((item) => {
//     return Number(item.productId) === Number(productId);
//   });

//   if (existingItem) {
//     existingItem.quantity += quantity;
//   } else {
//     cart.push({
//       productId: Number(productId),
//       quantity,
//     });
//   }

//   saveCart(cart);
//   updateCartCounter();
// }

// function showToast(title, text, type = 'success') {
//   const toast = document.querySelector('#toast');

//   if (!toast) return;

//   toast.classList.remove('toast--success', 'toast--error');
//   toast.classList.add(`toast--${type}`);

//   const icon = toast.querySelector('.toast__icon');
//   const titleElement = toast.querySelector('strong');
//   const textElement = toast.querySelector('span');

//   if (icon) icon.textContent = type === 'success' ? '✓' : '!';
//   if (titleElement) titleElement.textContent = title;
//   if (textElement) textElement.textContent = text;

//   toast.classList.add('active');

//   clearTimeout(toast.hideTimeout);

//   toast.hideTimeout = setTimeout(() => {
//     toast.classList.remove('active');
//   }, 3200);
// }

// function escapeHTML(value) {
//   return String(value || '')
//     .replaceAll('&', '&amp;')
//     .replaceAll('<', '&lt;')
//     .replaceAll('>', '&gt;')
//     .replaceAll('"', '&quot;')
//     .replaceAll("'", '&#039;');
// }

// function formatPrice(price) {
//   return Number(price || 0).toLocaleString('ru-RU');
// }

// function getSlugFromUrl() {
//   const pathParts = window.location.pathname.split('/').filter(Boolean);

//   if (pathParts[0] === 'product' && pathParts[1]) {
//     return pathParts[1];
//   }

//   return new URLSearchParams(window.location.search).get('slug');
// }

// function getProductBadge(product) {
//   if (product.isSale) return 'Акция';
//   if (product.isHit) return 'Хит';

//   return '';
// }

// function renderProduct(product) {
//   currentProduct = product;
//   currentQuantity = 1;

//   const title = escapeHTML(product.title);
//   const seoTitle = `${product.title} из клубники в шоколаде`;
//   const browserTitle = `${product.title} — клубника в шоколаде в Абакане`;
//   const description = escapeHTML(
//     product.description || product.shortDescription || '',
//   );
//   const shortDescription = escapeHTML(product.shortDescription || '');
//   const composition = escapeHTML(product.composition || '');
//   const image = product.image || '/site/img/products/product-placeholder.jpg';
//   const price = formatPrice(product.price);
//   const oldPrice = product.oldPrice ? formatPrice(product.oldPrice) : '';
//   const berriesCount = product.berriesCount
//     ? `${product.berriesCount} ягод`
//     : '';
//   const badge = getProductBadge(product);

//   document.title = `${browserTitle} | Тайна вкуса`;

//   if (productBreadcrumb) {
//     productBreadcrumb.textContent = product.title;
//   }

//   if (productSeoTitle) {
//     productSeoTitle.textContent = seoTitle;
//   }

//   productPage.innerHTML = `
//     <div class="product-gallery">
//       ${badge ? `<span class="product-gallery__badge">${badge}</span>` : ''}

//       <div class="product-gallery__image">
//         <img src="${image}" alt="${title}" />
//       </div>
//     </div>

//     <div class="product-info">
//       <p class="product-info__subtitle">Авторский букет на заказ</p>

// <h2 class="product-info__title">${title}</h2>

//       ${
//         shortDescription
//           ? `<p class="product-info__lead">${shortDescription}</p>`
//           : ''
//       }

//       <div class="product-info__meta">
//         ${
//           berriesCount
//             ? `
//               <div class="product-info__meta-item">
//                 <span>Количество ягод</span>
//                 <strong>${berriesCount}</strong>
//               </div>
//             `
//             : ''
//         }

//         <div class="product-info__meta-item">
//           <span>Изготовление</span>
//           <strong>В день заказа</strong>
//         </div>

//         <div class="product-info__meta-item">
//           <span>Доставка</span>
//           <strong>По Абакану</strong>
//         </div>
//       </div>

//       <div class="product-info__prices">
//         <strong>${price} ₽</strong>
//         ${oldPrice ? `<span>${oldPrice} ₽</span>` : ''}
//       </div>

//       <div class="product-info__quantity">
//         <p>Количество букетов</p>

//         <div>
//           <button type="button" data-quantity="minus">−</button>
//           <span id="productQuantity">1</span>
//           <button type="button" data-quantity="plus">+</button>
//         </div>
//       </div>

//       <div class="product-info__actions">
//         <button
//           class="product-info__button product-info__button--cart"
//           type="button"
//           id="productAddToCart"
//         >
//           В корзину
//         </button>

//         <button
//           class="product-info__button product-info__button--quick"
//           type="button"
//           id="productQuickOrder"
//         >
//           Быстрый заказ
//         </button>
//       </div>

//       ${
//         description
//           ? `
//             <div class="product-info__section">
//               <h2>Описание</h2>
//               <p>${description}</p>
//             </div>
//           `
//           : ''
//       }

//       ${
//         composition
//           ? `
//             <div class="product-info__section">
//               <h2>Состав</h2>
//               <p>${composition}</p>
//             </div>
//           `
//           : ''
//       }
//     </div>
//   `;
// }

// async function loadProduct() {
//   const slug = getSlugFromUrl();

//   if (!slug) {
//     productPage.innerHTML = `
//       <div class="product-page__error">
//         <h1>Букет не найден</h1>
//         <p>Ссылка некорректна или товар был удалён.</p>
//         <a href="/catalog.html">Вернуться в каталог</a>
//       </div>
//     `;
//     return;
//   }

//   try {
//     const response = await fetch(`/api/products/${encodeURIComponent(slug)}`);
//     const product = await response.json();

//     if (!response.ok) {
//       throw new Error(product.message || 'Букет не найден');
//     }

//     renderProduct(product);
//   } catch (error) {
//     console.error('Product loading error:', error);

//     productPage.innerHTML = `
//       <div class="product-page__error">
//         <h1>Букет не найден</h1>
//         <p>Возможно, ссылка устарела или букет временно недоступен.</p>
//         <a href="/catalog.html">Вернуться в каталог</a>
//       </div>
//     `;
//   }
// }

// function setQuickFormStartedAt() {
//   const startedAtInput = document.querySelector('#quickFormStartedAt');

//   if (startedAtInput) {
//     startedAtInput.value = String(Date.now());
//   }
// }

// function openQuickOrder(product = null) {
//   const modal = document.querySelector('#quickOrderModal');
//   const productBox = document.querySelector('#quickOrderProduct');
//   const productIdInput = document.querySelector('#quickProductId');

//   if (!modal) return;

//   if (product && productBox && productIdInput) {
//     productIdInput.value = product.id;

//     productBox.innerHTML = `
//       <img src="${product.image || '/site/img/products/product-placeholder.jpg'}" alt="${escapeHTML(product.title)}" />

//       <div>
//         <strong>${escapeHTML(product.title)}</strong>
//         <span>${formatPrice(product.price)} ₽ · ${currentQuantity} шт.</span>
//       </div>
//     `;
//   }

//   if (!product && productBox && productIdInput) {
//     productIdInput.value = '';

//     productBox.innerHTML = `
//       <div>
//         <strong>Быстрый заказ</strong>
//         <span>Мы поможем подобрать букет</span>
//       </div>
//     `;
//   }

//   setQuickFormStartedAt();

//   modal.classList.add('active');
//   modal.setAttribute('aria-hidden', 'false');
//   document.body.classList.add('modal-open');
// }

// function closeQuickOrder() {
//   const modal = document.querySelector('#quickOrderModal');

//   if (!modal) return;

//   modal.classList.remove('active');
//   modal.setAttribute('aria-hidden', 'true');
//   document.body.classList.remove('modal-open');
// }

// document.addEventListener('click', (event) => {
//   const quantityButton = event.target.closest('[data-quantity]');
//   const addButton = event.target.closest('#productAddToCart');
//   const quickButton = event.target.closest('#productQuickOrder');
//   const quickTriggerButton = event.target.closest('.quick-order-trigger');
//   const closeQuickButton = event.target.closest('[data-quick-close]');

//   if (closeQuickButton) {
//     closeQuickOrder();
//     return;
//   }

//   if (quantityButton) {
//     const quantityElement = document.querySelector('#productQuantity');

//     if (!quantityElement) return;

//     if (quantityButton.dataset.quantity === 'plus') {
//       currentQuantity += 1;
//     }

//     if (quantityButton.dataset.quantity === 'minus') {
//       currentQuantity = Math.max(currentQuantity - 1, 1);
//     }

//     quantityElement.textContent = currentQuantity;
//     return;
//   }

//   if (addButton && currentProduct) {
//     addToCart(currentProduct.id, currentQuantity);

//     showToast(
//       'Букет добавлен',
//       `В корзину добавлено: ${currentQuantity} шт.`,
//       'success',
//     );

//     return;
//   }

//   if (quickButton && currentProduct) {
//     openQuickOrder(currentProduct);
//     return;
//   }

//   if (quickTriggerButton) {
//     openQuickOrder();
//   }
// });

// document.addEventListener('keydown', (event) => {
//   if (event.key === 'Escape') {
//     closeQuickOrder();
//   }
// });

// document
//   .querySelector('#quickOrderForm')
//   ?.addEventListener('submit', async (event) => {
//     event.preventDefault();

//     const form = event.target;
//     const submitButton = form.querySelector('button[type="submit"]');
//     const formData = new FormData(form);
//     const orderData = Object.fromEntries(formData);

//     if (currentProduct && orderData.productId) {
//       orderData.items = [
//         {
//           productId: Number(currentProduct.id),
//           quantity: Number(currentQuantity),
//         },
//       ];
//     }

//     try {
//       submitButton.disabled = true;
//       submitButton.textContent = 'Отправляем...';

//       const response = await fetch('/api/orders', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(orderData),
//       });

//       const result = await response.json();

//       if (!response.ok) {
//         throw new Error(result.message || 'Ошибка отправки заявки');
//       }

//       closeQuickOrder();
//       form.reset();

//       showToast(
//         'Заявка отправлена',
//         'Мы скоро свяжемся с вами для подтверждения заказа',
//         'success',
//       );
//     } catch (error) {
//       console.error('Product order error:', error);

//       showToast(
//         'Заявка не отправлена',
//         error.message || 'Попробуйте ещё раз позже',
//         'error',
//       );
//     } finally {
//       submitButton.disabled = false;
//       submitButton.textContent = 'Отправить заявку';
//     }
//   });

// updateCartCounter();
// loadProduct();


// new

const header = document.querySelector('.header');
const burgerButton = document.querySelector('.header__burger');
const closeButton = document.querySelector('.header__close');
const overlay = document.querySelector('.header__overlay');
const mobileLinks = document.querySelectorAll('.header__mobile-link');
const cartCounter = document.querySelector('.header__cart-count');

const productPage = document.querySelector('#productPage');
const productBreadcrumb = document.querySelector('#productBreadcrumb');
const productSeoTitle = document.querySelector('#productSeoTitle');

let lastScrollTop = 0;
let currentProduct = null;
let currentQuantity = 1;

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

function addToCart(productId, quantity = 1) {
  const cart = getCart();

  const existingItem = cart.find((item) => {
    return Number(item.productId) === Number(productId);
  });

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      productId: Number(productId),
      quantity,
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

function getAbsoluteUrl(path) {
  if (!path) return '';

  try {
    return new URL(path, window.location.origin).href;
  } catch (error) {
    return path;
  }
}

function getSlugFromUrl() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);

  if (pathParts[0] === 'product' && pathParts[1]) {
    return pathParts[1];
  }

  return new URLSearchParams(window.location.search).get('slug');
}

function getProductBadge(product) {
  if (product.isSale) return 'Акция';
  if (product.isHit) return 'Хит';

  return '';
}

function updateProductSeo(product, price) {
  const productTitle = product.title || 'Клубника в шоколаде';
  const productDescription =
    product.description ||
    product.shortDescription ||
    'Авторский букет из свежей клубники в шоколаде в Абакане.';

  const productImage = getAbsoluteUrl(
    product.image || '/site/img/main-hero.png',
  );

  const productUrl = window.location.href;

  document.title = `${productTitle} — клубника в шоколаде в Абакане | Тайна вкуса`;

  const metaDescription = document.querySelector('meta[name="description"]');

  if (metaDescription) {
    metaDescription.setAttribute(
      'content',
      `${productTitle} из свежей клубники в шоколаде. Авторский букет в Абакане. Цена ${price} ₽. Заказ и доставка по городу.`,
    );
  }

  const canonical = document.querySelector('link[rel="canonical"]');

  if (canonical) {
    canonical.setAttribute('href', productUrl);
  }

  const ogTitle = document.querySelector('meta[property="og:title"]');

  if (ogTitle) {
    ogTitle.setAttribute('content', `${productTitle} — Тайна вкуса`);
  }

  const ogDescription = document.querySelector(
    'meta[property="og:description"]',
  );

  if (ogDescription) {
    ogDescription.setAttribute(
      'content',
      `${productTitle} из свежей клубники в шоколаде. Доставка по Абакану.`,
    );
  }

  const ogUrl = document.querySelector('meta[property="og:url"]');

  if (ogUrl) {
    ogUrl.setAttribute('content', productUrl);
  }

  const ogImage = document.querySelector('meta[property="og:image"]');

  if (ogImage) {
    ogImage.setAttribute('content', productImage);
  }

  const oldSchema = document.querySelector('#productSchema');

  if (oldSchema) {
    oldSchema.remove();
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productTitle,
    description: productDescription,
    image: productImage,
    brand: {
      '@type': 'Brand',
      name: 'Тайна вкуса',
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      price: Number(product.price || 0),
      priceCurrency: 'RUB',
      availability: 'https://schema.org/InStock',
    },
  };

  const script = document.createElement('script');

  script.type = 'application/ld+json';
  script.id = 'productSchema';
  script.textContent = JSON.stringify(schema);

  document.head.appendChild(script);
}

function renderProduct(product) {
  currentProduct = product;
  currentQuantity = 1;

  const title = escapeHTML(product.title);
  const seoTitle = `${product.title} из клубники в шоколаде`;
  const description = escapeHTML(
    product.description || product.shortDescription || '',
  );
  const shortDescription = escapeHTML(product.shortDescription || '');
  const composition = escapeHTML(product.composition || '');
  const image = product.image || '/site/img/products/product-placeholder.jpg';
  const price = formatPrice(product.price);
  const oldPrice = product.oldPrice ? formatPrice(product.oldPrice) : '';
  const berriesCount = product.berriesCount
    ? `${product.berriesCount} ягод`
    : '';
  const badge = getProductBadge(product);

  updateProductSeo(product, price);

  if (productBreadcrumb) {
    productBreadcrumb.textContent = product.title;
  }

  if (productSeoTitle) {
    productSeoTitle.textContent = seoTitle;
  }

  productPage.innerHTML = `
    <div class="product-gallery">
      ${badge ? `<span class="product-gallery__badge">${badge}</span>` : ''}

      <div class="product-gallery__image">
        <img src="${image}" alt="${title} — клубника в шоколаде в Абакане" />
      </div>
    </div>

    <div class="product-info">
      <p class="product-info__subtitle">Авторский букет на заказ</p>

      <h2 class="product-info__title">${title}</h2>

      ${
        shortDescription
          ? `<p class="product-info__lead">${shortDescription}</p>`
          : ''
      }

      <div class="product-info__meta">
        ${
          berriesCount
            ? `
              <div class="product-info__meta-item">
                <span>Количество ягод</span>
                <strong>${berriesCount}</strong>
              </div>
            `
            : ''
        }

        <div class="product-info__meta-item">
          <span>Изготовление</span>
          <strong>В день заказа</strong>
        </div>

        <div class="product-info__meta-item">
          <span>Доставка</span>
          <strong>По Абакану</strong>
        </div>
      </div>

      <div class="product-info__prices">
        <strong>${price} ₽</strong>
        ${oldPrice ? `<span>${oldPrice} ₽</span>` : ''}
      </div>

      <div class="product-info__quantity">
        <p>Количество букетов</p>

        <div>
          <button type="button" data-quantity="minus">−</button>
          <span id="productQuantity">1</span>
          <button type="button" data-quantity="plus">+</button>
        </div>
      </div>

      <div class="product-info__actions">
        <button
          class="product-info__button product-info__button--cart"
          type="button"
          id="productAddToCart"
        >
          В корзину
        </button>

        <button
          class="product-info__button product-info__button--quick"
          type="button"
          id="productQuickOrder"
        >
          Быстрый заказ
        </button>
      </div>

      ${
        description
          ? `
            <div class="product-info__section">
              <h2>Описание</h2>
              <p>${description}</p>
            </div>
          `
          : ''
      }

      ${
        composition
          ? `
            <div class="product-info__section">
              <h2>Состав</h2>
              <p>${composition}</p>
            </div>
          `
          : ''
      }
    </div>
  `;
}

async function loadProduct() {
  const slug = getSlugFromUrl();

  if (!slug) {
    productPage.innerHTML = `
      <div class="product-page__error">
        <h1>Букет не найден</h1>
        <p>Ссылка некорректна или товар был удалён.</p>
        <a href="/catalog.html">Вернуться в каталог</a>
      </div>
    `;
    return;
  }

  try {
    const response = await fetch(`/api/products/${encodeURIComponent(slug)}`);
    const product = await response.json();

    if (!response.ok) {
      throw new Error(product.message || 'Букет не найден');
    }

    renderProduct(product);
  } catch (error) {
    console.error('Product loading error:', error);

    productPage.innerHTML = `
      <div class="product-page__error">
        <h1>Букет не найден</h1>
        <p>Возможно, ссылка устарела или букет временно недоступен.</p>
        <a href="/catalog.html">Вернуться в каталог</a>
      </div>
    `;
  }
}

function setQuickFormStartedAt() {
  const startedAtInput = document.querySelector('#quickFormStartedAt');

  if (startedAtInput) {
    startedAtInput.value = String(Date.now());
  }
}

function openQuickOrder(product = null) {
  const modal = document.querySelector('#quickOrderModal');
  const productBox = document.querySelector('#quickOrderProduct');
  const productIdInput = document.querySelector('#quickProductId');

  if (!modal) return;

  if (product && productBox && productIdInput) {
    productIdInput.value = product.id;

    productBox.innerHTML = `
      <img src="${product.image || '/site/img/products/product-placeholder.jpg'}" alt="${escapeHTML(product.title)}" />

      <div>
        <strong>${escapeHTML(product.title)}</strong>
        <span>${formatPrice(product.price)} ₽ · ${currentQuantity} шт.</span>
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

document.addEventListener('click', (event) => {
  const quantityButton = event.target.closest('[data-quantity]');
  const addButton = event.target.closest('#productAddToCart');
  const quickButton = event.target.closest('#productQuickOrder');
  const quickTriggerButton = event.target.closest('.quick-order-trigger');
  const closeQuickButton = event.target.closest('[data-quick-close]');

  if (closeQuickButton) {
    closeQuickOrder();
    return;
  }

  if (quantityButton) {
    const quantityElement = document.querySelector('#productQuantity');

    if (!quantityElement) return;

    if (quantityButton.dataset.quantity === 'plus') {
      currentQuantity += 1;
    }

    if (quantityButton.dataset.quantity === 'minus') {
      currentQuantity = Math.max(currentQuantity - 1, 1);
    }

    quantityElement.textContent = currentQuantity;
    return;
  }

  if (addButton && currentProduct) {
    addToCart(currentProduct.id, currentQuantity);

    showToast(
      'Букет добавлен',
      `В корзину добавлено: ${currentQuantity} шт.`,
      'success',
    );

    return;
  }

  if (quickButton && currentProduct) {
    openQuickOrder(currentProduct);
    return;
  }

  if (quickTriggerButton) {
    openQuickOrder();
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

    if (currentProduct && orderData.productId) {
      orderData.items = [
        {
          productId: Number(currentProduct.id),
          quantity: Number(currentQuantity),
        },
      ];
    }

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
      console.error('Product order error:', error);

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
loadProduct();
