(() => {
  'use strict';

  let resolveLogin;
  let loginPromise;
  let initialized = false;

  function mapDom() {
    return {
      screen: document.getElementById('authScreen'),
      form: document.getElementById('authForm'),
      username: document.getElementById('authUsername'),
      password: document.getElementById('authPassword'),
      toggle: document.getElementById('authTogglePassword'),
      submit: document.getElementById('authSubmit'),
      submitLabel: document.getElementById('authSubmitLabel'),
      error: document.getElementById('authError'),
      app: document.getElementById('app'),
      loader: document.getElementById('pageLoader')
    };
  }

  function initialize() {
    if (initialized) return;
    initialized = true;

    const dom = mapDom();

    dom.form?.addEventListener('submit', handleLogin);
    dom.toggle?.addEventListener('click', togglePassword);
    document.getElementById('logoutButton')
      ?.addEventListener('click', confirmLogout);
    document.getElementById('openRegistration')
      ?.addEventListener('click', openRegistration);
    document.getElementById('registrationForm')
      ?.addEventListener('submit', handleRegistration);
    document.querySelectorAll('[data-registration-close]')
      .forEach(element => element.addEventListener('click', closeRegistration));
    window.addEventListener('ftsp:auth-required', showLogin);
  }

  function confirmLogout() {
    const confirmed = window.confirm(
      'Yakin ingin keluar dari SurveyPro? Anda perlu login kembali untuk membuka aplikasi.'
    );

    if (confirmed) {
      window.FTSPApi.logout();
    }
  }

  function openRegistration() {
    const modal = document.getElementById('registrationModal');
    if (!modal) return;
    modal.hidden = false;
    setRegistrationMessage('', '');
    window.setTimeout(
      () => document.querySelector('#registrationForm [name="name"]')?.focus(),
      80
    );
  }

  function closeRegistration() {
    const modal = document.getElementById('registrationModal');
    if (modal) modal.hidden = true;
  }

  async function handleRegistration(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const submit = document.getElementById('registrationSubmit');
    const label = document.getElementById('registrationSubmitLabel');
    const data = new FormData(form);

    const payload = {
      applicantType: data.get('applicantType'),
      name: String(data.get('name') || '').trim(),
      username: String(data.get('username') || '').trim(),
      password: String(data.get('password') || ''),
      phone: String(data.get('phone') || '').trim(),
      email: String(data.get('email') || '').trim()
    };

    setRegistrationMessage('', '');
    if (submit) submit.disabled = true;
    if (label) label.textContent = 'Mengirim...';

    try {
      const response = await window.FTSPApi.registerAccount(payload);

      if (!response || response.success !== true) {
        setRegistrationMessage(response?.message || 'Pendaftaran gagal.', 'error');
        return;
      }

      form.reset();
      setRegistrationMessage(
        'Pendaftaran berhasil dikirim. Akun Anda sedang menunggu pemeriksaan dan persetujuan Administrator. Silakan login setelah akun dinyatakan aktif.',
        'success'
      );
    } catch (error) {
      setRegistrationMessage(
        error?.message || 'Server tidak dapat dihubungi.',
        'error'
      );
    } finally {
      if (submit) submit.disabled = false;
      if (label) label.textContent = 'Kirim Pendaftaran';
    }
  }

  function setRegistrationMessage(message, type) {
    const element = document.getElementById('registrationMessage');
    if (!element) return;
    element.textContent = String(message || '');
    element.hidden = !message;
    element.classList.toggle('is-success', type === 'success');
    element.classList.toggle('is-error', type === 'error');
  }

  function requireLogin() {
    initialize();

    if (!loginPromise) {
      loginPromise = new Promise(resolve => {
        resolveLogin = resolve;
      });
    }

    if (!window.FTSPApi.hasSession()) {
      showLogin();
      return loginPromise;
    }

    window.FTSPApi.validateSession()
      .then(response => {
        if (response && response.success === true) {
          hideLogin();
          applyRole(response.user || window.FTSPApi.getCurrentUser());
          resolveLogin(response.user || {});
          return;
        }

        window.FTSPApi.clearSession();
        showLogin(response?.message || 'Sesi berakhir. Silakan masuk kembali.');
      })
      .catch(() => {
        showLogin('Server tidak dapat dihubungi. Periksa koneksi internet.');
      });

    return loginPromise;
  }

  async function handleLogin(event) {
    event.preventDefault();

    const dom = mapDom();
    const username = String(dom.username?.value || '').trim();
    const password = String(dom.password?.value || '');

    setError('');
    setLoading(true);

    try {
      const response = await window.FTSPApi.login(username, password);

      if (!response || response.success !== true) {
        setError(response?.message || 'Login gagal.');
        return;
      }

      hideLogin();
      applyRole(response.user);

      if (typeof resolveLogin === 'function') {
        resolveLogin(response.user || {});
        resolveLogin = null;
      } else {
        window.location.reload();
      }
    } catch (error) {
      setError(error?.message || 'Koneksi ke server gagal.');
    } finally {
      setLoading(false);
    }
  }

  function applyRole(user) {
    const role = String(user?.role || 'VIEWER').toUpperCase();
    document.documentElement.dataset.userRole = role;

    document.querySelectorAll('[data-route="settings"]').forEach(element => {
      element.hidden = role !== 'ADMIN';
    });

    if (role === 'VIEWER') {
      document.querySelectorAll(
        '[data-ftsp-pondok-add], [data-ftsp-survey-add], [data-survey-action], [data-pondok-action]'
      ).forEach(element => {
        element.hidden = true;
      });
    }
  }

  function showLogin(message) {
    const dom = mapDom();
    if (dom.screen) dom.screen.hidden = false;
    if (dom.app) dom.app.hidden = true;
    if (dom.loader) dom.loader.hidden = true;
    setError(typeof message === 'string' ? message : '');
    window.setTimeout(() => dom.username?.focus(), 80);
  }

  function hideLogin() {
    const dom = mapDom();
    if (dom.screen) dom.screen.hidden = true;
  }

  function setError(message) {
    const error = mapDom().error;
    if (!error) return;
    error.textContent = String(message || '');
    error.hidden = !message;
  }

  function setLoading(loading) {
    const dom = mapDom();
    if (dom.submit) dom.submit.disabled = Boolean(loading);
    if (dom.submitLabel) {
      dom.submitLabel.textContent = loading
        ? 'Memverifikasi...'
        : 'Masuk ke SurveyPro';
    }
  }

  function togglePassword() {
    const dom = mapDom();
    if (!dom.password || !dom.toggle) return;
    const visible = dom.password.type === 'text';
    dom.password.type = visible ? 'password' : 'text';
    dom.toggle.querySelector('.material-symbols-rounded').textContent =
      visible ? 'visibility' : 'visibility_off';
    dom.toggle.setAttribute(
      'aria-label',
      visible ? 'Tampilkan password' : 'Sembunyikan password'
    );
  }

  window.FTSPAuth = Object.freeze({
    requireLogin,
    showLogin,
    logout: confirmLogout,
    currentUser: () => window.FTSPApi.getCurrentUser()
  });
})();
