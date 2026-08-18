(() => {
  'use strict';

  const config = window.FTSP_CONFIG;
  let sequence = 0;

  const methodMap = Object.freeze({
    ftspGetBootstrapData: ['bootstrap', () => ({})],
    ftspGetPondokList: ['pondokList', args => args[0] || {}],
    ftspGetPondokById: ['pondokDetail', args => ({ pondokId: args[0] })],
    ftspGetPondokFormOptions: ['pondokOptions', () => ({})],
    ftspGetPondokSummary: ['pondokSummary', () => ({})],
    ftspSavePondok: ['pondokSave', args => args[0] || {}],
    ftspSetPondokStatus: ['pondokStatus', args => ({ pondokId: args[0], status: args[1] })],
    ftspGetSurveyList: ['surveyList', args => args[0] || {}],
    ftspGetSurveyById: ['surveyDetail', args => ({ surveyId: args[0] })],
    ftspGetSurveyFormOptions: ['surveyOptions', () => ({})],
    ftspGetSurveySummary: ['surveySummary', () => ({})],
    ftspSaveSurvey: ['surveySave', args => args[0] || {}],
    ftspSetSurveyVerificationStatus: ['surveyStatus', args => ({ surveyId: args[0], status: args[1] })],
    ftspGetSurveyWorkspaceData: ['surveyWorkspace', args => args[0] || {}],
    ftspExportSurveyPdf: ['surveyPdf', args => args[0] || {}],
    ftspGetInsightData: ['insightData', args => args[0] || {}],
    ftspGetSettingsData: ['settingsData', () => ({})],
    ftspSaveSettings: ['settingsSave', args => args[0] || {}]
  });

  function request(action, payload = {}, options = {}) {
    return new Promise((resolve, reject) => {
      const isPublic = ['health', 'login', 'register'].includes(action);
      const sessionToken = localStorage.getItem(config.SESSION_STORAGE_KEY) || '';

      if (!isPublic && !sessionToken) {
        reject(new Error('AUTH_REQUIRED'));
        return;
      }

      const callback = `__ftspJsonp_${Date.now()}_${++sequence}`;
      const script = document.createElement('script');
      const timeoutMs = options.timeout || (
        action === 'surveyPdf'
          ? config.PDF_TIMEOUT
          : config.API_TIMEOUT
      );

      let settled = false;

      const cleanup = () => {
        window.clearTimeout(timer);
        script.remove();

        try {
          delete window[callback];
        } catch (error) {
          window[callback] = undefined;
        }
      };

      const finish = (handler, value) => {
        if (settled) return;
        settled = true;
        cleanup();
        handler(value);
      };

      window[callback] = response => {
        if (
          response &&
          response.success === false &&
          /sesi login|akun tidak aktif/i.test(String(response.message || ''))
        ) {
          clearSession();
          window.dispatchEvent(new CustomEvent('ftsp:auth-required'));
        }

        finish(resolve, response);
      };

      script.onerror = () => {
        finish(reject, new Error('Koneksi ke server gagal. Periksa internet lalu coba lagi.'));
      };

      const timer = window.setTimeout(() => {
        finish(reject, new Error('Server terlalu lama merespons. Silakan coba lagi.'));
      }, timeoutMs);

      const query = new URLSearchParams({
        action,
        sessionToken,
        callback,
        payload: JSON.stringify(payload || {}),
        _: String(Date.now())
      });

      script.src = `${config.API_URL}?${query.toString()}`;
      script.async = true;
      document.head.appendChild(script);
    });
  }

  function clearSession() {
    localStorage.removeItem(config.SESSION_STORAGE_KEY);
    localStorage.removeItem(config.USER_STORAGE_KEY);
  }

  function saveSession(response) {
    localStorage.setItem(config.SESSION_STORAGE_KEY, response.sessionToken);
    localStorage.setItem(config.USER_STORAGE_KEY, JSON.stringify(response.user || {}));
  }

  function login(username, password) {
    return request('login', { username, password })
      .then(response => {
        if (response && response.success === true && response.sessionToken) {
          saveSession(response);
        }

        return response;
      });
  }

  function registerAccount(payload) {
    return request('register', payload || {});
  }

  function logout() {
    clearSession();
    window.location.reload();
  }

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(config.USER_STORAGE_KEY) || 'null');
    } catch (error) {
      return null;
    }
  }

  function createRunner() {
    const state = {
      successHandler: null,
      failureHandler: null
    };

    let proxy;

    proxy = new Proxy({}, {
      get(target, property) {
        if (property === 'withSuccessHandler') {
          return handler => {
            state.successHandler = handler;
            return proxy;
          };
        }

        if (property === 'withFailureHandler') {
          return handler => {
            state.failureHandler = handler;
            return proxy;
          };
        }

        if (!methodMap[property]) {
          return undefined;
        }

        return (...args) => {
          const [action, payloadBuilder] = methodMap[property];
          const payload = payloadBuilder(args);

          request(action, payload)
            .then(response => {
              if (typeof state.successHandler === 'function') {
                state.successHandler(response);
              }
            })
            .catch(error => {
              if (typeof state.failureHandler === 'function') {
                state.failureHandler(error);
                return;
              }

              console.error(error);
            });
        };
      }
    });

    return proxy;
  }

  window.FTSPApi = Object.freeze({
    request,
    login,
    registerAccount,
    logout,
    clearSession,
    getCurrentUser,
    hasSession: () => Boolean(localStorage.getItem(config.SESSION_STORAGE_KEY)),
    validateSession: () => request('session')
  });

  window.google = window.google || {};

  Object.defineProperty(window.google, 'script', {
    configurable: true,
    value: {
      get run() {
        return createRunner();
      }
    }
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./service-worker.js?v=6')
        .catch(error => console.warn('Service worker gagal didaftarkan:', error));
    });
  }
})();
