const Admin = (() => {
  const state = {
    csrfToken: null,
  };

  function redirectToLogin() {
    window.location.href = '/admin/login.html';
  }

  function escapeHTML(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function formatMoney(value) {
    const number = Number(value) || 0;

    return `${number.toLocaleString('ru-RU')} ₽`;
  }

  function formatDate(value) {
    if (!value) {
      return '—';
    }

    return new Date(value).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async function request(url, options = {}) {
    const headers = {
      ...(options.headers || {}),
    };

    const config = {
      method: options.method || 'GET',
      credentials: 'include',
      headers,
    };

    if (options.csrf && state.csrfToken) {
      headers['X-CSRF-Token'] = state.csrfToken;
    }

    if (options.body !== undefined) {
      const isFormData = options.body instanceof FormData;

      if (isFormData) {
        config.body = options.body;
      } else {
        headers['Content-Type'] = 'application/json';
        config.body = JSON.stringify(options.body);
      }
    }

    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      redirectToLogin();
      return null;
    }

    if (!response.ok) {
      throw new Error(data.message || 'Ошибка запроса');
    }

    return data;
  }

  async function checkAuth() {
    return request('/api/admin/check');
  }

  async function loadCsrfToken() {
    const data = await request('/api/admin/csrf');

    if (data && data.csrfToken) {
      state.csrfToken = data.csrfToken;
    }

    return state.csrfToken;
  }

  function setActiveNav() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('[data-admin-nav]');

    links.forEach((link) => {
      const href = link.getAttribute('href');

      if (href === currentPath) {
        link.classList.add('active');
      }
    });
  }

  function bindLogout() {
    const logoutButtons = document.querySelectorAll('[data-admin-logout]');

    logoutButtons.forEach((button) => {
      button.addEventListener('click', async () => {
        try {
          button.disabled = true;
          button.textContent = 'Выходим...';

          await request('/api/admin/logout', {
            method: 'POST',
          });

          redirectToLogin();
        } catch (error) {
          console.error('Logout error:', error);
          alert('Не удалось выйти из админки');
        } finally {
          button.disabled = false;
          button.textContent = 'Выйти';
        }
      });
    });
  }

  function disableNumberInputWheel() {
    const numberInputs = document.querySelectorAll('input[type="number"]');

    numberInputs.forEach((input) => {
      input.addEventListener(
        'wheel',
        (event) => {
          event.preventDefault();
          input.blur();
        },
        {
          passive: false,
        },
      );
    });
  }

  function getPage() {
    return document.body.dataset.adminPage || '';
  }

  async function initProductsPage() {
    const tableBody = document.querySelector('#productsTableBody');
    const countBox = document.querySelector('#productsCount');
    const emptyBox = document.querySelector('#productsEmpty');

    if (!tableBody) {
      return;
    }

    try {
      const data = await request('/api/admin/products');
      const products =
        data && Array.isArray(data.products) ? data.products : [];

      if (countBox) {
        countBox.textContent = `${products.length} букетов`;
      }

      if (!products.length) {
        tableBody.innerHTML = '';
        if (emptyBox) {
          emptyBox.hidden = false;
        }
        return;
      }

      if (emptyBox) {
        emptyBox.hidden = true;
      }

      tableBody.innerHTML = products
        .map((product) => {
          const statusBadge = product.isActive
            ? '<span class="admin-badge admin-badge--active">Активен</span>'
            : '<span class="admin-badge admin-badge--muted">Скрыт</span>';

          const homeBadge = product.showOnHome
            ? '<span class="admin-badge admin-badge--accent">Да</span>'
            : '<span class="admin-badge admin-badge--muted">Нет</span>';

          const flags = [
            product.isHit
              ? '<span class="admin-badge admin-badge--accent">Хит</span>'
              : '',
            product.isSale
              ? '<span class="admin-badge admin-badge--accent">Акция</span>'
              : '',
          ]
            .filter(Boolean)
            .join(' ');

          return `
            <tr>
              <td>
                <strong>${escapeHTML(product.title)}</strong>
                <small>${escapeHTML(product.slug)}</small>
                ${flags ? `<div class="admin-row-flags">${flags}</div>` : ''}
              </td>

              <td>
                <strong>${formatMoney(product.price)}</strong>
                ${
                  product.oldPrice
                    ? `<small>Старая: ${formatMoney(product.oldPrice)}</small>`
                    : '<small>Без старой цены</small>'
                }
              </td>

              <td>${product.berriesCount || '—'}</td>

              <td>${statusBadge}</td>

              <td>${homeBadge}</td>

              <td>
                <div class="admin-actions">
                  <a class="admin-action" href="/admin/product-edit.html?id=${product.id}">
                    Изменить
                  </a>

                  <button
                    class="admin-action admin-action--danger"
                    type="button"
                    data-product-hide="${product.id}"
                  >
                    Скрыть
                  </button>
                </div>
              </td>
            </tr>
          `;
        })
        .join('');

      bindProductHideButtons();
    } catch (error) {
      console.error('Products load error:', error);

      tableBody.innerHTML = `
        <tr>
          <td colspan="6">Не удалось загрузить букеты</td>
        </tr>
      `;

      if (countBox) {
        countBox.textContent = 'Ошибка загрузки';
      }
    }
  }

  function bindProductHideButtons() {
    const buttons = document.querySelectorAll('[data-product-hide]');

    buttons.forEach((button) => {
      button.addEventListener('click', async () => {
        const productId = button.dataset.productHide;

        if (!productId) {
          return;
        }

        const isConfirmed = confirm('Скрыть этот букет с сайта?');

        if (!isConfirmed) {
          return;
        }

        try {
          button.disabled = true;
          button.textContent = 'Скрываем...';

          await request(`/api/admin/products/${productId}`, {
            method: 'DELETE',
            csrf: true,
          });

          await initProductsPage();
        } catch (error) {
          console.error('Product hide error:', error);
          alert(error.message || 'Не удалось скрыть букет');
        } finally {
          button.disabled = false;
          button.textContent = 'Скрыть';
        }
      });
    });
  }

  function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      return null;
    }

    return id;
  }

  function setFormValue(form, name, value) {
    const field = form.elements[name];

    if (!field) {
      return;
    }

    if (field.type === 'checkbox') {
      field.checked = Boolean(value);
      return;
    }

    field.value = value ?? '';
  }

  function fillProductForm(form, product) {
    setFormValue(form, 'title', product.title);
    setFormValue(form, 'slug', product.slug);
    setFormValue(form, 'category', product.category);
    setFormValue(form, 'image', product.image);
    setFormValue(form, 'price', product.price);
    setFormValue(form, 'oldPrice', product.oldPrice);
    setFormValue(form, 'berriesCount', product.berriesCount);
    setFormValue(form, 'sortOrder', product.sortOrder);
    setFormValue(form, 'shortDescription', product.shortDescription);
    setFormValue(form, 'description', product.description);
    setFormValue(form, 'composition', product.composition);
    setFormValue(form, 'isActive', product.isActive);
    setFormValue(form, 'isHit', product.isHit);
    setFormValue(form, 'isSale', product.isSale);
    setFormValue(form, 'showOnHome', product.showOnHome);
    setProductImagePreview(product.image);
  }

  function setProductImagePreview(imageUrl) {
    const imagePathInput = document.querySelector('#productImagePath');
    const preview = document.querySelector('#productImagePreview');
    const previewImage = preview ? preview.querySelector('img') : null;
    const imageName = document.querySelector('#productImageName');

    if (imagePathInput) {
      imagePathInput.value = imageUrl || '';
    }

    if (!preview || !previewImage || !imageUrl) {
      if (preview) {
        preview.hidden = true;
      }

      return;
    }

    previewImage.src = imageUrl;
    preview.hidden = false;

    if (imageName) {
      imageName.textContent = imageUrl;
    }
  }

  function bindProductImagePreview() {
    const fileInput = document.querySelector('#productImageFile');
    const imageName = document.querySelector('#productImageName');
    const preview = document.querySelector('#productImagePreview');
    const previewImage = preview ? preview.querySelector('img') : null;

    if (!fileInput) {
      return;
    }

    fileInput.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];

      if (!file) {
        return;
      }

      if (imageName) {
        imageName.textContent = file.name;
      }

      if (preview && previewImage) {
        previewImage.src = URL.createObjectURL(file);
        preview.hidden = false;
      }
    });
  }

  async function uploadProductImageIfSelected() {
    const fileInput = document.querySelector('#productImageFile');

    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
      return null;
    }

    const formData = new FormData();
    formData.append('image', fileInput.files[0]);

    const data = await request('/api/admin/uploads/product-image', {
      method: 'POST',
      body: formData,
      csrf: true,
    });

    return data && data.imageUrl ? data.imageUrl : null;
  }

  function getProductFormPayload(form) {
    const formData = new FormData(form);

    return {
      title: String(formData.get('title') || '').trim(),
      slug: String(formData.get('slug') || '').trim(),
      category: String(formData.get('category') || '').trim() || 'Букеты',
      image: String(formData.get('image') || '').trim(),
      price: Number(formData.get('price') || 0),
      oldPrice: formData.get('oldPrice')
        ? Number(formData.get('oldPrice'))
        : null,
      berriesCount: formData.get('berriesCount')
        ? Number(formData.get('berriesCount'))
        : null,
      sortOrder: formData.get('sortOrder')
        ? Number(formData.get('sortOrder'))
        : 100,
      shortDescription: String(formData.get('shortDescription') || '').trim(),
      description: String(formData.get('description') || '').trim(),
      composition: String(formData.get('composition') || '').trim(),
      isActive: formData.has('isActive'),
      isHit: formData.has('isHit'),
      isSale: formData.has('isSale'),
      showOnHome: formData.has('showOnHome'),
    };
  }

  function showFormError(message) {
    const errorBox = document.querySelector('#productFormError');

    if (!errorBox) {
      alert(message);
      return;
    }

    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  function hideFormError() {
    const errorBox = document.querySelector('#productFormError');

    if (!errorBox) {
      return;
    }

    errorBox.textContent = '';
    errorBox.hidden = true;
  }

  async function initProductEditPage() {
    const form = document.querySelector('#productForm');
    const title = document.querySelector('#productEditTitle');
    const productId = getProductIdFromUrl();

    if (!form) {
      return;
    }

    bindProductImagePreview();

    if (productId) {
      try {
        const data = await request(`/api/admin/products/${productId}`);

        if (data && data.product) {
          fillProductForm(form, data.product);

          if (title) {
            title.textContent = 'Редактирование букета';
          }
        }
      } catch (error) {
        console.error('Product detail load error:', error);
        showFormError(error.message || 'Не удалось загрузить букет');
      }
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      hideFormError();

      const submitButton = form.querySelector('button[type="submit"]');
      const payload = getProductFormPayload(form);

      const uploadedImageUrl = await uploadProductImageIfSelected();

      if (uploadedImageUrl) {
        payload.image = uploadedImageUrl;
      }

      try {
        submitButton.disabled = true;
        submitButton.textContent = 'Сохраняем...';

        if (productId) {
          await request(`/api/admin/products/${productId}`, {
            method: 'PATCH',
            body: payload,
            csrf: true,
          });
        } else {
          await request('/api/admin/products', {
            method: 'POST',
            body: payload,
            csrf: true,
          });
        }

        window.location.href = '/admin/products.html';
      } catch (error) {
        console.error('Product save error:', error);
        showFormError(error.message || 'Не удалось сохранить букет');
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Сохранить';
      }
    });
  }

  function getOrderStatusLabel(status) {
    const labels = {
      new: 'Новая',
      in_work: 'В работе',
      completed: 'Выполнена',
      cancelled: 'Отменена',
    };

    return labels[status] || status || '—';
  }

  function getOrderItemsText(order) {
    if (!order.items || !order.items.length) {
      return 'Без товаров';
    }

    return order.items
      .map((item) => {
        const title = escapeHTML(item.titleSnapshot || 'Букет');
        const quantity = item.quantity || 1;
        const berries = item.berriesCountSnapshot
          ? `, ${item.berriesCountSnapshot} ягод`
          : '';

        return `${title} × ${quantity}${berries}`;
      })
      .join('<br />');
  }

  async function initOrdersPage() {
    const tableBody = document.querySelector('#ordersTableBody');
    const countBox = document.querySelector('#ordersCount');
    const emptyBox = document.querySelector('#ordersEmpty');

    if (!tableBody) {
      return;
    }

    try {
      const data = await request('/api/admin/orders');
      const orders = data && Array.isArray(data.orders) ? data.orders : [];

      if (countBox) {
        countBox.textContent = `${orders.length} заявок`;
      }

      if (!orders.length) {
        tableBody.innerHTML = '';

        if (emptyBox) {
          emptyBox.hidden = false;
        }

        return;
      }

      if (emptyBox) {
        emptyBox.hidden = true;
      }

      tableBody.innerHTML = orders
        .map((order) => {
          return `
          <tr>
            <td>
              <strong>#${order.id}</strong>
              <small>${escapeHTML(order.type || 'order')}</small>
            </td>

            <td>
              <strong>${escapeHTML(order.customerName || 'Без имени')}</strong>
              ${
                order.comment
                  ? `<small>${escapeHTML(order.comment)}</small>`
                  : '<small>Без комментария</small>'
              }
            </td>

            <td>
              <a href="tel:${escapeHTML(order.phone || '')}">
                ${escapeHTML(order.phone || '—')}
              </a>
            </td>

            <td>${getOrderItemsText(order)}</td>

            <td>
              <strong>${formatMoney(order.totalPrice)}</strong>
            </td>

            <td>
              <select class="admin-status-select" data-order-status="${order.id}">
                <option value="new" ${order.status === 'new' ? 'selected' : ''}>
                  Новая
                </option>

                <option value="in_work" ${order.status === 'in_work' ? 'selected' : ''}>
                  В работе
                </option>

                <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>
                  Выполнена
                </option>

                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>
                  Отменена
                </option>
              </select>
            </td>

            <td>
              <small>${formatDate(order.createdAt)}</small>
            </td>
          </tr>
        `;
        })
        .join('');

      bindOrderStatusSelects();
    } catch (error) {
      console.error('Orders load error:', error);

      tableBody.innerHTML = `
      <tr>
        <td colspan="7">Не удалось загрузить заявки</td>
      </tr>
    `;

      if (countBox) {
        countBox.textContent = 'Ошибка загрузки';
      }
    }
  }

  function bindOrderStatusSelects() {
    const selects = document.querySelectorAll('[data-order-status]');

    selects.forEach((select) => {
      select.addEventListener('change', async () => {
        const orderId = select.dataset.orderStatus;
        const status = select.value;

        if (!orderId || !status) {
          return;
        }

        try {
          select.disabled = true;

          await request(`/api/admin/orders/${orderId}/status`, {
            method: 'PATCH',
            body: {
              status,
            },
            csrf: true,
          });
        } catch (error) {
          console.error('Order status update error:', error);
          alert(error.message || 'Не удалось обновить статус заявки');
          await initOrdersPage();
        } finally {
          select.disabled = false;
        }
      });
    });
  }

  async function init() {
    try {
      await checkAuth();
      await loadCsrfToken();

      setActiveNav();
      bindLogout();
      disableNumberInputWheel();

      const page = getPage();

      if (page === 'products') {
        await initProductsPage();
      }

      if (page === 'product-edit') {
        await initProductEditPage();
      }

      if (page === 'orders') {
        await initOrdersPage();
      }

      document.body.classList.add('admin-ready');
    } catch (error) {
      console.error('Admin init error:', error);
      redirectToLogin();
    }
  }

  return {
    state,
    request,
    init,
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  Admin.init();
});

window.Admin = Admin;
