document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#adminLoginForm');
  const errorBox = document.querySelector('#adminLoginError');

  if (!form) {
    return;
  }

  function showError(message) {
    if (!errorBox) {
      alert(message);
      return;
    }

    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  function hideError() {
    if (!errorBox) {
      return;
    }

    errorBox.textContent = '';
    errorBox.hidden = true;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    hideError();

    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);

    const login = String(formData.get('login') || '').trim();
    const password = String(formData.get('password') || '');

    if (!login || !password) {
      showError('Введите логин и пароль');
      return;
    }

    try {
      submitButton.disabled = true;
      submitButton.textContent = 'Проверяем...';

      const response = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          login,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        showError(data.message || 'Не удалось войти');
        return;
      }

      window.location.href = '/admin/products.html';
    } catch (error) {
      console.error('Admin login error:', error);
      showError('Ошибка соединения. Попробуйте ещё раз.');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Войти';
    }
  });
});
