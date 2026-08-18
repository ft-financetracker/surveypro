(() => {
  'use strict';

  const state = {
    root: null,
    records: [],
    options: null,
    initialized: false,
    loading: false,
    saving: false,
    exporting: false,
    searchTimer: null
  };

  document.addEventListener('DOMContentLoaded', initSurveyModule);
  window.addEventListener('hashchange', mountSurveyIfActive);

  function initSurveyModule() {
    bindGlobalEvents();

    window.FTSPSurvey = {
      mount: mountSurveyPage,
      refresh: loadSurveyData,
      openForm: openCreateForm
    };

    mountSurveyIfActive();
  }

  function mountSurveyIfActive() {
    const route = window.location.hash.replace('#', '').trim();

    if (route === 'survey') {
      mountSurveyPage();
    }
  }

  function mountSurveyPage() {
    const target = document.querySelector('[data-page="survey"]');

    if (!target) {
      return;
    }

    if (!target.querySelector('[data-ftsp-survey-root]')) {
      const template = document.getElementById('FTSPSurveyTemplate');

      if (!template) {
        return;
      }

      target.innerHTML = '';
      target.appendChild(template.content.cloneNode(true));
    }

    state.root = target.querySelector('[data-ftsp-survey-root]');
    bindPageEvents();

    if (!state.initialized) {
      state.initialized = true;
      loadFormOptions();
      loadSurveyData();
    }
  }

  function bindGlobalEvents() {
    document.querySelectorAll('[data-ftsp-survey-close]').forEach(button => {
      button.addEventListener('click', closeDrawer);
    });

    document
      .querySelector('[data-ftsp-survey-save]')
      ?.addEventListener('click', saveSurvey);

    document
      .querySelectorAll(
        '[data-ftsp-survey-export-close]'
      )
      .forEach(button => {
        button.addEventListener(
          'click',
          closeSurveyExportModal
        );
      });

    document
      .querySelector(
        '[data-ftsp-survey-export-confirm]'
      )
      ?.addEventListener(
        'click',
        exportSurveyPdf
      );

    document.addEventListener('keydown', event => {
      const drawer = getDrawer();

      if (
        event.key === 'Escape' &&
        drawer &&
        !drawer.hidden
      ) {
        closeDrawer();
      }
    });

    document.addEventListener('input', event => {
      if (
        event.target.matches(
          'input[name="biayaPsb"], input[name="sppBulanan"], input[name="biayaDaftarUlang"]'
        )
      ) {
        const number = parseMoney(event.target.value);
        event.target.value = formatMoneyInput(number);
      }
    });
  }

  function bindPageEvents() {
    if (!state.root || state.root.dataset.bound === 'true') {
      return;
    }

    state.root.dataset.bound = 'true';

    state.root
      .querySelector('[data-ftsp-survey-add]')
      ?.addEventListener('click', openCreateForm);

    state.root
      .querySelector('[data-ftsp-survey-refresh]')
      ?.addEventListener('click', loadSurveyData);

    state.root
      .querySelector('[data-ftsp-survey-export]')
      ?.addEventListener(
        'click',
        openSurveyExportModal
      );

    state.root
      .querySelector('[data-ftsp-survey-search]')
      ?.addEventListener('input', () => {
        clearTimeout(state.searchTimer);
        state.searchTimer = setTimeout(loadSurveyData, 220);
      });

    state.root
      .querySelectorAll(
        '[data-ftsp-survey-filter-pondok], [data-ftsp-survey-filter-year], [data-ftsp-survey-filter-status]'
      )
      .forEach(element => {
        element.addEventListener('change', loadSurveyData);
      });

    state.root
      .querySelector('[data-ftsp-survey-body]')
      ?.addEventListener('click', handleTableAction);
  }

  function loadFormOptions(openAfterLoad = false) {
    google.script.run
      .withSuccessHandler(response => {
        if (!response || !response.success) {
          notify('error', response?.message || 'Opsi survey gagal dimuat.');
          return;
        }

        state.options = response.data || {};
        renderFormOptions();

        if (openAfterLoad) {
          openCreateForm();
        }
      })
      .withFailureHandler(error => {
        notify('error', getErrorMessage(error));
      })
      .ftspGetSurveyFormOptions();
  }

  function loadSurveyData() {
    if (!state.root || state.loading) {
      return;
    }

    state.loading = true;
    setListLoading(true);

    google.script.run
      .withSuccessHandler(response => {
        state.loading = false;
        setListLoading(false);

        if (!response || !response.success) {
          renderSurveyList([]);
          notify('error', response?.message || 'Data survey gagal dimuat.');
          return;
        }

        state.records = Array.isArray(response.data) ? response.data : [];
        renderSurveyList(state.records);
        renderFilterOptions(response.filters || {});
        loadSurveySummary();
      })
      .withFailureHandler(error => {
        state.loading = false;
        setListLoading(false);
        renderSurveyList([]);
        notify('error', getErrorMessage(error));
      })
      .ftspGetSurveyList(getFilters());
  }

  function loadSurveySummary() {
    google.script.run
      .withSuccessHandler(response => {
        if (response && response.success) {
          renderSummary(response.data || {});
        }
      })
      .ftspGetSurveySummary();
  }

  function getFilters() {
    return {
      search: getValue('[data-ftsp-survey-search]'),
      pondokId: getValue('[data-ftsp-survey-filter-pondok]'),
      tahunAjaran: getValue('[data-ftsp-survey-filter-year]'),
      statusVerifikasi: getValue('[data-ftsp-survey-filter-status]'),
      limit: 300,
      offset: 0
    };
  }

  function getValue(selector) {
    return (state.root?.querySelector(selector)?.value || '').trim();
  }

  function renderSummary(data) {
    setRootText('[data-ftsp-survey-total]', data.totalSurvey || 0);
    setRootText('[data-ftsp-survey-verified]', data.verifiedSurvey || 0);
    setRootText('[data-ftsp-survey-average-psb]', formatCurrency(data.averagePsb || 0));
    setRootText('[data-ftsp-survey-average-spp]', formatCurrency(data.averageSpp || 0));
  }

  function renderSurveyList(records) {
    const body = state.root.querySelector('[data-ftsp-survey-body]');
    const empty = state.root.querySelector('[data-ftsp-survey-empty]');
    const table = state.root.querySelector('[data-ftsp-survey-table-wrap]');
    const count = state.root.querySelector('[data-ftsp-survey-count]');

    count.textContent = `${records.length} data`;

    if (!records.length) {
      body.innerHTML = '';
      empty.hidden = false;
      table.hidden = true;
      return;
    }

    empty.hidden = true;
    table.hidden = false;
    body.innerHTML = records.map(renderSurveyRow).join('');
  }

  function renderSurveyRow(record) {
    return `
      <tr>
        <td>
          <span class="ftsp-survey__name">${escapeHtml(record.namaPondok || '-')}</span>
          <span class="ftsp-survey__sub">${escapeHtml(record.wilayah || record.provinsi || '-')}</span>
        </td>
        <td>${escapeHtml(record.tahunAjaran || '-')}</td>
        <td class="ftsp-survey__money">${formatCurrency(record.biayaPsb)}</td>
        <td class="ftsp-survey__money">${formatCurrency(record.sppBulanan)}</td>
        <td class="ftsp-survey__money">${formatCurrency(record.biayaDaftarUlang)}</td>
        <td>
          <span class="ftsp-survey__badge ${getStatusClass(record.statusVerifikasi)}">
            ${escapeHtml(record.statusLabel || '-')}
          </span>
        </td>
        <td>${formatDate(record.tanggalData)}</td>
        <td>
          <div class="ftsp-survey__actions">
            <button
              class="ftsp-survey__icon-button"
              type="button"
              title="Edit survey"
              data-survey-action="edit"
              data-id="${escapeAttribute(record.surveyId)}"
            >
              <span class="material-symbols-rounded">edit</span>
            </button>

            <button
              class="ftsp-survey__icon-button"
              type="button"
              title="Ubah status"
              data-survey-action="status"
              data-id="${escapeAttribute(record.surveyId)}"
            >
              <span class="material-symbols-rounded">verified</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  function handleTableAction(event) {
    const button = event.target.closest('[data-survey-action]');

    if (!button) {
      return;
    }

    const record = state.records.find(item => item.surveyId === button.dataset.id);

    if (!record) {
      return;
    }

    if (button.dataset.surveyAction === 'edit') {
      openEditForm(record);
      return;
    }

    if (button.dataset.surveyAction === 'status') {
      changeStatus(record);
    }
  }

  function openCreateForm() {
    if (!state.options) {
      loadFormOptions(true);
      return;
    }

    if (!state.options.pondok?.length) {
      notify('warning', 'Tambahkan pondok aktif terlebih dahulu.');
      return;
    }

    resetForm();
    setFormTitle('Survey Baru', 'Simpan Survey');

    const form = getForm();
    form.elements.tanggalData.value = todayInputValue();

    openDrawer();
  }

  function openEditForm(record) {
    resetForm();
    setFormTitle('Edit Survey', 'Simpan Perubahan');

    const form = getForm();

    form.elements.surveyId.value = record.surveyId || '';
    form.elements.pondokId.value = record.pondokId || '';
    form.elements.tahunAjaran.value = record.tahunAjaran || '';
    form.elements.biayaPsb.value = formatMoneyInput(record.biayaPsb || 0);
    form.elements.sppBulanan.value = formatMoneyInput(record.sppBulanan || 0);
    form.elements.biayaDaftarUlang.value = formatMoneyInput(record.biayaDaftarUlang || 0);
    form.elements.sumberData.value = record.sumberData || '';
    form.elements.namaInforman.value = record.namaInforman || '';
    form.elements.tanggalData.value = toInputDate(record.tanggalData);
    form.elements.statusVerifikasi.value = record.statusVerifikasi || 'DRAFT';
    form.elements.catatan.value = record.catatan || '';

    openDrawer();
  }

  function saveSurvey() {
    if (state.saving) {
      return;
    }

    const form = getForm();
    clearErrors();

    const payload = {
      surveyId: form.elements.surveyId.value,
      pondokId: form.elements.pondokId.value,
      tahunAjaran: form.elements.tahunAjaran.value,
      biayaPsb: parseMoney(form.elements.biayaPsb.value),
      sppBulanan: parseMoney(form.elements.sppBulanan.value),
      biayaDaftarUlang: parseMoney(form.elements.biayaDaftarUlang.value),
      sumberData: form.elements.sumberData.value,
      namaInforman: form.elements.namaInforman.value,
      tanggalData: form.elements.tanggalData.value,
      statusVerifikasi: form.elements.statusVerifikasi.value,
      catatan: form.elements.catatan.value
    };

    const errors = validatePayload(payload);

    if (Object.keys(errors).length) {
      renderErrors(errors);
      return;
    }

    state.saving = true;
    setSaveLoading(true);

    google.script.run
      .withSuccessHandler(response => {
        state.saving = false;
        setSaveLoading(false);

        if (!response || !response.success) {
          if (response?.errors) {
            renderErrors(response.errors);
          }

          notify('error', response?.message || 'Survey gagal disimpan.');
          return;
        }

        closeDrawer();
        notify('success', response.message || 'Survey berhasil disimpan.');
        loadSurveyData();

        if (window.FTSPApp?.refreshDashboard) {
          window.FTSPApp.refreshDashboard();
        }
      })
      .withFailureHandler(error => {
        state.saving = false;
        setSaveLoading(false);
        notify('error', getErrorMessage(error));
      })
      .ftspSaveSurvey(payload);
  }

  function validatePayload(payload) {
    const errors = {};

    if (!payload.pondokId) {
      errors.pondok_id = 'Pondok wajib dipilih.';
    }

    if (!/^\d{4}\/\d{4}$/.test(payload.tahunAjaran.trim())) {
      errors.tahun_ajaran = 'Gunakan format tahun ajaran 2026/2027.';
    }

    if (!payload.sumberData) {
      errors.sumber_data = 'Sumber data wajib dipilih.';
    }

    if (!payload.tanggalData) {
      errors.tanggal_data = 'Tanggal data wajib diisi.';
    }

    return errors;
  }

  function openSurveyExportModal() {
    const modal =
      document.querySelector(
        '[data-ftsp-survey-export-modal]'
      );

    if (!modal) {
      return;
    }

    modal.hidden = false;

    document.body.classList.add(
      'ftsp-survey-export-open'
    );
  }

  function closeSurveyExportModal() {
    if (state.exporting) {
      return;
    }

    const modal =
      document.querySelector(
        '[data-ftsp-survey-export-modal]'
      );

    if (modal) {
      modal.hidden = true;
    }

    document.body.classList.remove(
      'ftsp-survey-export-open'
    );
  }

  function getSurveyExportOptions() {
    return {
      latestAcademicYearOnly:
        Boolean(
          document
            .querySelector(
              '[data-ftsp-survey-export-latest-year]'
            )
            ?.checked
        ),

      sortBy:
        document
          .querySelector(
            '[data-ftsp-survey-export-sort]'
          )
          ?.value ||
        'PSB_DESC'
    };
  }

  function exportSurveyPdf() {
    if (
      state.exporting ||
      !state.root
    ) {
      return;
    }

    const button =
      document.querySelector(
        '[data-ftsp-survey-export-confirm]'
      );

    const label =
      state.root.querySelector(
        '[data-ftsp-survey-export-label]'
      );

    state.exporting = true;

    if (button) {
      button.disabled = true;
      button.classList.add(
        'is-loading'
      );
    }

    if (label) {
      label.textContent =
        'Membuat PDF...';
    }

    google.script.run
      .withSuccessHandler(response => {
        state.exporting = false;

        if (button) {
          button.disabled = false;
          button.classList.remove(
            'is-loading'
          );
        }

        if (label) {
          label.textContent =
            'Export PDF';
        }

        if (
          !response ||
          response.success !== true
        ) {
          notify(
            'error',
            response?.message ||
            'PDF gagal dibuat.'
          );
          return;
        }

        closeSurveyExportModal();

        downloadSurveyPdf(
          response.base64,
          response.mimeType,
          response.fileName
        );

        notify(
          'success',
          `${response.totalRecords || 0} data berhasil diekspor.`
        );
      })
      .withFailureHandler(error => {
        state.exporting = false;

        if (button) {
          button.disabled = false;
          button.classList.remove(
            'is-loading'
          );
        }

        if (label) {
          label.textContent =
            'Export PDF';
        }

        notify(
          'error',
          getErrorMessage(error)
        );
      })
      .ftspExportSurveyPdf({
        ...getFilters(),

        exportOptions:
          getSurveyExportOptions()
      });
  }

  function downloadSurveyPdf(
    base64,
    mimeType,
    fileName
  ) {
    const binary =
      window.atob(
        String(base64 || '')
      );

    const bytes =
      new Uint8Array(
        binary.length
      );

    for (
      let index = 0;
      index < binary.length;
      index++
    ) {
      bytes[index] =
        binary.charCodeAt(index);
    }

    const blob =
      new Blob(
        [bytes],
        {
          type:
            mimeType ||
            'application/pdf'
        }
      );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement('a');

    anchor.href = url;
    anchor.download =
      fileName ||
      'FT-SURVEYPRO.pdf';

    anchor.style.display =
      'none';

    document.body.appendChild(
      anchor
    );

    anchor.click();
    anchor.remove();

    window.setTimeout(
      () => {
        URL.revokeObjectURL(url);
      },
      2000
    );
  }

  function changeStatus(record) {
    const options = [
      ['DRAFT', 'Draft'],
      ['REVIEW', 'Perlu Review'],
      ['VERIFIED', 'Terverifikasi'],
      ['REJECTED', 'Ditolak']
    ];

    const promptText = options
      .map((item, index) => `${index + 1}. ${item[1]}`)
      .join('\n');

    const selected = window.prompt(
      `Pilih status:\n${promptText}`,
      String(
        Math.max(
          options.findIndex(item => item[0] === record.statusVerifikasi) + 1,
          1
        )
      )
    );

    if (selected === null) {
      return;
    }

    const option = options[Number(selected) - 1];

    if (!option) {
      notify('warning', 'Pilihan status tidak valid.');
      return;
    }

    google.script.run
      .withSuccessHandler(response => {
        if (!response || !response.success) {
          notify('error', response?.message || 'Status gagal diperbarui.');
          return;
        }

        notify('success', response.message);
        loadSurveyData();

        if (window.FTSPApp?.refreshDashboard) {
          window.FTSPApp.refreshDashboard();
        }
      })
      .withFailureHandler(error => notify('error', getErrorMessage(error)))
      .ftspSetSurveyVerificationStatus(record.surveyId, option[0]);
  }

  function renderFormOptions() {
    const form = getForm();

    if (!form || !state.options) {
      return;
    }

    form.elements.pondokId.innerHTML = `
      <option value="">Pilih pondok</option>
      ${(state.options.pondok || []).map(item => `
        <option value="${escapeAttribute(item.pondokId)}">
          ${escapeHtml(item.namaPondok)}
        </option>
      `).join('')}
    `;

    form.elements.sumberData.innerHTML = `
      <option value="">Pilih sumber data</option>
      ${(state.options.sumberData || []).map(item => `
        <option value="${escapeAttribute(item)}">${escapeHtml(item)}</option>
      `).join('')}
    `;

    document.getElementById('ftspSurveyAcademicYears').innerHTML =
      (state.options.tahunAjaran || []).map(item => `
        <option value="${escapeAttribute(item)}"></option>
      `).join('');
  }

  function renderFilterOptions(options) {
    updateSelect(
      '[data-ftsp-survey-filter-pondok]',
      options.pondok || [],
      'Semua pondok',
      item => item.pondokId,
      item => item.namaPondok
    );

    updateSelect(
      '[data-ftsp-survey-filter-year]',
      options.tahunAjaran || [],
      'Semua tahun ajaran',
      item => item,
      item => item
    );
  }

  function updateSelect(selector, values, defaultLabel, valueGetter, labelGetter) {
    const select = state.root.querySelector(selector);
    const current = select.value;

    select.innerHTML = `
      <option value="">${escapeHtml(defaultLabel)}</option>
      ${values.map(item => `
        <option value="${escapeAttribute(valueGetter(item))}">
          ${escapeHtml(labelGetter(item))}
        </option>
      `).join('')}
    `;

    if (values.some(item => String(valueGetter(item)) === current)) {
      select.value = current;
    }
  }

  function setListLoading(loading) {
    const loadingElement = state.root?.querySelector('[data-ftsp-survey-loading]');
    const empty = state.root?.querySelector('[data-ftsp-survey-empty]');
    const table = state.root?.querySelector('[data-ftsp-survey-table-wrap]');

    if (!loadingElement) {
      return;
    }

    loadingElement.hidden = !loading;

    if (loading) {
      empty.hidden = true;
      table.hidden = true;
    }
  }

  function openDrawer() {
    const drawer = getDrawer();
    drawer.hidden = false;
    document.body.classList.add('ftsp-survey-drawer-open');

    setTimeout(() => {
      getForm()?.elements.pondokId?.focus();
    }, 60);
  }

  function closeDrawer() {
    if (state.saving) {
      return;
    }

    const drawer = getDrawer();

    if (!drawer) {
      return;
    }

    drawer.hidden = true;
    document.body.classList.remove('ftsp-survey-drawer-open');
    resetForm();
  }

  function resetForm() {
    const form = getForm();

    if (!form) {
      return;
    }

    form.reset();
    form.elements.surveyId.value = '';
    form.elements.statusVerifikasi.value = 'DRAFT';
    form.elements.biayaPsb.value = '0';
    form.elements.sppBulanan.value = '0';
    form.elements.biayaDaftarUlang.value = '0';
    clearErrors();
  }

  function clearErrors() {
    document.querySelectorAll('[data-survey-error-for]').forEach(element => {
      element.textContent = '';
    });
  }

  function renderErrors(errors) {
    Object.entries(errors).forEach(([field, message]) => {
      const element = document.querySelector(`[data-survey-error-for="${field}"]`);

      if (element) {
        element.textContent = message;
      }
    });
  }

  function setFormTitle(title, label) {
    document.querySelector('[data-ftsp-survey-form-title]').textContent = title;
    document.querySelector('[data-ftsp-survey-save-label]').textContent = label;
  }

  function setSaveLoading(loading) {
    const button = document.querySelector('[data-ftsp-survey-save]');
    button.disabled = loading;
    button.classList.toggle('is-loading', loading);
  }

  function getDrawer() {
    return document.querySelector('[data-ftsp-survey-drawer]');
  }

  function getForm() {
    return document.querySelector('[data-ftsp-survey-form]');
  }

  function setRootText(selector, value) {
    const element = state.root?.querySelector(selector);

    if (element) {
      element.textContent = String(value ?? '');
    }
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  function parseMoney(value) {
    const cleaned = String(value || '').replace(/[^\d-]/g, '');
    return cleaned ? Number(cleaned) : 0;
  }

  function formatMoneyInput(value) {
    return new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  function formatDate(value) {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium'
    }).format(date);
  }

  function toInputDate(value) {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  function todayInputValue() {
    return toInputDate(new Date());
  }

  function getStatusClass(status) {
    const map = {
      DRAFT: 'ftsp-survey__badge--draft',
      REVIEW: 'ftsp-survey__badge--review',
      VERIFIED: 'ftsp-survey__badge--verified',
      REJECTED: 'ftsp-survey__badge--rejected'
    };

    return map[status] || map.DRAFT;
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
    return error?.message || String(error || '') || 'Terjadi kesalahan sistem.';
  }

  function notify(type, message) {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
      return;
    }

    window.alert(message);
  }
})();
