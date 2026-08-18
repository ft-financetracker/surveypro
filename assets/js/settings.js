  (() => {
    'use strict';

    const settingsState = {
      mounted: false,
      loading: false,
      original: null,
      branding: null
    };

    window.FTSPSettings = {
      mount:
        mountFTSPSettings,

      reload:
        loadFTSPSettings_
    };

    function mountFTSPSettings() {
      const page =
        document.querySelector(
          '[data-page="settings"]'
        );

      if (!page) {
        return;
      }

      if (
        !settingsState.mounted
      ) {
        page.innerHTML =
          buildFTSPSettingsLayout_();

        bindFTSPSettingsEvents_();

        settingsState.mounted =
          true;
      }

      loadFTSPSettings_();
    }

    function buildFTSPSettingsLayout_() {
      return `
        <section
          class="ftsp-settings"
          id="ftspSettingsRoot"
        >
          <div class="ftsp-settings-hero">
            <section class="ftsp-settings-intro">
              <div class="ftsp-settings-intro__content">
                <span class="ftsp-settings-intro__eyebrow">
                  System Configuration
                </span>

                <h2>
                  Atur perilaku aplikasi dari satu tempat.
                </h2>

                <p>
                  Pengaturan ini menjadi acuan default
                  untuk survey, Insight, validasi data,
                  dan identitas antarmuka FT-SURVEYPRO.
                </p>
              </div>
            </section>

            <aside class="ftsp-settings-preview">
              <div class="ftsp-settings-preview__brand">
                <span class="ftsp-settings-preview__mark">
                  FT
                </span>

                <div>
                  <strong id="settingsPreviewName">
                    SurveyPro
                  </strong>

                  <small id="settingsPreviewTagline">
                    Survey Once. Analyze Smarter.
                  </small>
                </div>
              </div>

              <div class="ftsp-settings-preview__meta">
                <div>
                  <span>
                    Versi
                  </span>

                  <strong id="settingsPreviewVersion">
                    -
                  </strong>
                </div>

                <div>
                  <span>
                    Status
                  </span>

                  <strong id="settingsPreviewStatus">
                    Development
                  </strong>
                </div>
              </div>
            </aside>
          </div>

          <form
            class="ftsp-settings-form"
            id="ftspSettingsForm"
          >
            <section class="ftsp-settings-section">
              <div class="ftsp-settings-section__head">
                <div>
                  <p>
                    Application
                  </p>

                  <h3>
                    Identitas Aplikasi
                  </h3>
                </div>

                <span class="material-symbols-rounded">
                  apps
                </span>
              </div>

              <div class="ftsp-settings-grid">
                <div class="ftsp-settings-field">
                  <label for="settingsAppDisplayName">
                    Nama Tampilan
                  </label>

                  <input
                    id="settingsAppDisplayName"
                    type="text"
                    maxlength="40"
                    required
                  >

                  <small>
                    Nama yang tampil pada sidebar dan branding aplikasi.
                  </small>
                </div>

                <div class="ftsp-settings-field">
                  <label for="settingsAppStatus">
                    Status Aplikasi
                  </label>

                  <select id="settingsAppStatus"></select>

                  <small>
                    Menandai tahap kesiapan operasional aplikasi.
                  </small>
                </div>

                <div class="ftsp-settings-field is-full">
                  <label for="settingsAppTagline">
                    Tagline
                  </label>

                  <textarea
                    id="settingsAppTagline"
                    maxlength="100"
                  ></textarea>

                  <small>
                    Maksimal 100 karakter.
                  </small>
                </div>
              </div>
            </section>

            <section class="ftsp-settings-section">
              <div class="ftsp-settings-section__head">
                <div>
                  <p>
                    Survey Defaults
                  </p>

                  <h3>
                    Nilai Awal Survey
                  </h3>
                </div>

                <span class="material-symbols-rounded">
                  tune
                </span>
              </div>

              <div class="ftsp-settings-grid">
                <div class="ftsp-settings-field">
                  <label for="settingsAcademicYear">
                    Tahun Ajaran Default
                  </label>

                  <input
                    id="settingsAcademicYear"
                    type="text"
                    inputmode="numeric"
                    placeholder="2026/2027"
                  >

                  <small>
                    Format YYYY/YYYY.
                  </small>
                </div>

                <div class="ftsp-settings-field">
                  <label for="settingsDefaultStatus">
                    Status Awal Survey
                  </label>

                  <select id="settingsDefaultStatus"></select>

                  <small>
                    Status otomatis ketika survey baru dibuat.
                  </small>
                </div>

                <div class="ftsp-settings-field">
                  <label for="settingsDefaultProvince">
                    Provinsi Default
                  </label>

                  <select id="settingsDefaultProvince">
                    <option value="">
                      Tidak ditentukan
                    </option>
                  </select>
                </div>

                <div class="ftsp-settings-field">
                  <label for="settingsDefaultRegion">
                    Wilayah Default
                  </label>

                  <select id="settingsDefaultRegion">
                    <option value="">
                      Tidak ditentukan
                    </option>
                  </select>
                </div>
              </div>
            </section>

            <section class="ftsp-settings-section">
              <div class="ftsp-settings-section__head">
                <div>
                  <p>
                    Rules
                  </p>

                  <h3>
                    Validasi dan Otomasi
                  </h3>
                </div>

                <span class="material-symbols-rounded">
                  rule_settings
                </span>
              </div>

              <div class="ftsp-settings-switch-list">
                ${buildFTSPSettingsSwitch_(
                  'settingsInsightVerifiedOnly',
                  'Insight hanya data terverifikasi',
                  'Saat aktif, filter Insight otomatis memprioritaskan survey berstatus terverifikasi.'
                )}

                ${buildFTSPSettingsSwitch_(
                  'settingsRequireInformant',
                  'Nama informan wajib',
                  'Survey tidak dapat disimpan tanpa nama informan.'
                )}

                ${buildFTSPSettingsSwitch_(
                  'settingsAutoActivityLog',
                  'Catat aktivitas otomatis',
                  'Perubahan penting aplikasi disimpan ke FTSP_ACTIVITY_LOG.'
                )}
              </div>
            </section>

            <div class="ftsp-settings-footer">
              <button
                class="ftsp-settings-secondary-btn"
                id="settingsResetButton"
                type="button"
              >
                <span class="material-symbols-rounded">
                  restart_alt
                </span>

                <span>
                  Batalkan
                </span>
              </button>

              <button
                class="ftsp-settings-save-btn"
                id="settingsSaveButton"
                type="submit"
              >
                <span class="material-symbols-rounded">
                  save
                </span>

                <span>
                  Simpan Pengaturan
                </span>
              </button>
            </div>
          </form>
        </section>
      `;
    }

    function buildFTSPSettingsSwitch_(
      id,
      title,
      description
    ) {
      return `
        <article class="ftsp-settings-switch">
          <div>
            <strong>
              ${escapeFTSPSettingsHtml_(title)}
            </strong>

            <span>
              ${escapeFTSPSettingsHtml_(description)}
            </span>
          </div>

          <label class="ftsp-settings-toggle">
            <input
              id="${escapeFTSPSettingsHtml_(id)}"
              type="checkbox"
            >

            <i></i>
          </label>
        </article>
      `;
    }

    function bindFTSPSettingsEvents_() {
      document
        .getElementById(
          'ftspSettingsForm'
        )
        ?.addEventListener(
          'submit',
          event => {
            event.preventDefault();
            saveFTSPSettings_();
          }
        );

      document
        .getElementById(
          'settingsResetButton'
        )
        ?.addEventListener(
          'click',
          resetFTSPSettings_
        );

      [
        'settingsAppDisplayName',
        'settingsAppTagline',
        'settingsAppStatus'
      ].forEach(id => {
        document
          .getElementById(id)
          ?.addEventListener(
            'input',
            renderFTSPSettingsPreview_
          );

        document
          .getElementById(id)
          ?.addEventListener(
            'change',
            renderFTSPSettingsPreview_
          );
      });
    }

    function loadFTSPSettings_() {
      if (
        settingsState.loading
      ) {
        return;
      }

      settingsState.loading =
        true;

      setFTSPSettingsLoading_(true);

      google.script.run
        .withSuccessHandler(
          response => {
            settingsState.loading =
              false;

            setFTSPSettingsLoading_(false);

            if (
              !response ||
              response.success !== true
            ) {
              showFTSPSettingsToast_(
                response?.message ||
                'Pengaturan gagal dimuat.',
                'error'
              );

              return;
            }

            settingsState.original =
              response.settings || {};

            settingsState.branding =
              response.branding || {};

            fillFTSPSettingsOptions_(
              response.options || {}
            );

            populateFTSPSettingsForm_(
              settingsState.original
            );

            renderFTSPSettingsPreview_();
          }
        )
        .withFailureHandler(
          error => {
            settingsState.loading =
              false;

            setFTSPSettingsLoading_(false);

            showFTSPSettingsToast_(
              error?.message ||
              'Pengaturan gagal dimuat.',
              'error'
            );
          }
        )
        .ftspGetSettingsData();
    }

    function fillFTSPSettingsOptions_(
      options
    ) {
      fillFTSPSettingsSelect_(
        'settingsAppStatus',
        options.appStatuses || [],
        ''
      );

      fillFTSPSettingsSelect_(
        'settingsDefaultStatus',
        options.surveyStatuses || [],
        ''
      );

      fillFTSPSettingsSelect_(
        'settingsDefaultProvince',
        (options.provinces || [])
          .map(value => ({
            value:
              value,

            label:
              value
          })),
        'Tidak ditentukan'
      );

      fillFTSPSettingsSelect_(
        'settingsDefaultRegion',
        (options.regions || [])
          .map(value => ({
            value:
              value,

            label:
              value
          })),
        'Tidak ditentukan'
      );
    }

    function fillFTSPSettingsSelect_(
      id,
      rows,
      placeholder
    ) {
      const select =
        document.getElementById(id);

      if (!select) {
        return;
      }

      const options = [];

      if (placeholder) {
        options.push(
          `<option value="">${escapeFTSPSettingsHtml_(placeholder)}</option>`
        );
      }

      rows.forEach(item => {
        options.push(`
          <option value="${escapeFTSPSettingsHtml_(item.value)}">
            ${escapeFTSPSettingsHtml_(item.label)}
          </option>
        `);
      });

      select.innerHTML =
        options.join('');
    }

    function populateFTSPSettingsForm_(
      settings
    ) {
      setFTSPSettingsValue_(
        'settingsAppDisplayName',
        settings.appDisplayName
      );

      setFTSPSettingsValue_(
        'settingsAppTagline',
        settings.appTagline
      );

      setFTSPSettingsValue_(
        'settingsAppStatus',
        settings.appStatus
      );

      setFTSPSettingsValue_(
        'settingsAcademicYear',
        settings.defaultAcademicYear
      );

      setFTSPSettingsValue_(
        'settingsDefaultProvince',
        settings.defaultProvince
      );

      setFTSPSettingsValue_(
        'settingsDefaultRegion',
        settings.defaultRegion
      );

      setFTSPSettingsValue_(
        'settingsDefaultStatus',
        settings.defaultSurveyStatus
      );

      setFTSPSettingsChecked_(
        'settingsInsightVerifiedOnly',
        settings.insightVerifiedOnly
      );

      setFTSPSettingsChecked_(
        'settingsRequireInformant',
        settings.requireInformant
      );

      setFTSPSettingsChecked_(
        'settingsAutoActivityLog',
        settings.autoActivityLog
      );
    }

    function saveFTSPSettings_() {
      if (
        settingsState.loading
      ) {
        return;
      }

      const payload =
        getFTSPSettingsPayload_();

      settingsState.loading =
        true;

      setFTSPSettingsLoading_(true);

      google.script.run
        .withSuccessHandler(
          response => {
            settingsState.loading =
              false;

            setFTSPSettingsLoading_(false);

            if (
              !response ||
              response.success !== true
            ) {
              showFTSPSettingsToast_(
                response?.message ||
                'Pengaturan gagal disimpan.',
                'error'
              );

              return;
            }

            settingsState.original =
              response.settings || payload;

            renderFTSPSettingsPreview_();

            showFTSPSettingsToast_(
              response.message ||
              'Pengaturan berhasil disimpan.',
              'success'
            );
          }
        )
        .withFailureHandler(
          error => {
            settingsState.loading =
              false;

            setFTSPSettingsLoading_(false);

            showFTSPSettingsToast_(
              error?.message ||
              'Pengaturan gagal disimpan.',
              'error'
            );
          }
        )
        .ftspSaveSettings(
          payload
        );
    }

    function resetFTSPSettings_() {
      if (
        !settingsState.original
      ) {
        return;
      }

      populateFTSPSettingsForm_(
        settingsState.original
      );

      renderFTSPSettingsPreview_();

      showFTSPSettingsToast_(
        'Perubahan dibatalkan.',
        'info'
      );
    }

    function getFTSPSettingsPayload_() {
      return {
        appDisplayName:
          getFTSPSettingsValue_(
            'settingsAppDisplayName'
          ),

        appTagline:
          getFTSPSettingsValue_(
            'settingsAppTagline'
          ),

        appStatus:
          getFTSPSettingsValue_(
            'settingsAppStatus'
          ),

        defaultAcademicYear:
          getFTSPSettingsValue_(
            'settingsAcademicYear'
          ),

        defaultProvince:
          getFTSPSettingsValue_(
            'settingsDefaultProvince'
          ),

        defaultRegion:
          getFTSPSettingsValue_(
            'settingsDefaultRegion'
          ),

        defaultSurveyStatus:
          getFTSPSettingsValue_(
            'settingsDefaultStatus'
          ),

        insightVerifiedOnly:
          getFTSPSettingsChecked_(
            'settingsInsightVerifiedOnly'
          ),

        requireInformant:
          getFTSPSettingsChecked_(
            'settingsRequireInformant'
          ),

        autoActivityLog:
          getFTSPSettingsChecked_(
            'settingsAutoActivityLog'
          )
      };
    }

    function renderFTSPSettingsPreview_() {
      const name =
        getFTSPSettingsValue_(
          'settingsAppDisplayName'
        ) ||
        'SurveyPro';

      const tagline =
        getFTSPSettingsValue_(
          'settingsAppTagline'
        ) ||
        'Survey Once. Analyze Smarter.';

      const status =
        getFTSPSettingsValue_(
          'settingsAppStatus'
        ) ||
        'DEVELOPMENT';

      setFTSPSettingsText_(
        'settingsPreviewName',
        name
      );

      setFTSPSettingsText_(
        'settingsPreviewTagline',
        tagline
      );

      setFTSPSettingsText_(
        'settingsPreviewVersion',
        settingsState.branding?.version ||
        '-'
      );

      setFTSPSettingsText_(
        'settingsPreviewStatus',
        formatFTSPSettingsStatus_(
          status
        )
      );
    }

    function setFTSPSettingsLoading_(
      loading
    ) {
      document
        .getElementById(
          'ftspSettingsRoot'
        )
        ?.classList.toggle(
          'ftsp-settings-loading',
          Boolean(loading)
        );

      document
        .getElementById(
          'settingsSaveButton'
        )
        ?.toggleAttribute(
          'disabled',
          Boolean(loading)
        );

      document
        .getElementById(
          'settingsResetButton'
        )
        ?.toggleAttribute(
          'disabled',
          Boolean(loading)
        );
    }

    function showFTSPSettingsToast_(
      message,
      type
    ) {
      const toast =
        document.getElementById(
          'toast'
        );

      const toastMessage =
        document.getElementById(
          'toastMessage'
        );

      const toastIcon =
        document.getElementById(
          'toastIcon'
        );

      if (
        !toast ||
        !toastMessage ||
        !toastIcon
      ) {
        return;
      }

      const icons = {
        success:
          'check_circle',

        error:
          'error',

        info:
          'info',

        warning:
          'warning'
      };

      toastIcon.textContent =
        icons[type] ||
        icons.info;

      toastMessage.textContent =
        String(message || '');

      toast.classList.add(
        'is-visible'
      );

      window.setTimeout(
        () => {
          toast.classList.remove(
            'is-visible'
          );
        },
        3200
      );
    }

    function setFTSPSettingsValue_(
      id,
      value
    ) {
      const element =
        document.getElementById(id);

      if (element) {
        element.value =
          value ?? '';
      }
    }

    function getFTSPSettingsValue_(
      id
    ) {
      return (
        document
          .getElementById(id)
          ?.value || ''
      ).trim();
    }

    function setFTSPSettingsChecked_(
      id,
      checked
    ) {
      const element =
        document.getElementById(id);

      if (element) {
        element.checked =
          Boolean(checked);
      }
    }

    function getFTSPSettingsChecked_(
      id
    ) {
      return Boolean(
        document
          .getElementById(id)
          ?.checked
      );
    }

    function setFTSPSettingsText_(
      id,
      value
    ) {
      const element =
        document.getElementById(id);

      if (element) {
        element.textContent =
          String(value ?? '');
      }
    }

    function formatFTSPSettingsStatus_(
      value
    ) {
      const labels = {
        DEVELOPMENT:
          'Development',

        BETA:
          'Beta',

        STABLE:
          'Stable',

        MAINTENANCE:
          'Maintenance'
      };

      return (
        labels[
          String(
            value || ''
          ).toUpperCase()
        ] ||
        String(
          value || ''
        )
      );
    }

    function escapeFTSPSettingsHtml_(
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

    window.setTimeout(
      () => {
        const route =
          window.location.hash
            .replace('#', '')
            .trim();

        if (route === 'settings') {
          mountFTSPSettings();
        }
      },
      0
    );
  })();
