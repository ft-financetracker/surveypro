(() => {
  'use strict';

  const state = {
    root: null,
    data: null,
    loading: false
  };

  function mount() {
    const page = document.querySelector('[data-page="users"]');
    const user = window.FTSPApi.getCurrentUser();

    if (!page || String(user?.role || '').toUpperCase() !== 'ADMIN') {
      window.FTSPApp?.navigate('dashboard');
      return;
    }

    if (!page.querySelector('[data-users-root]')) {
      page.innerHTML = buildLayout();
      state.root = page.querySelector('[data-users-root]');
      bindEvents();
    } else {
      state.root = page.querySelector('[data-users-root]');
    }

    if (!state.data) loadData();
  }

  function buildLayout() {
    return `
      <section class="ftsp-users" data-users-root>
        <div class="ftsp-users__hero">
          <div><span>ADMIN CONTROL</span><h2>Manajemen Akun</h2><p>Verifikasi pendaftar, tentukan role, dan kelola akses pengguna SurveyPro.</p></div>
          <button type="button" data-users-refresh><span class="material-symbols-rounded">refresh</span>Perbarui</button>
        </div>
        <div class="ftsp-users__stats">
          <article><span>Menunggu Verifikasi</span><strong data-pending-count>0</strong></article>
          <article><span>Pengguna Aktif</span><strong data-active-count>0</strong></article>
        </div>
        <section class="ftsp-users__panel">
          <header><div><span>PENDAFTARAN</span><h3>Permintaan Akun</h3></div></header>
          <div data-registration-list></div>
        </section>
        <section class="ftsp-users__panel">
          <header><div><span>PENGGUNA</span><h3>Akun Terdaftar</h3></div></header>
          <div data-user-list></div>
        </section>
      </section>
    `;
  }

  function bindEvents() {
    state.root.querySelector('[data-users-refresh]')
      ?.addEventListener('click', loadData);
    state.root.addEventListener('click', handleAction);
  }

  async function loadData() {
    if (state.loading) return;
    state.loading = true;
    state.root?.classList.add('is-loading');

    try {
      const response = await window.FTSPApi.request('accountManagement');
      if (!response || response.success !== true) {
        notify(response?.message || 'Data akun gagal dimuat.', 'error');
        return;
      }
      state.data = response.data || { registrations: [], users: [] };
      render();
    } catch (error) {
      notify(error?.message || 'Server tidak dapat dihubungi.', 'error');
    } finally {
      state.loading = false;
      state.root?.classList.remove('is-loading');
    }
  }

  function render() {
    const registrations = state.data?.registrations || [];
    const users = state.data?.users || [];
    const pending = registrations.filter(item => item.status === 'PENDING');

    setText('[data-pending-count]', pending.length);
    setText('[data-active-count]', users.filter(item => item.status === 'ACTIVE').length);

    const registrationList = state.root.querySelector('[data-registration-list]');
    registrationList.innerHTML = pending.length
      ? pending.map(renderRegistration).join('')
      : emptyState('Tidak ada pendaftaran yang menunggu verifikasi.');

    const userList = state.root.querySelector('[data-user-list]');
    userList.innerHTML = users.length
      ? users.map(renderUser).join('')
      : emptyState('Belum ada pengguna terdaftar.');
  }

  function renderRegistration(item) {
    return `
      <article class="ftsp-users__request">
        <div class="ftsp-users__avatar">${escapeHtml(String(item.name || '?').charAt(0).toUpperCase())}</div>
        <div class="ftsp-users__identity">
          <strong>${escapeHtml(item.name)}</strong>
          <span>@${escapeHtml(item.username)} • ${item.applicantType === 'INSTITUTION' ? 'Lembaga' : 'Perorangan'}</span>
          <small>${escapeHtml(item.phone || item.email || 'Kontak tidak dicantumkan')}</small>
        </div>
        <select data-registration-role="${escapeAttr(item.registrationId)}">
          <option value="VIEWER">Viewer</option>
          <option value="EDITOR">Editor</option>
        </select>
        <div class="ftsp-users__actions">
          <button class="is-approve" type="button" data-registration-decision="APPROVE" data-id="${escapeAttr(item.registrationId)}">Setujui</button>
          <button class="is-reject" type="button" data-registration-decision="REJECT" data-id="${escapeAttr(item.registrationId)}">Tolak</button>
        </div>
      </article>
    `;
  }

  function renderUser(item) {
    const nextStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return `
      <article class="ftsp-users__request">
        <div class="ftsp-users__avatar">${escapeHtml(String(item.name || '?').charAt(0).toUpperCase())}</div>
        <div class="ftsp-users__identity">
          <strong>${escapeHtml(item.name)}</strong>
          <span>@${escapeHtml(item.username)} • ${escapeHtml(item.status)}</span>
          <small>Login terakhir: ${formatDate(item.lastLogin)}</small>
        </div>
        <select data-user-role="${escapeAttr(item.userId)}">
          ${['VIEWER', 'EDITOR', 'ADMIN'].map(role => `<option value="${role}" ${role === item.role ? 'selected' : ''}>${role}</option>`).join('')}
        </select>
        <div class="ftsp-users__actions">
          <button type="button" data-user-update="${escapeAttr(item.userId)}" data-status="${escapeAttr(item.status)}">Simpan Role</button>
          <button class="${nextStatus === 'INACTIVE' ? 'is-reject' : 'is-approve'}" type="button" data-user-toggle="${escapeAttr(item.userId)}" data-role="${escapeAttr(item.role)}" data-next-status="${nextStatus}">${nextStatus === 'INACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}</button>
        </div>
      </article>
    `;
  }

  async function handleAction(event) {
    const decision = event.target.closest('[data-registration-decision]');
    const update = event.target.closest('[data-user-update]');
    const toggle = event.target.closest('[data-user-toggle]');

    if (decision) {
      const role = state.root.querySelector(`[data-registration-role="${CSS.escape(decision.dataset.id)}"]`)?.value || 'VIEWER';
      await runAction('registrationReview', {
        registrationId: decision.dataset.id,
        decision: decision.dataset.registrationDecision,
        role
      });
      return;
    }

    if (update) {
      const role = state.root.querySelector(`[data-user-role="${CSS.escape(update.dataset.userUpdate)}"]`)?.value;
      const item = state.data.users.find(user => user.userId === update.dataset.userUpdate);
      await runAction('userAccessUpdate', {
        userId: update.dataset.userUpdate,
        role,
        status: item?.status || 'ACTIVE'
      });
      return;
    }

    if (toggle) {
      await runAction('userAccessUpdate', {
        userId: toggle.dataset.userToggle,
        role: toggle.dataset.role,
        status: toggle.dataset.nextStatus
      });
    }
  }

  async function runAction(action, payload) {
    if (state.loading) return;
    state.loading = true;
    state.root.classList.add('is-loading');

    try {
      const response = await window.FTSPApi.request(action, payload);
      notify(response?.message || (response?.success ? 'Perubahan berhasil disimpan.' : 'Perubahan gagal.'), response?.success ? 'success' : 'error');
      if (response?.success) {
        state.data = null;
        state.loading = false;
        state.root.classList.remove('is-loading');
        await loadData();
        return;
      }
    } catch (error) {
      notify(error?.message || 'Server tidak dapat dihubungi.', 'error');
    } finally {
      state.loading = false;
      state.root.classList.remove('is-loading');
    }
  }

  function setText(selector, value) {
    const element = state.root?.querySelector(selector);
    if (element) element.textContent = String(value ?? 0);
  }

  function notify(message, type) {
    window.showToast?.(message, type);
  }

  function emptyState(message) {
    return `<div class="ftsp-users__empty"><span class="material-symbols-rounded">person_check</span>${escapeHtml(message)}</div>`;
  }

  function formatDate(value) {
    if (!value) return 'Belum pernah';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? '-'
      : new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  window.FTSPUsers = Object.freeze({ mount, refresh: loadData });
})();
