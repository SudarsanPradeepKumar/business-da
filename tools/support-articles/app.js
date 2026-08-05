/**
 * DA App: Support Article Generator
 *
 * Finalized architecture:
 * - Parse one URL/ID per line
 * - Build /support/articles/<articleId>
 * - POST preview to admin.hlx.page to invoke json2html + Edge Function + Mustache
 * - Show preview-generation status only
 * - Allow one-by-one or bulk publish to .aem.live
 *
 * Expected HTML ids:
 * - article-input
 * - pull-content
 * - publish-selected
 * - publish-all
 * - app-status
 * - summary-total
 * - summary-ready
 * - summary-published
 * - summary-failed
 * - article-status-body
 * - select-all-articles (optional)
 */

const APP_CONFIG = (() => {
  const params = new URLSearchParams(window.location.search);
  const overrides = window.SUPPORT_ARTICLES_APP_CONFIG || {};

  const org = overrides.org || params.get('org') || '';
  const site = overrides.site || params.get('site') || '';
  const ref = overrides.ref || params.get('ref') || 'main';

  const pagePrefix = normalizePagePrefix(overrides.pagePrefix || '/support/articles');
  const adminBase = (overrides.adminBase || 'https://admin.hlx.page').replace(/\/$/, '');

  const previewBase = (overrides.previewBase
    || `https://${ref}--${site}--${org}.aem.page`).replace(/\/$/, '');

  const liveBase = (overrides.liveBase
    || `https://${ref}--${site}--${org}.aem.live`).replace(/\/$/, '');

  return {
    org,
    site,
    ref,
    pagePrefix,
    adminBase,
    previewBase,
    liveBase,
  };
})();

const STATE = {
  busy: false,
  rows: new Map(),
  order: [],
};

const DOM = {};

document.addEventListener('DOMContentLoaded', init);

function init() {
  cacheDom();
  validateDom();
  bindEvents();
  renderEmptyState();
  updateSummary();
  syncControls();

  if (!APP_CONFIG.org || !APP_CONFIG.site || !APP_CONFIG.ref) {
    setAppStatus('Missing org/site/ref in the DA app URL.', 'error');
    disableAllActions();
    return;
  }

  setAppStatus(
    `Ready for ${APP_CONFIG.org}/${APP_CONFIG.site}@${APP_CONFIG.ref}`,
    'neutral',
  );
}

function cacheDom() {
  DOM.input = pickById('article-input');
  DOM.pullBtn = pickById('pull-content');
  DOM.publishSelectedBtn = pickById('publish-selected');
  DOM.publishAllBtn = pickById('publish-all');
  DOM.status = pickById('app-status');
  DOM.summaryTotal = pickById('summary-total');
  DOM.summaryReady = pickById('summary-ready');
  DOM.summaryPublished = pickById('summary-published');
  DOM.summaryFailed = pickById('summary-failed');
  DOM.tbody = pickById('article-status-body');
  DOM.selectAll = pickById('select-all-articles');
}

function validateDom() {
  const required = [
    ['article-input', DOM.input],
    ['pull-content', DOM.pullBtn],
    ['publish-selected', DOM.publishSelectedBtn],
    ['publish-all', DOM.publishAllBtn],
    ['app-status', DOM.status],
    ['article-status-body', DOM.tbody],
  ];

  const missing = required.filter(([, el]) => !el).map(([id]) => id);
  if (missing.length) {
    throw new Error(`Missing required HTML element(s): ${missing.join(', ')}`);
  }
}

function bindEvents() {
  DOM.input.addEventListener('input', syncControls);
  DOM.pullBtn.addEventListener('click', onPullContentClick);
  DOM.publishSelectedBtn.addEventListener('click', onPublishSelectedClick);
  DOM.publishAllBtn.addEventListener('click', onPublishAllClick);

  if (DOM.selectAll) {
    DOM.selectAll.addEventListener('change', onSelectAllChange);
  }

  DOM.tbody.addEventListener('change', onTableChange);
  DOM.tbody.addEventListener('click', onTableClick);
}

function pickById(...ids) {
  return ids.map((id) => document.getElementById(id)).find(Boolean) || null;
}

function normalizePagePrefix(value) {
  const prefix = String(value || '/support/articles').trim();
  if (!prefix) return '/support/articles';
  return `/${prefix.replace(/^\/+/, '').replace(/\/+$/, '')}`;
}

function normalizePath(path) {
  const value = String(path || '').trim();
  if (!value) return '/';
  return value.startsWith('/') ? value : `/${value}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setAppStatus(message, tone = 'neutral') {
  DOM.status.textContent = message;
  DOM.status.dataset.tone = tone;
  DOM.status.className = `status-pill tone-${tone}`;
}

function disableAllActions() {
  DOM.pullBtn.disabled = true;
  DOM.publishSelectedBtn.disabled = true;
  DOM.publishAllBtn.disabled = true;
  if (DOM.selectAll) DOM.selectAll.disabled = true;
}

function syncControls() {
  const hasInput = !!DOM.input.value.trim();
  const rows = getRows();

  const readyRows = rows.filter(isPublishableRow);
  const selectedReadyRows = rows.filter((row) => row.selected && isPublishableRow(row));

  DOM.pullBtn.disabled = STATE.busy || !hasInput || !APP_CONFIG.org || !APP_CONFIG.site || !APP_CONFIG.ref;
  DOM.publishSelectedBtn.disabled = STATE.busy || selectedReadyRows.length === 0;
  DOM.publishAllBtn.disabled = STATE.busy || readyRows.length === 0;

  if (DOM.selectAll) {
    const selectableRows = rows.filter((row) => !row.invalid && !row.duplicate && row.previewReady && !row.published);

    DOM.selectAll.disabled = STATE.busy || selectableRows.length === 0;

    const selectedCount = selectableRows.filter((row) => row.selected).length;
    DOM.selectAll.checked = selectableRows.length > 0 && selectedCount === selectableRows.length;
    DOM.selectAll.indeterminate = selectedCount > 0 && selectedCount < selectableRows.length;
  }
}

function updateSummary() {
  const rows = getRows();

  const total = rows.length;
  const ready = rows.filter((row) => row.previewReady).length;
  const published = rows.filter((row) => row.published).length;
  const failed = rows.filter((row) => row.previewTone === 'error' || row.publishTone === 'error' || row.invalid).length;

  if (DOM.summaryTotal) DOM.summaryTotal.textContent = total;
  if (DOM.summaryReady) DOM.summaryReady.textContent = ready;
  if (DOM.summaryPublished) DOM.summaryPublished.textContent = published;
  if (DOM.summaryFailed) DOM.summaryFailed.textContent = failed;
}

function renderEmptyState() {
  DOM.tbody.innerHTML = `
    <tr class="empty-state-row">
      <td colspan="7">Enter one support article URL or article ID per line, then click <strong>Update / Pull Content</strong>.</td>
    </tr>
  `;
}

function clearRows() {
  STATE.rows.clear();
  STATE.order = [];
  DOM.tbody.innerHTML = '';
}

function getRows() {
  return STATE.order.map((key) => STATE.rows.get(key)).filter(Boolean);
}

function addRow(row) {
  STATE.rows.set(row.key, row);
  STATE.order.push(row.key);
}

function getRow(key) {
  return STATE.rows.get(key);
}

function createValidRow(source, articleId) {
  const safeId = String(articleId).trim();
  const pagePath = `${APP_CONFIG.pagePrefix}/${encodeURIComponent(safeId)}`;

  return {
    key: `article:${safeId}`,
    source,
    articleId: safeId,
    pagePath,
    previewAdminUrl: buildAdminUrl('preview', pagePath),
    liveAdminUrl: buildAdminUrl('live', pagePath),
    previewUrl: `${APP_CONFIG.previewBase}${pagePath}`,
    liveUrl: `${APP_CONFIG.liveBase}${pagePath}`,
    selected: false,
    previewReady: false,
    published: false,
    invalid: false,
    duplicate: false,
    error: '',
    previewState: 'Pending',
    previewTone: 'neutral',
    publishState: 'Not published',
    publishTone: 'neutral',
  };
}

function createInvalidRow(source, reason, index) {
  return {
    key: `invalid:${index}:${Date.now()}`,
    source,
    articleId: '—',
    pagePath: '',
    previewAdminUrl: '',
    liveAdminUrl: '',
    previewUrl: '',
    liveUrl: '',
    selected: false,
    previewReady: false,
    published: false,
    invalid: true,
    duplicate: false,
    error: reason,
    previewState: 'Invalid input',
    previewTone: 'error',
    publishState: 'Not publishable',
    publishTone: 'neutral',
  };
}

function createDuplicateRow(source, articleId, index) {
  return {
    key: `duplicate:${articleId}:${index}:${Date.now()}`,
    source,
    articleId,
    pagePath: '',
    previewAdminUrl: '',
    liveAdminUrl: '',
    previewUrl: '',
    liveUrl: '',
    selected: false,
    previewReady: false,
    published: false,
    invalid: false,
    duplicate: true,
    error: 'Duplicate article ID skipped in this run.',
    previewState: 'Skipped',
    previewTone: 'warning',
    publishState: 'Not publishable',
    publishTone: 'neutral',
  };
}

function isPublishableRow(row) {
  return !!row && row.previewReady && !row.published && !row.invalid && !row.duplicate;
}

function buildAdminUrl(stage, path) {
  const normalizedPath = normalizePath(path);
  return `${APP_CONFIG.adminBase}/${stage}/${encodeURIComponent(APP_CONFIG.org)}/${encodeURIComponent(APP_CONFIG.site)}/${encodeURIComponent(APP_CONFIG.ref)}${normalizedPath}`;
}

function parseInputLines(raw) {
  const lines = String(raw || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const results = [];
  const seen = new Set();

  lines.forEach((line, index) => {
    const articleId = extractArticleId(line);

    if (!articleId) {
      results.push(createInvalidRow(line, 'Could not extract an article ID from this line.', index));
      return;
    }

    if (seen.has(articleId)) {
      results.push(createDuplicateRow(line, articleId, index));
      return;
    }

    seen.add(articleId);
    results.push(createValidRow(line, articleId));
  });

  return results;
}

function extractArticleId(input) {
  const value = String(input || '').trim();
  if (!value) return '';

  // raw article id
  if (!/^https?:\/\//i.test(value) && /^[A-Za-z0-9_-]+$/.test(value)) {
    return value;
  }

  // ATT support center style: ?content!000096905
  const contentBangMatch = value.match(/content!([A-Za-z0-9_-]+)/i);
  if (contentBangMatch) return contentBangMatch[1];

  // generic id=... inside a URL-like string
  const queryIdMatch = value.match(/[?&]id=([A-Za-z0-9_-]+)/i);
  if (queryIdMatch) return queryIdMatch[1];

  // support article page style
  const supportArticleMatch = value.match(/\/support\/articles\/([A-Za-z0-9_-]+)/i);
  if (supportArticleMatch) return supportArticleMatch[1];

  // source API style
  const contentsMatch = value.match(/\/contents\/([A-Za-z0-9_-]+)/i);
  if (contentsMatch) return contentsMatch[1];

  try {
    const url = new URL(value);

    const idParam = url.searchParams.get('id');
    if (idParam) return idParam;

    const supportMatch = url.pathname.match(/\/support\/articles\/([A-Za-z0-9_-]+)/i);
    if (supportMatch) return supportMatch[1];

    const contentsPathMatch = url.pathname.match(/\/contents\/([A-Za-z0-9_-]+)/i);
    if (contentsPathMatch) return contentsPathMatch[1];

    const segments = url.pathname.split('/').filter(Boolean);
    const tail = segments[segments.length - 1];
    if (tail && /^[A-Za-z0-9_-]{6,}$/.test(tail)) return tail;
  } catch (e) {
    // fall through
  }

  // last chance: pick a long numeric token from the line
  const numericMatch = value.match(/\b\d{6,}\b/);
  if (numericMatch) return numericMatch[0];

  return '';
}

function renderRows() {
  if (!STATE.order.length) {
    renderEmptyState();
    return;
  }

  DOM.tbody.innerHTML = STATE.order
    .map((key) => renderRowMarkup(STATE.rows.get(key)))
    .join('');
}

function renderRow(row) {
  const tr = DOM.tbody.querySelector(`tr[data-row-key="${cssEscape(row.key)}"]`);
  if (!tr) {
    renderRows();
    return;
  }

  tr.outerHTML = renderRowMarkup(row);
}

function renderRowMarkup(row) {
  const previewLink = row.previewReady && row.previewUrl
    ? `<a href="${escapeHtml(row.previewUrl)}" target="_blank" rel="noopener noreferrer">Open preview</a>`
    : '—';

  const liveLink = row.published && row.liveUrl
    ? `<a href="${escapeHtml(row.liveUrl)}" target="_blank" rel="noopener noreferrer">Open live</a>`
    : '—';

  const publishDisabled = !isPublishableRow(row) || STATE.busy;
  const checkboxDisabled = !isPublishableRow(row) || STATE.busy;

  return `
    <tr data-row-key="${escapeHtml(row.key)}">
      <td>
        <input
          type="checkbox"
          class="row-select"
          data-row-key="${escapeHtml(row.key)}"
          ${row.selected ? 'checked' : ''}
          ${checkboxDisabled ? 'disabled' : ''}
        />
      </td>
      <td class="cell-source">${escapeHtml(row.source)}</td>
      <td class="cell-id"><code>${escapeHtml(row.articleId)}</code></td>
      <td class="cell-path">
        ${row.pagePath ? `<div><code>${escapeHtml(row.pagePath)}</code></div>` : '<div>—</div>'}
        <div class="row-link">${previewLink}</div>
      </td>
      <td class="cell-status">
        ${renderStatusPill(row.previewState, row.previewTone)}
        ${row.error ? `<div class="row-error">${escapeHtml(row.error)}</div>` : ''}
      </td>
      <td class="cell-status">
        ${renderStatusPill(row.publishState, row.publishTone)}
        <div class="row-link">${liveLink}</div>
      </td>
      <td class="cell-actions">
        <button
          type="button"
          class="secondary-action publish-row"
          data-action="publish-row"
          data-row-key="${escapeHtml(row.key)}"
          ${publishDisabled ? 'disabled' : ''}
        >
          Publish
        </button>
      </td>
    </tr>
  `;
}

function renderStatusPill(label, tone) {
  return `<span class="status-pill tone-${escapeHtml(tone)}">${escapeHtml(label)}</span>`;
}

function cssEscape(value) {
  if (window.CSS && typeof window.CSS.escape === 'function') {
    return window.CSS.escape(value);
  }
  return String(value).replace(/"/g, '\\"');
}

function onSelectAllChange(event) {
  const checked = !!event.target.checked;
  getRows().forEach((row) => {
    if (isPublishableRow(row)) {
      row.selected = checked;
      renderRow(row);
    }
  });
  syncControls();
}

function onTableChange(event) {
  const checkbox = event.target.closest('.row-select');
  if (!checkbox) return;

  const row = getRow(checkbox.dataset.rowKey);
  if (!row) return;

  row.selected = !!checkbox.checked;
  syncControls();
}

function onTableClick(event) {
  const button = event.target.closest('[data-action="publish-row"]');
  if (!button) return;

  const row = getRow(button.dataset.rowKey);
  if (!row) return;

  publishRows([row]);
}

async function onPullContentClick() {
  if (STATE.busy) return;

  const parsedRows = parseInputLines(DOM.input.value);

  clearRows();
  parsedRows.forEach(addRow);
  renderRows();
  updateSummary();
  syncControls();

  if (!parsedRows.length) {
    setAppStatus('Nothing to process. Enter one article URL or ID per line.', 'warning');
    return;
  }

  const validRows = getRows().filter((row) => !row.invalid && !row.duplicate);
  if (!validRows.length) {
    setAppStatus('No valid article IDs were found in the submitted input.', 'error');
    return;
  }

  STATE.busy = true;
  syncControls();
  setAppStatus(`Generating ${validRows.length} support article preview page(s)...`, 'working');

  for (const row of validRows) {
    // eslint-disable-next-line no-await-in-loop
    await generatePreviewPage(row);
    renderRow(row);
    updateSummary();
    syncControls();
  }

  STATE.busy = false;
  syncControls();

  const readyCount = getRows().filter((row) => row.previewReady).length;
  const failedCount = getRows().filter((row) => row.previewTone === 'error' || row.invalid).length;

  if (failedCount > 0) {
    setAppStatus(`Completed with ${readyCount} ready and ${failedCount} failed.`, 'warning');
  } else {
    setAppStatus(`Completed successfully. ${readyCount} support article page(s) are ready on preview.`, 'success');
  }
}

async function onPublishSelectedClick() {
  if (STATE.busy) return;

  const selectedRows = getRows().filter((row) => row.selected && isPublishableRow(row));
  if (!selectedRows.length) {
    setAppStatus('Select at least one ready article before publishing.', 'warning');
    return;
  }

  await publishRows(selectedRows);
}

async function onPublishAllClick() {
  if (STATE.busy) return;

  const readyRows = getRows().filter(isPublishableRow);
  if (!readyRows.length) {
    setAppStatus('No preview-ready articles are available to publish.', 'warning');
    return;
  }

  await publishRows(readyRows);
}

async function generatePreviewPage(row) {
  row.previewState = 'Generating preview';
  row.previewTone = 'working';
  row.publishState = 'Not published';
  row.publishTone = 'neutral';
  row.error = '';
  row.previewReady = false;
  row.published = false;

  try {
    const response = await postAdminAction(row.previewAdminUrl);

    if (!response.ok) {
      throw new Error(await buildResponseError(response, 'Preview generation failed'));
    }

    row.previewReady = true;
    row.previewState = 'Ready on preview';
    row.previewTone = 'success';
    row.publishState = 'Ready to publish';
    row.publishTone = 'success';
  } catch (error) {
    row.previewReady = false;
    row.previewState = 'Failed';
    row.previewTone = 'error';
    row.publishState = 'Blocked';
    row.publishTone = 'neutral';
    row.error = error.message || 'Unknown preview error';
  }
}

async function publishRows(rows) {
  STATE.busy = true;
  syncControls();
  setAppStatus(`Publishing ${rows.length} support article page(s) to live...`, 'working');

  for (const row of rows) {
    row.publishState = 'Publishing';
    row.publishTone = 'working';
    row.error = '';
    renderRow(row);

    try {
      // eslint-disable-next-line no-await-in-loop
      const response = await postAdminAction(row.liveAdminUrl);

      if (!response.ok) {
        throw new Error(await buildResponseError(response, 'Publish failed'));
      }

      row.published = true;
      row.selected = false;
      row.publishState = 'Published on live';
      row.publishTone = 'success';
    } catch (error) {
      row.published = false;
      row.publishState = 'Publish failed';
      row.publishTone = 'error';
      row.error = error.message || 'Unknown publish error';
    }

    renderRow(row);
    updateSummary();
    syncControls();
  }

  STATE.busy = false;
  syncControls();

  const publishedCount = rows.filter((row) => row.published).length;
  const failedCount = rows.length - publishedCount;

  if (failedCount > 0) {
    setAppStatus(`Publish completed with ${publishedCount} success and ${failedCount} failure(s).`, 'warning');
  } else {
    setAppStatus(`Published ${publishedCount} support article page(s) to live.`, 'success');
  }
}

async function postAdminAction(url) {
  return fetch(url, {
    method: 'POST',
    mode: 'cors',
    credentials: 'include',
  });
}

async function buildResponseError(response, fallbackMessage) {
  const contentType = response.headers.get('content-type') || '';
  let body = '';

  try {
    body = await response.text();
  } catch (e) {
    // ignore
  }

  let detail = body.trim();

  if (contentType.includes('application/json') && detail) {
    try {
      const parsed = JSON.parse(detail);
      detail = parsed.error || parsed.message || detail;
    } catch (e) {
      // keep text
    }
  }

  if (detail.length > 300) {
    detail = `${detail.slice(0, 300)}…`;
  }

  return `${fallbackMessage}: ${response.status} ${response.statusText}${detail ? ` — ${detail}` : ''}`;
}
