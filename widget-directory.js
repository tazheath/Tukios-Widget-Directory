/**
 * Tukios Internal Widget Directory
 * ---------------------------------
 * Self-mounting embed. Drop this on any page along with:
 *
 *   <div id="tukios-widget-directory"></div>
 *   <script src="[hosted URL]/widget-directory.js"></script>
 *
 * The script resolves its own hosted location (document.currentScript)
 * and fetches widget-data.json + thumbnail_imgs/ relative to THAT —
 * not relative to the page it's embedded on. That's what makes a single
 * <script> tag enough, no matter which site it's dropped into.
 *
 * Don't add `async` to the script tag — it breaks the self-location
 * lookup below, since it must run synchronously as the script parses.
 * `defer`, or no attribute at all, is fine.
 */
(function () {
  'use strict';

  // --- Resolve this script's own base URL --------------------------------
  var SCRIPT_EL = document.currentScript;
  var BASE_URL = SCRIPT_EL
    ? SCRIPT_EL.src.substring(0, SCRIPT_EL.src.lastIndexOf('/') + 1)
    : '';

  var CATEGORIES = [
    { value: 'template', label: 'Template', color: '#047857', bg: '#ECFDF5', border: '#D1FAE5' },
    { value: 'popular', label: 'Popular', color: '#1D4ED8', bg: '#EFF6FF', border: '#DBEAFE' },
    { value: 'additional', label: 'Additional', color: '#6D28D9', bg: '#F5F3FF', border: '#EDE9FE' },
    { value: 'firm-only', label: 'Firm Only', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' }
  ];

  var ICON_LIST = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>';
  var ICON_GRID = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect></svg>';

  var state = {
    allData: [],
    filteredData: [],
    activeCategory: 'all',
    activeView: 'list',
    searchTerm: '',
    lastFocused: null
  };

  var els = {};

  // --- Helpers -------------------------------------------------------------

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getCategoryMeta(value) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].value === value) return CATEGORIES[i];
    }
    return null;
  }

  function categoryBadgeHTML(value) {
    var meta = getCategoryMeta(value);
    if (!meta) return '';
    return '<span class="twd-badge" style="color:' + meta.color + ';background:' + meta.bg + ';border-color:' + meta.border + ';">' +
      escapeHtml(meta.label) + '</span>';
  }

  function thumbHTML(row) {
    if (row.thumbnail) {
      return '<img class="twd-thumb-img" data-thumb-img src="' +
        escapeHtml(BASE_URL + 'thumbnail_imgs/' + row.thumbnail) +
        '" alt="' + escapeHtml(row.name) + ' preview">';
    }
    return '<div class="twd-thumb-placeholder">No Image</div>';
  }

  function demoLinkHTML(row, extraClass) {
    if (!row.demoLink) return '';
    return '<a class="twd-demo-link ' + (extraClass || '') + '" href="' +
      escapeHtml(row.demoLink) + '" target="_blank" rel="noopener noreferrer">View Demo &#8599;</a>';
  }

  function modalField(label, value) {
    if (!value) return '';
    return '<dt>' + escapeHtml(label) + '</dt><dd>' + escapeHtml(value) + '</dd>';
  }

  function bindThumbErrors(scope) {
    var imgs = scope.querySelectorAll('[data-thumb-img]');
    imgs.forEach(function (img) {
      img.addEventListener('error', function onErr() {
        img.removeEventListener('error', onErr);
        var placeholder = document.createElement('div');
        placeholder.className = 'twd-thumb-placeholder';
        placeholder.textContent = 'No Image';
        img.replaceWith(placeholder);
      });
    });
  }

  function findRow(id) {
    for (var i = 0; i < state.allData.length; i++) {
      if (String(state.allData[i].id) === String(id)) return state.allData[i];
    }
    return null;
  }

  // --- Filtering -------------------------------------------------------------

  function applyFilters() {
    var term = state.searchTerm.trim().toLowerCase();
    state.filteredData = state.allData.filter(function (row) {
      if (state.activeCategory !== 'all' && row.category !== state.activeCategory) return false;
      if (!term) return true;
      var haystack = [row.name, row.description, row.useCase, row.limitations, row.notes].join(' ').toLowerCase();
      return haystack.indexOf(term) !== -1;
    });
  }

  // --- Rendering -------------------------------------------------------------

  function renderCount() {
    var total = state.allData.length;
    var shown = state.filteredData.length;
    els.count.textContent = shown === total
      ? shown + ' widget' + (shown !== 1 ? 's' : '')
      : shown + ' of ' + total + ' widgets';
  }

  function renderEmptyOrList() {
    if (state.filteredData.length === 0) {
      els.list.innerHTML = '';
      els.grid.innerHTML = '';
      els.empty.style.display = 'block';
      els.empty.innerHTML = '<h3>No widgets found</h3><p>Try a different search term or category.</p>';
      return;
    }
    els.empty.style.display = 'none';
    if (state.activeView === 'list') renderList(); else renderGrid();
  }

  function renderList() {
    els.list.innerHTML = state.filteredData.map(function (row) {
      return (
        '<div class="twd-list-row" data-id="' + escapeHtml(row.id) + '" tabindex="0" role="button" aria-haspopup="dialog">' +
          '<div class="twd-list-thumb">' + thumbHTML(row) + '</div>' +
          '<div class="twd-list-main">' +
            '<div class="twd-list-top">' +
              '<span class="twd-list-name">' + escapeHtml(row.name) + '</span>' +
              categoryBadgeHTML(row.category) +
            '</div>' +
            '<div class="twd-list-desc">' + escapeHtml(row.description || 'No description yet.') + '</div>' +
          '</div>' +
          demoLinkHTML(row, 'twd-list-demo') +
        '</div>'
      );
    }).join('');
    bindThumbErrors(els.list);
  }

  function renderGrid() {
    els.grid.innerHTML = state.filteredData.map(function (row) {
      return (
        '<div class="twd-card" data-id="' + escapeHtml(row.id) + '" tabindex="0" role="button" aria-haspopup="dialog">' +
          '<div class="twd-card-thumb">' + thumbHTML(row) + '</div>' +
          '<div class="twd-card-body">' +
            '<div class="twd-card-top">' +
              '<span class="twd-card-name">' + escapeHtml(row.name) + '</span>' +
              categoryBadgeHTML(row.category) +
            '</div>' +
            '<div class="twd-card-desc">' + escapeHtml(row.description || 'No description yet.') + '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
    bindThumbErrors(els.grid);
  }

  // --- Detail modal ------------------------------------------------------------

  function openModal(row) {
    els.modalBody.innerHTML =
      '<div class="twd-modal-thumb">' + thumbHTML(row) + '</div>' +
      '<h2 id="twd-modal-title">' + escapeHtml(row.name) + '</h2>' +
      categoryBadgeHTML(row.category) +
      '<dl class="twd-modal-fields">' +
        modalField('Description', row.description) +
        modalField('Primary Use Case', row.useCase) +
        modalField('Known Limitations', row.limitations) +
        modalField('Notes', row.notes) +
      '</dl>' +
      demoLinkHTML(row, 'twd-modal-demo');
    bindThumbErrors(els.modalBody);
    state.lastFocused = document.activeElement;
    els.modal.style.display = 'flex';
    els.modal.setAttribute('aria-hidden', 'false');
    els.modalClose.focus();
  }

  function closeModal() {
    els.modal.style.display = 'none';
    els.modal.setAttribute('aria-hidden', 'true');
    if (state.lastFocused && typeof state.lastFocused.focus === 'function') state.lastFocused.focus();
  }

  // --- Shell markup --------------------------------------------------------------

  function shellHTML() {
    var categoryButtons = CATEGORIES.map(function (c) {
      return '<button type="button" class="twd-cat-btn" data-category="' + c.value + '">' + escapeHtml(c.label) + '</button>';
    }).join('');

    return (
      '<div class="twd-toolbar">' +
        '<div class="twd-toolbar-left">' +
          '<div class="twd-view-toggle">' +
            '<button type="button" class="twd-view-btn active" data-view="list" title="List view">' + ICON_LIST + '</button>' +
            '<button type="button" class="twd-view-btn" data-view="grid" title="Grid view">' + ICON_GRID + '</button>' +
          '</div>' +
          '<input type="text" class="twd-search" placeholder="Search widgets..." aria-label="Search widgets">' +
        '</div>' +
        '<div class="twd-toolbar-right">' +
          '<div class="twd-category-filter">' +
            '<button type="button" class="twd-cat-btn active" data-category="all">All</button>' +
            categoryButtons +
          '</div>' +
          '<span class="twd-count"></span>' +
        '</div>' +
      '</div>' +
      '<div class="twd-list-view active" data-view-content="list"></div>' +
      '<div class="twd-grid-view" data-view-content="grid"></div>' +
      '<div class="twd-empty" style="display:none;"></div>' +
      '<div class="twd-modal" style="display:none;" role="dialog" aria-modal="true" aria-labelledby="twd-modal-title" aria-hidden="true">' +
        '<div class="twd-modal-overlay"></div>' +
        '<div class="twd-modal-content">' +
          '<button type="button" class="twd-modal-close" aria-label="Close">&times;</button>' +
          '<div class="twd-modal-body"></div>' +
        '</div>' +
      '</div>'
    );
  }

  function injectStylesheet() {
    if (document.getElementById('twd-stylesheet')) return;
    var link = document.createElement('link');
    link.id = 'twd-stylesheet';
    link.rel = 'stylesheet';
    link.href = BASE_URL + 'widget-directory.css';
    document.head.appendChild(link);
  }

  function showLoadError(container) {
    container.innerHTML = '<div class="twd-empty"><h3>Couldn&rsquo;t load the widget directory</h3>' +
      '<p>Check that widget-data.json is hosted next to widget-directory.js.</p></div>';
  }

  // --- Events ------------------------------------------------------------------

  function bindEvents(container) {
    els.search.addEventListener('input', function (e) {
      state.searchTerm = e.target.value;
      applyFilters();
      renderCount();
      renderEmptyOrList();
    });

    els.categoryBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        els.categoryBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.activeCategory = btn.getAttribute('data-category');
        applyFilters();
        renderCount();
        renderEmptyOrList();
      });
    });

    els.viewBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        els.viewBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.activeView = btn.getAttribute('data-view');
        els.list.classList.toggle('active', state.activeView === 'list');
        els.grid.classList.toggle('active', state.activeView === 'grid');
        renderEmptyOrList();
      });
    });

    container.addEventListener('click', function (e) {
      if (e.target.closest('.twd-demo-link')) return; // let the link navigate normally
      var card = e.target.closest('[data-id]');
      if (card) {
        var row = findRow(card.getAttribute('data-id'));
        if (row) openModal(row);
      }
    });

    container.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-id]')) {
        e.preventDefault();
        var row = findRow(e.target.getAttribute('data-id'));
        if (row) openModal(row);
      }
    });

    els.modalClose.addEventListener('click', closeModal);
    els.modalOverlay.addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && els.modal.style.display !== 'none') closeModal();
    });
  }

  // --- Mount -----------------------------------------------------------------

  function mount() {
    var container = document.getElementById('tukios-widget-directory');
    if (!container) {
      console.warn('[Tukios Widget Directory] No element with id="tukios-widget-directory" found on this page.');
      return;
    }

    container.classList.add('twd-widget-directory');
    injectStylesheet();
    container.innerHTML = shellHTML();

    els = {
      search: container.querySelector('.twd-search'),
      categoryBtns: Array.prototype.slice.call(container.querySelectorAll('.twd-cat-btn')),
      viewBtns: Array.prototype.slice.call(container.querySelectorAll('.twd-view-btn')),
      list: container.querySelector('[data-view-content="list"]'),
      grid: container.querySelector('[data-view-content="grid"]'),
      empty: container.querySelector('.twd-empty'),
      count: container.querySelector('.twd-count'),
      modal: container.querySelector('.twd-modal'),
      modalOverlay: container.querySelector('.twd-modal-overlay'),
      modalClose: container.querySelector('.twd-modal-close'),
      modalBody: container.querySelector('.twd-modal-body')
    };

    fetch(BASE_URL + 'widget-data.json')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        state.allData = data;
        applyFilters();
        renderCount();
        renderEmptyOrList();
        bindEvents(container);
      })
      .catch(function (err) {
        console.error('[Tukios Widget Directory] Failed to load widget-data.json:', err);
        showLoadError(container);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
