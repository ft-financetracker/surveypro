  (() => {
    'use strict';

    const state = {
      route: 'dashboard',
      bootstrap: null,
      isLoading: false,
      toastTimer: null
    };

    const pageMeta = {
      dashboard: {
        eyebrow: 'Ringkasan',
        title: 'Dashboard'
      },

      survey: {
        eyebrow: 'Pengumpulan Data',
        title: 'Survey'
      },

      pondok: {
        eyebrow: 'Master Data',
        title: 'Data Pondok'
      },

      insight: {
        eyebrow: 'Analisis',
        title: 'Insight'
      },

      settings: {
        eyebrow: 'Konfigurasi',
        title: 'Pengaturan'
      }
    };

    const dom = {};

    document.addEventListener(
      'DOMContentLoaded',
      initFTSurveyPro
    );

    function initFTSurveyPro() {
      mapDom();
      bindEvents();
      loadApplication();
    }

    function mapDom() {
      dom.pageLoader =
        document.getElementById(
          'pageLoader'
        );

      dom.app =
        document.getElementById(
          'app'
        );

      dom.activityList =
        document.getElementById(
          'dashboardActivityList'
        );

      dom.activityEmpty =
        document.getElementById(
          'dashboardActivityEmpty'
        );

      dom.pageTitle =
        document.getElementById(
          'pageTitle'
        );

      dom.pageEyebrow =
        document.getElementById(
          'pageEyebrow'
        );

      dom.refreshButton =
        document.getElementById(
          'refreshButton'
        );

      dom.quickAddButton =
        document.getElementById(
          'quickAddButton'
        );

      dom.totalPondok =
        document.getElementById(
          'totalPondok'
        );

      dom.totalSurvey =
        document.getElementById(
          'totalSurvey'
        );

      dom.verifiedSurvey =
        document.getElementById(
          'verifiedSurvey'
        );

      dom.totalRegion =
        document.getElementById(
          'totalRegion'
        );

      dom.lastUpdate =
        document.getElementById(
          'lastUpdate'
        );

      dom.toast =
        document.getElementById(
          'toast'
        );

      dom.toastIcon =
        document.getElementById(
          'toastIcon'
        );

      dom.toastMessage =
        document.getElementById(
          'toastMessage'
        );
    }

    function bindEvents() {
      document
        .querySelectorAll(
          '[data-route]'
        )
        .forEach(button => {
          button.addEventListener(
            'click',
            () => {
              navigateTo(
                button.dataset.route
              );
            }
          );
        });

      document
        .querySelectorAll(
          '[data-route-target]'
        )
        .forEach(button => {
          button.addEventListener(
            'click',
            () => {
              navigateTo(
                button.dataset.routeTarget
              );
            }
          );
        });

      document
        .querySelectorAll(
          '[data-action="open-survey"]'
        )
        .forEach(button => {
          button.addEventListener(
            'click',
            () => {
              navigateTo('survey');
            }
          );
        });

      dom.quickAddButton
        ?.addEventListener(
          'click',
          () => {
            navigateTo('survey');
          }
        );

      dom.refreshButton
        ?.addEventListener(
          'click',
          () => {
            loadApplication({
              showSuccessToast: true
            });
          }
        );

      window.addEventListener(
        'hashchange',
        handleHashRoute
      );
    }

    function loadApplication(
      options = {}
    ) {
      if (state.isLoading) {
        return;
      }

      setLoading(true);

      google.script.run
        .withSuccessHandler(
          response => {
            handleBootstrapSuccess(
              response,
              options
            );
          }
        )
        .withFailureHandler(
          error => {
            handleBootstrapFailure(
              error
            );
          }
        )
        .ftspGetBootstrapData();
    }

    function handleBootstrapSuccess(
      response,
      options
    ) {
      setLoading(false);

      if (
        !response ||
        response.success !== true
      ) {
        const message =
          response?.message ||
          'Data aplikasi gagal dimuat.';

        showToast(
          message,
          'error'
        );

        revealApplication();
        return;
      }

      state.bootstrap = response;

      renderDashboard(
        response.summary || {},
        response.recentActivity || []
      );

      revealApplication();
      handleHashRoute();

      if (
        options.showSuccessToast
      ) {
        showToast(
          'Data berhasil diperbarui.',
          'success'
        );
      }
    }

    function handleBootstrapFailure(
      error
    ) {
      setLoading(false);
      revealApplication();

      const message =
        error &&
        error.message
          ? error.message
          : 'Terjadi kesalahan saat memuat aplikasi.';

      showToast(
        message,
        'error'
      );
    }

    function renderDashboard(
      summary,
      activities
    ) {
      setText(
        dom.totalPondok,
        formatInteger(
          summary.totalPondok
        )
      );

      setText(
        dom.totalSurvey,
        formatInteger(
          summary.totalSurvey
        )
      );

      setText(
        dom.verifiedSurvey,
        formatInteger(
          summary.verifiedSurvey
        )
      );

      setText(
        dom.totalRegion,
        formatInteger(
          summary.totalRegion
        )
      );

      setText(
        dom.lastUpdate,
        formatDateTime(
          summary.lastUpdate
        )
      );

      renderDashboardActivity(
        activities
      );
    }

    function renderDashboardActivity(
      activities
    ) {
      if (
        !dom.activityList ||
        !dom.activityEmpty
      ) {
        return;
      }

      const records =
        Array.isArray(activities)
          ? activities
          : [];

      if (!records.length) {
        dom.activityList.innerHTML =
          '';

        dom.activityList.hidden =
          true;

        dom.activityEmpty.hidden =
          false;

        return;
      }

      dom.activityEmpty.hidden =
        true;

      dom.activityList.hidden =
        false;

      dom.activityList.innerHTML =
        records
          .map(item => {
            return `
              <article class="ftsp-activity-item">
                <span class="ftsp-activity-item__icon">
                  <span
                    class="material-symbols-rounded"
                    aria-hidden="true"
                  >
                    ${escapeHtml(
                      item.icon ||
                      'history'
                    )}
                  </span>
                </span>

                <div class="ftsp-activity-item__content">
                  <strong>
                    ${escapeHtml(
                      item.title ||
                      'Aktivitas sistem'
                    )}
                  </strong>

                  <span>
                    ${escapeHtml(
                      item.description ||
                      ''
                    )}
                  </span>
                </div>

                <time>
                  ${escapeHtml(
                    formatActivityDate(
                      item.timestamp
                    )
                  )}
                </time>
              </article>
            `;
          })
          .join('');
    }

    function formatActivityDate(
  value
) {
  if (!value) {
    return '-';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'id-ID',
    {
      dateStyle:
        'medium',

      timeStyle:
        'short'
    }
  ).format(date);
}

function escapeHtml(
  value
) {
  return String(
    value ?? ''
  )
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
    )
    .replace(
      /'/g,
      '&#039;'
    );
}

    function navigateTo(route) {
      const target =
        pageMeta[route]
          ? route
          : 'dashboard';

      state.route = target;

      if (
        window.location.hash !==
        `#${target}`
      ) {
        window.location.hash =
          target;
      }

      renderRoute(target);
    }

    function handleHashRoute() {
      const route =
        window.location.hash
          .replace('#', '')
          .trim();

      navigateTo(
        pageMeta[route]
          ? route
          : 'dashboard'
      );
    }

    function renderRoute(route) {
      state.route = route;

      document
        .querySelectorAll(
          '.ftsp-page'
        )
        .forEach(page => {
          page.classList.toggle(
            'is-active',
            page.dataset.page ===
              route
          );
        });

      document
        .querySelectorAll(
          '[data-route]'
        )
        .forEach(button => {
          const isActive =
            button.dataset.route ===
            route;

          button.classList.toggle(
            'is-active',
            isActive
          );

          if (isActive) {
            button.setAttribute(
              'aria-current',
              'page'
            );
          } else {
            button.removeAttribute(
              'aria-current'
            );
          }
        });

      const meta =
        pageMeta[route] ||
        pageMeta.dashboard;

      setText(
        dom.pageTitle,
        meta.title
      );

      setText(
        dom.pageEyebrow,
        meta.eyebrow
      );

      if (
        route === 'survey' &&
        window.FTSPSurvey &&
        typeof window.FTSPSurvey.mount ===
          'function'
      ) {
        window.FTSPSurvey.mount();
      }

      if (
        route === 'insight' &&
        window.FTSPInsight &&
        typeof window.FTSPInsight.mount ===
          'function'
      ) {
        window.FTSPInsight.mount();
      }

      if (
        route === 'settings' &&
        window.FTSPSettings &&
        typeof window.FTSPSettings.mount ===
          'function'
      ) {
        window.FTSPSettings.mount();
      }

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }

    function setLoading(loading) {
      state.isLoading =
        Boolean(loading);

      dom.refreshButton
        ?.toggleAttribute(
          'disabled',
          state.isLoading
        );

      dom.refreshButton
        ?.classList.toggle(
          'is-loading',
          state.isLoading
        );
    }

    function revealApplication() {
      if (dom.app) {
        dom.app.hidden = false;
      }

      if (dom.pageLoader) {
        dom.pageLoader.hidden = true;
      }
    }

    function showToast(
      message,
      type = 'success'
    ) {
      if (
        !dom.toast ||
        !dom.toastMessage
      ) {
        return;
      }

      const icons = {
        success:
          'check_circle',

        error:
          'error',

        warning:
          'warning',

        info:
          'info'
      };

      dom.toastIcon.textContent =
        icons[type] || icons.info;

      dom.toastMessage.textContent =
        String(message || '');

      dom.toast.classList.add(
        'is-visible'
      );

      window.clearTimeout(
        state.toastTimer
      );

      state.toastTimer =
        window.setTimeout(
          () => {
            dom.toast.classList.remove(
              'is-visible'
            );
          },
          3200
        );
    }

    function setText(
      element,
      value
    ) {
      if (!element) {
        return;
      }

      element.textContent =
        value === undefined ||
        value === null ||
        value === ''
          ? '0'
          : String(value);
    }

    function formatInteger(value) {
      const number =
        Number(value || 0);

      return new Intl.NumberFormat(
        'id-ID',
        {
          maximumFractionDigits: 0
        }
      ).format(number);
    }

    function formatDateTime(value) {
      if (!value) {
        return 'Belum tersedia';
      }

      const date =
        new Date(value);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return 'Belum tersedia';
      }

      return new Intl.DateTimeFormat(
        'id-ID',
        {
          dateStyle: 'medium',
          timeStyle: 'short'
        }
      ).format(date);
    }

    window.showToast = showToast;

    window.FTSPApp = Object.freeze({
      refreshDashboard: () => {
        loadApplication();
      },

      navigate: route => {
        navigateTo(route);
      },

      toast: (message, type) => {
        showToast(message, type);
      },

      resetAccessToken: () => {
        window.FTSPApi?.resetAccessToken();
      }
    });
  })();
