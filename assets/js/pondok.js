(() => {
  'use strict';

  const state = {
    root: null,
    records: [],
    formOptions: null,
    initialized: false,
    loading: false,
    saving: false,
    searchTimer: null
  };

  const LEVELS = [
    'PAUD',
    'TK',
    'SD',
    'MI',
    'SMP',
    'MTs',
    'SMA',
    'MA',
    'SMK',
    'Pesantren',
    'Perguruan Tinggi',
    'Lainnya'
  ];

  document.addEventListener(
    'DOMContentLoaded',
    initializePondokModule
  );

  window.addEventListener(
    'hashchange',
    mountPondokIfActive
  );

  function initializePondokModule() {
    bindGlobalEvents();

    window.FTSPPondok = {
      mount: mountPondokPage,
      refresh: loadPondokData,
      openForm: openCreateForm
    };

    mountPondokIfActive();
  }

  function mountPondokIfActive() {
    const route =
      window.location.hash
        .replace('#', '')
        .trim();

    if (route === 'pondok') {
      mountPondokPage();
    }
  }

  function mountPondokPage() {
    const target =
      findPondokPageTarget();

    if (!target) {
      return;
    }

    if (
      !target.querySelector(
        '[data-ftsp-pondok-root]'
      )
    ) {
      const template =
        document.getElementById(
          'FTSPPondokTemplate'
        );

      if (!template) {
        return;
      }

      target.innerHTML = '';
      target.appendChild(
        template.content.cloneNode(true)
      );
    }

    state.root =
      target.querySelector(
        '[data-ftsp-pondok-root]'
      );

    bindPageEvents();

    if (!state.initialized) {
      state.initialized = true;
      renderLevelOptions();
      loadFormOptions();
      loadPondokData();
    }
  }

  function findPondokPageTarget() {
    return (
      document.querySelector(
        '[data-page="pondok"]'
      ) ||
      document.querySelector(
        '[data-route="pondok"]'
      ) ||
      document.querySelector(
        '#pagePondok'
      ) ||
      document.querySelector(
        '#pondokPage'
      ) ||
      document.querySelector(
        '[data-ftsp-page="pondok"]'
      )
    );
  }

  function bindGlobalEvents() {
    const drawer =
      document.querySelector(
        '[data-ftsp-pondok-drawer]'
      );

    if (!drawer) {
      return;
    }

    drawer
      .querySelectorAll(
        '[data-ftsp-pondok-close]'
      )
      .forEach(button => {
        button.addEventListener(
          'click',
          closePondokDrawer
        );
      });

    const saveButton =
      drawer.querySelector(
        '[data-ftsp-pondok-save]'
      );

    if (saveButton) {
      saveButton.addEventListener(
        'click',
        savePondok
      );
    }

    document.addEventListener(
      'keydown',
      event => {
        if (
          event.key === 'Escape' &&
          !drawer.hidden
        ) {
          closePondokDrawer();
        }
      }
    );
  }

  function bindPageEvents() {
    if (
      !state.root ||
      state.root.dataset.bound ===
        'true'
    ) {
      return;
    }

    state.root.dataset.bound =
      'true';

    const addButton =
      state.root.querySelector(
        '[data-ftsp-pondok-add]'
      );

    const refreshButton =
      state.root.querySelector(
        '[data-ftsp-pondok-refresh]'
      );

    const searchInput =
      state.root.querySelector(
        '[data-ftsp-pondok-search]'
      );

    const filters =
      state.root.querySelectorAll(
        [
          '[data-ftsp-filter-province]',
          '[data-ftsp-filter-level]',
          '[data-ftsp-filter-status]'
        ].join(',')
      );

    addButton?.addEventListener(
      'click',
      openCreateForm
    );

    refreshButton?.addEventListener(
      'click',
      loadPondokData
    );

    searchInput?.addEventListener(
      'input',
      () => {
        window.clearTimeout(
          state.searchTimer
        );

        state.searchTimer =
          window.setTimeout(
            loadPondokData,
            220
          );
      }
    );

    filters.forEach(filter => {
      filter.addEventListener(
        'change',
        loadPondokData
      );
    });

    const body =
      state.root.querySelector(
        '[data-ftsp-pondok-body]'
      );

    body?.addEventListener(
      'click',
      handleTableAction
    );
  }

  function loadPondokData() {
    if (
      !state.root ||
      state.loading
    ) {
      return;
    }

    state.loading = true;
    setListLoading(true);

    const filters =
      getCurrentFilters();

    google.script.run
      .withSuccessHandler(
        response => {
          state.loading = false;
          setListLoading(false);

          if (
            !response ||
            !response.success
          ) {
            notify(
              'error',
              response?.message ||
                'Data pondok gagal dimuat.'
            );

            renderPondokList([]);
            return;
          }

          state.records =
            Array.isArray(response.data)
              ? response.data
              : [];

          renderPondokList(
            state.records
          );

          renderFilterOptions(
            response.filters || {}
          );

          loadPondokSummary();
        }
      )
      .withFailureHandler(
        error => {
          state.loading = false;
          setListLoading(false);
          renderPondokList([]);

          notify(
            'error',
            getErrorMessage(error)
          );
        }
      )
      .ftspGetPondokList(filters);
  }

  function loadPondokSummary() {
    google.script.run
      .withSuccessHandler(
        response => {
          if (
            response &&
            response.success
          ) {
            renderPondokSummary(
              response.data || {}
            );
          }
        }
      )
      .ftspGetPondokSummary();
  }

  function loadFormOptions() {
    google.script.run
      .withSuccessHandler(
        response => {
          if (
            response &&
            response.success
          ) {
            state.formOptions =
              response.data || null;
          }
        }
      )
      .ftspGetPondokFormOptions();
  }

  function getCurrentFilters() {
    return {
      search:
        getValue(
          '[data-ftsp-pondok-search]'
        ),

      provinsi:
        getValue(
          '[data-ftsp-filter-province]'
        ),

      jenjang:
        getValue(
          '[data-ftsp-filter-level]'
        ),

      status:
        getValue(
          '[data-ftsp-filter-status]'
        ),

      limit: 200,
      offset: 0
    };
  }

  function getValue(selector) {
    return (
      state.root
        ?.querySelector(selector)
        ?.value || ''
    ).trim();
  }

  function renderPondokSummary(data) {
    setText(
      '[data-ftsp-summary-total]',
      data.totalPondok || 0
    );

    setText(
      '[data-ftsp-summary-active]',
      data.activePondok || 0
    );

    setText(
      '[data-ftsp-summary-region]',
      data.totalWilayah || 0
    );

    setText(
      '[data-ftsp-summary-city]',
      data.totalKabupatenKota || 0
    );
  }

  function renderPondokList(records) {
    const body =
      state.root.querySelector(
        '[data-ftsp-pondok-body]'
      );

    const empty =
      state.root.querySelector(
        '[data-ftsp-pondok-empty]'
      );

    const table =
      state.root.querySelector(
        '[data-ftsp-pondok-table-wrap]'
      );

    const count =
      state.root.querySelector(
        '[data-ftsp-pondok-count]'
      );

    if (count) {
      count.textContent =
        `${records.length} data`;
    }

    if (!records.length) {
      body.innerHTML = '';
      empty.hidden = false;
      table.hidden = true;
      return;
    }

    empty.hidden = true;
    table.hidden = false;

    body.innerHTML =
      records
        .map(renderPondokRow)
        .join('');
  }

  function renderPondokRow(record) {
    const levels =
      Array.isArray(record.jenjang)
        ? record.jenjang
        : [];

    const levelHtml =
      levels.length
        ? levels
            .map(level => {
              return `
                <span class="ftsp-pondok__chip">
                  ${escapeHtml(level)}
                </span>
              `;
            })
            .join('')
        : '<span>-</span>';

    const statusClass =
      record.status === 'INACTIVE'
        ? 'ftsp-pondok__badge--inactive'
        : 'ftsp-pondok__badge--active';

    const statusIcon =
      record.status === 'INACTIVE'
        ? 'toggle_off'
        : 'toggle_on';

    const statusTitle =
      record.status === 'INACTIVE'
        ? 'Aktifkan pondok'
        : 'Nonaktifkan pondok';

    const mapsButton =
      record.mapsUrl
        ? `
          <button
            class="ftsp-pondok__icon-button"
            type="button"
            title="Buka Maps"
            data-action="maps"
            data-id="${escapeAttribute(
              record.pondokId
            )}"
          >
            <span class="material-symbols-rounded">
              map
            </span>
          </button>
        `
        : '';

    return `
      <tr>
        <td>
          <div class="ftsp-pondok__name">
            <div class="ftsp-pondok__avatar">
              <span class="material-symbols-rounded">
                domain
              </span>
            </div>

            <div>
              <span class="ftsp-pondok__name-main">
                ${escapeHtml(
                  record.namaPondok || '-'
                )}
              </span>

              <span class="ftsp-pondok__name-sub">
                ${escapeHtml(
                  record.namaSingkat ||
                    record.pondokId ||
                    '-'
                )}
              </span>
            </div>
          </div>
        </td>

        <td>
          <strong>
            ${escapeHtml(
              record.kabupatenKota || '-'
            )}
          </strong>

          <div class="ftsp-pondok__name-sub">
            ${escapeHtml(
              record.provinsi || '-'
            )}
          </div>
        </td>

        <td>
          <div class="ftsp-pondok__chips">
            ${levelHtml}
          </div>
        </td>

        <td>
          <span
            class="
              ftsp-pondok__badge
              ${statusClass}
            "
          >
            ${escapeHtml(
              record.statusLabel || '-'
            )}
          </span>
        </td>

        <td>
          ${escapeHtml(
            formatDateTime(record.updatedAt)
          )}
        </td>

        <td>
          <div class="ftsp-pondok__actions">
            ${mapsButton}

            <button
              class="ftsp-pondok__icon-button"
              type="button"
              title="Edit pondok"
              data-action="edit"
              data-id="${escapeAttribute(
                record.pondokId
              )}"
            >
              <span class="material-symbols-rounded">
                edit
              </span>
            </button>

            <button
              class="ftsp-pondok__icon-button"
              type="button"
              title="${statusTitle}"
              data-action="status"
              data-id="${escapeAttribute(
                record.pondokId
              )}"
            >
              <span class="material-symbols-rounded">
                ${statusIcon}
              </span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  function handleTableAction(event) {
    const button =
      event.target.closest(
        '[data-action]'
      );

    if (!button) {
      return;
    }

    const action =
      button.dataset.action;

    const pondokId =
      button.dataset.id;

    const record =
      state.records.find(item => {
        return item.pondokId ===
          pondokId;
      });

    if (!record) {
      return;
    }

    if (action === 'edit') {
      openEditForm(record);
      return;
    }

    if (action === 'maps') {
      openMaps(record);
      return;
    }

    if (action === 'status') {
      togglePondokStatus(record);
    }
  }

  function openCreateForm() {
    resetPondokForm();
    setDrawerTitle(
      'Tambah Pondok',
      'Simpan Pondok'
    );
    openPondokDrawer();
  }

  function openEditForm(record) {
    resetPondokForm();

    const form =
      getPondokForm();

    if (!form) {
      return;
    }

    form.elements.pondokId.value =
      record.pondokId || '';

    form.elements.namaPondok.value =
      record.namaPondok || '';

    form.elements.namaSingkat.value =
      record.namaSingkat || '';

    form.elements.wilayah.value =
      record.wilayah || '';

    form.elements.provinsi.value =
      record.provinsi || '';

    form.elements.kabupatenKota.value =
      record.kabupatenKota || '';

    form.elements.alamat.value =
      record.alamat || '';

    form.elements.mapsUrl.value =
      record.mapsUrl || '';

    form.elements.latitude.value =
      record.latitude ?? '';

    form.elements.longitude.value =
      record.longitude ?? '';

    form.elements.status.value =
      record.status || 'ACTIVE';

    const selectedLevels =
      new Set(
        Array.isArray(record.jenjang)
          ? record.jenjang
          : []
      );

    form
      .querySelectorAll(
        'input[name="jenjang"]'
      )
      .forEach(input => {
        input.checked =
          selectedLevels.has(
            input.value
          );
      });

    setDrawerTitle(
      'Edit Pondok',
      'Simpan Perubahan'
    );

    openPondokDrawer();
  }

  function savePondok() {
    if (state.saving) {
      return;
    }

    const form =
      getPondokForm();

    if (!form) {
      return;
    }

    clearFormErrors();

    const payload =
      collectPondokPayload(form);

    const localErrors =
      validateLocalPayload(payload);

    if (
      Object.keys(localErrors).length
    ) {
      renderFormErrors(
        localErrors
      );
      return;
    }

    state.saving = true;
    setSaveLoading(true);

    google.script.run
      .withSuccessHandler(
        response => {
          state.saving = false;
          setSaveLoading(false);

          if (
            !response ||
            !response.success
          ) {
            if (response?.errors) {
              renderFormErrors(
                response.errors
              );
            }

            notify(
              'error',
              response?.message ||
                'Data pondok gagal disimpan.'
            );

            return;
          }

          closePondokDrawer();

          notify(
            'success',
            response.message ||
              'Data pondok berhasil disimpan.'
          );

          loadPondokData();
          loadFormOptions();
        }
      )
      .withFailureHandler(
        error => {
          state.saving = false;
          setSaveLoading(false);

          notify(
            'error',
            getErrorMessage(error)
          );
        }
      )
      .ftspSavePondok(payload);
  }

  function collectPondokPayload(form) {
    const selectedLevels =
      Array.from(
        form.querySelectorAll(
          'input[name="jenjang"]:checked'
        )
      ).map(input => input.value);

    return {
      pondokId:
        form.elements.pondokId.value,

      namaPondok:
        form.elements.namaPondok.value,

      namaSingkat:
        form.elements.namaSingkat.value,

      wilayah:
        form.elements.wilayah.value,

      provinsi:
        form.elements.provinsi.value,

      kabupatenKota:
        form.elements.kabupatenKota.value,

      alamat:
        form.elements.alamat.value,

      jenjang:
        selectedLevels,

      mapsUrl:
        form.elements.mapsUrl.value,

      latitude:
        form.elements.latitude.value,

      longitude:
        form.elements.longitude.value,

      status:
        form.elements.status.value
    };
  }

  function validateLocalPayload(payload) {
    const errors = {};

    if (
      !payload.namaPondok.trim()
    ) {
      errors.nama_pondok =
        'Nama pondok wajib diisi.';
    }

    if (!payload.provinsi.trim()) {
      errors.provinsi =
        'Provinsi wajib diisi.';
    }

    if (
      !payload.kabupatenKota.trim()
    ) {
      errors.kabupaten_kota =
        'Kabupaten atau kota wajib diisi.';
    }

    if (!payload.jenjang.length) {
      errors.jenjang =
        'Pilih minimal satu jenjang.';
    }

    return errors;
  }

  function togglePondokStatus(record) {
    const newStatus =
      record.status === 'INACTIVE'
        ? 'ACTIVE'
        : 'INACTIVE';

    const confirmation =
      newStatus === 'ACTIVE'
        ? `Aktifkan kembali ${record.namaPondok}?`
        : `Nonaktifkan ${record.namaPondok}?`;

    if (!window.confirm(confirmation)) {
      return;
    }

    google.script.run
      .withSuccessHandler(
        response => {
          if (
            !response ||
            !response.success
          ) {
            notify(
              'error',
              response?.message ||
                'Status gagal diperbarui.'
            );
            return;
          }

          notify(
            'success',
            response.message
          );

          loadPondokData();
        }
      )
      .withFailureHandler(
        error => {
          notify(
            'error',
            getErrorMessage(error)
          );
        }
      )
      .ftspSetPondokStatus(
        record.pondokId,
        newStatus
      );
  }

  function openMaps(record) {
    if (!record.mapsUrl) {
      notify(
        'error',
        'Tautan Google Maps belum tersedia.'
      );
      return;
    }

    window.open(
      record.mapsUrl,
      '_blank',
      'noopener,noreferrer'
    );
  }

  function renderLevelOptions() {
    const container =
      document.querySelector(
        '[data-ftsp-pondok-levels]'
      );

    if (!container) {
      return;
    }

    container.innerHTML =
      LEVELS.map(level => {
        return `
          <label class="ftsp-pondok-form__check">
            <input
              type="checkbox"
              name="jenjang"
              value="${escapeAttribute(level)}"
            >
            <span>${escapeHtml(level)}</span>
          </label>
        `;
      }).join('');
  }

  function renderFilterOptions(options) {
    updateSelectOptions(
      '[data-ftsp-filter-province]',
      options.provinsi || [],
      'Semua provinsi'
    );

    updateSelectOptions(
      '[data-ftsp-filter-level]',
      options.jenjang || [],
      'Semua jenjang'
    );
  }

  function updateSelectOptions(
    selector,
    values,
    defaultLabel
  ) {
    const select =
      state.root.querySelector(
        selector
      );

    if (!select) {
      return;
    }

    const selectedValue =
      select.value;

    select.innerHTML = `
      <option value="">
        ${escapeHtml(defaultLabel)}
      </option>
      ${values
        .map(value => {
          return `
            <option value="${escapeAttribute(value)}">
              ${escapeHtml(value)}
            </option>
          `;
        })
        .join('')}
    `;

    if (
      values.includes(selectedValue)
    ) {
      select.value =
        selectedValue;
    }
  }

  function setListLoading(isLoading) {
    const loading =
      state.root?.querySelector(
        '[data-ftsp-pondok-loading]'
      );

    const empty =
      state.root?.querySelector(
        '[data-ftsp-pondok-empty]'
      );

    const table =
      state.root?.querySelector(
        '[data-ftsp-pondok-table-wrap]'
      );

    if (!loading) {
      return;
    }

    loading.hidden = !isLoading;

    if (isLoading) {
      empty.hidden = true;
      table.hidden = true;
    }
  }

  function openPondokDrawer() {
    const drawer =
      getPondokDrawer();

    if (!drawer) {
      return;
    }

    drawer.hidden = false;
    document.body.classList.add(
      'ftsp-pondok-drawer-open'
    );

    window.setTimeout(() => {
      getPondokForm()
        ?.elements.namaPondok
        ?.focus();
    }, 80);
  }

  function closePondokDrawer() {
    const drawer =
      getPondokDrawer();

    if (!drawer || state.saving) {
      return;
    }

    drawer.hidden = true;
    document.body.classList.remove(
      'ftsp-pondok-drawer-open'
    );

    resetPondokForm();
  }

  function resetPondokForm() {
    const form =
      getPondokForm();

    if (!form) {
      return;
    }

    form.reset();
    form.elements.pondokId.value = '';
    form.elements.status.value =
      'ACTIVE';

    clearFormErrors();
  }

  function clearFormErrors() {
    document
      .querySelectorAll(
        '[data-error-for]'
      )
      .forEach(element => {
        element.textContent = '';
      });
  }

  function renderFormErrors(errors) {
    Object.entries(errors).forEach(
      ([field, message]) => {
        const element =
          document.querySelector(
            `[data-error-for="${field}"]`
          );

        if (element) {
          element.textContent =
            message;
        }
      }
    );
  }

  function setDrawerTitle(
    title,
    buttonLabel
  ) {
    const titleElement =
      document.querySelector(
        '[data-ftsp-pondok-form-title]'
      );

    const labelElement =
      document.querySelector(
        '[data-ftsp-save-label]'
      );

    if (titleElement) {
      titleElement.textContent =
        title;
    }

    if (labelElement) {
      labelElement.textContent =
        buttonLabel;
    }
  }

  function setSaveLoading(isLoading) {
    const button =
      document.querySelector(
        '[data-ftsp-pondok-save]'
      );

    if (!button) {
      return;
    }

    button.disabled = isLoading;
    button.classList.toggle(
      'is-loading',
      isLoading
    );
  }

  function getPondokDrawer() {
    return document.querySelector(
      '[data-ftsp-pondok-drawer]'
    );
  }

  function getPondokForm() {
    return document.querySelector(
      '[data-ftsp-pondok-form]'
    );
  }

  function setText(
    selector,
    value
  ) {
    const element =
      state.root?.querySelector(
        selector
      );

    if (element) {
      element.textContent =
        String(value ?? '');
    }
  }

  function formatDateTime(value) {
    if (!value) {
      return '-';
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(date.getTime())
    ) {
      return '-';
    }

    return new Intl.DateTimeFormat(
      'id-ID',
      {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    ).format(date);
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  function getErrorMessage(error) {
    return (
      error?.message ||
      String(error || '') ||
      'Terjadi kesalahan sistem.'
    );
  }

  function notify(type, message) {
    if (
      typeof window.showToast ===
      'function'
    ) {
      window.showToast(
        message,
        type
      );
      return;
    }

    const existing =
      document.querySelector(
        '.ftsp-pondok-toast'
      );

    existing?.remove();

    const toast =
      document.createElement('div');

    toast.className =
      'ftsp-pondok-toast';

    toast.textContent =
      message;

    Object.assign(
      toast.style,
      {
        position: 'fixed',
        right: '18px',
        bottom: '18px',
        zIndex: '12000',
        maxWidth: '360px',
        padding: '13px 16px',
        borderRadius: '12px',
        color: '#ffffff',
        background:
          type === 'error'
            ? '#b91c1c'
            : '#0b132b',
        boxShadow:
          '0 16px 44px rgba(15,23,42,.24)',
        fontSize: '13px',
        fontWeight: '700'
      }
    );

    document.body.appendChild(
      toast
    );

    window.setTimeout(
      () => toast.remove(),
      3500
    );
  }
})();
