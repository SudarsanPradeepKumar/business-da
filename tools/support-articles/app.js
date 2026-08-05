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
 * Config resolution order:
 * 1. URL params: org, site, ref, pagePathPrefix/pagePrefix, adminHost/adminBase,
 *    previewHost/previewBase, liveHost/liveBase
 * 2. ./app-config.json
 * 3. Built-in defaults
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

let APP_CONFIG = null;

const STATE = {
  busy: false,
  rows: new Map(),
  order: [],
};

const DOM = {};

document.addEventListener('DOMContentLoaded', () => {
  void bootstrap();
});

async function bootstrap() {
  try {
    cacheDom();
    validateDom();
    bindEvents();
    renderEmptyState();
    updateSummary();
    disableAllActions();
    setAppStatus('Loading app configuration…', 'working');

    APP_CONFIG = await resolveAppConfig();

    if (!APP_CONFIG.org || !APP_CONFIG.site || !APP_CONFIG.ref) {
      setAppStatus('Missing org/site/ref in the DA app URL or app-config.json.', 'error');
      disableAllActions();
      return;
    }

    setAppStatus(
      `Ready for ${APP_CONFIG.org}/${APP_CONFIG.site}@${APP_CONFIG.ref}`,
      'neutral',
    );
    syncControls();
  } catch (error) {
    console.error('Support Article Generator failed to initialize.', error);
    if (DOM.status) {
      setAppStatus(error.message || 'Failed to initialize the app.', 'error');
    }
  }
}

async function resolveAppConfig() {
  const fileConfig = await loadJsonConfig('./app-config.json');
  const params = new URLSearchParams(window.location.search);

  const org = firstNonEmpty(params.get('org'), fileConfig.org, '');
  const site = firstNonEmpty(params.get('site'), fileConfig.site, '');
  const ref = firstNonEmpty(params.get('ref'), fileConfig.ref, 'main');

  const pagePrefix = normalizePagePrefix(
    firstNonEmpty(
      params.get('pagePathPrefix'),
      params.get('pagePrefix'),
      fileConfig.pagePathPrefix,
      fileConfig.pagePrefix,
      '/support/articles',
    ),
  );

  const adminBase = normalizeBaseUrl(
    firstNonEmpty(
      params.get('adminHost'),
      params.get('adminBase'),
      fileConfig.adminHost,
      fileConfig.adminBase,
      'https://admin.hlx.page',
    ),
  );

  const derivedPreviewBase = (org && site && ref)
    ? `https://${ref}--${site}--${org}.aem.page`
    : '';

  const derivedLiveBase = (org && site && ref)
    ? `https://${ref}--${site}--${org}.aem.live`
    : '';

  const previewBase = normalizeBaseUrl(
    firstNonEmpty(
      params.get('previewHost'),
      params.get('previewBase'),
      fileConfig.previewHost,
      fileConfig.previewBase,
      derivedPreviewBase,
    ),
  );

  const liveBase = normalizeBaseUrl(
    firstNonEmpty(
      params.get('liveHost'),
      params.get('liveBase'),
      fileConfig.liveHost,
      fileConfig.liveBase,
      derivedLiveBase,
    ),
  );

  return {
    org,
    site,
    ref,
    pagePrefix,
    adminBase,
    previewBase,
    liveBase,
  };
}

async function loadJsonConfig(relativePath) {
  try {
    const url = new URL(relativePath, window.location.href).toString();
    const response = await fetch(url, { cache: 'no-store' });

    if (response.status === 404) {
      return {};
    }

    if (!response.ok) {
      throw new Error(`Failed to load app config: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('Proceeding without app-config.json overrides.', error);
    return {};
  }
}

function firstNonEmpty(...values) {
  const match = values.find((value) => String(value ?? '').trim() !== '');
  return match ?? '';
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
  DOM.pullBtn.addEventListener('click', () => { void onPullContentClick(); });
  DOM.publishSelectedBtn.addEventListener('click', () => { void onPublishSelectedClick(); });
  DOM.publishAllBtn.addEventListener('click', () => { void onPublishAllClick(); });

  if (DOM.selectAll) {
    DOM.selectAll.addEventListener('change', onSelectAllChange);
  }

  DOM.tbody.addEventListener('change', onTableChange);
  DOM.tbody.addEventListener('click', (event) => { void onTableClick(event); });
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

function normalizeBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
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
  DOM.status.className = `support-app__status status-pill tone-${tone}`;
}

function disableAllActions() {
  DOM.pullBtn.disabled = true;
  DOM.publishSelectedBtn.disabled = true;
  DOM.publishAllBtn.disabled = true;
  if (DOM.selectAll) DOM.selectAll.disabled = true;
}

function syncControls() {
  const hasConfig = !!(APP_CONFIG && APP_CONFIG.org && APP_CONFIG.site && APP_CONFIG.ref);
  const hasInput = !!DOM.input.value.trim();
  const rows = getRows();

  const readyRows = rows.filter(isPublishableRow);
  const selectedReadyRows = rows.filter((row) => row.selected && isPublishableRow(row));

  DOM.pullBtn.disabled = STATE.busy || !hasInput || !hasConfig;
  DOM.publishSelectedBtn.disabled = STATE.busy || selectedReadyRows.length === 0;
  DOM.publishAllBtn.disabled = STATE.busy || readyRows.length === 0;

  if (DOM.selectAll) {
    const selectableRows = rows.filter((row) => isPublishableRow(row));
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
  const failed = rows.filter(
    (row) => row.previewTone === 'error' || row.publishTone === 'error' || row.invalid,
  ).length;

  if (DOM.summaryTotal) DOM.summaryTotal.textContent = total;
  if (DOM.summaryReady) DOM.summaryReady.textContent = ready;
  if (DOM.summaryPublished) DOM.summaryPublished.textContent = published;
  if (DOM.summaryFailed) DOM.summaryFailed.textContent = failed;
}

function renderEmptyState() {
  DOM.tbody.innerHTML = `
    <tr class="empty-state-row">
      <td colspan="8">
        Enter one support article URL or article ID per line, then click
        <strong>Generate / Update Preview</strong>.
      </td>
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

function isPreviewableRow(row) {
  return !!row && !row.invalid && !row.duplicate;
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

  if (!/^https?:\/\//i.test(value) && /^[A-Za-z0-9_-]+$/.test(value)) {
    return value;
  }

  const contentBangMatch = value.match(/content!([A-Za-z0-9_-]+)/i);
  if (contentBangMatch) return contentBangMatch[1];

  const queryIdMatch = value.match(/[?&]id=([A-Za-z0-9_-]+)/i);
  if (queryIdMatch) return queryIdMatch[1];

  const supportArticleMatch = value.match(/\/support\/articles\/([A-Za-z0-9_-]+)/i);
  if (supportArticleMatch) return supportArticleMatch[1];

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
    // no-op
  }

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
    ? `<a href="${escapeHtml(row.previewUrl)}" target="_blank" rel="noopener noreferrer">Open Preview</a>`
    : '—';

  const liveLink = row.published && row.liveUrl
    ? `<a href="${escapeHtml(row.liveUrl)}" target="_blank" rel="noopener noreferrer">Open Live</a>`
    : '—';

  const publishDisabled = !isPublishableRow(row) || STATE.busy;
  const pullDisabled = !isPreviewableRow(row) || STATE.busy;
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
      <td class="cell-path">${row.pagePath ? `<code>${escapeHtml(row.pagePath)}</code>` : '—'}</td>
      <td class="cell-preview-link">${previewLink}</td>
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
          class="button button--inline"
          data-action="pull-row"
          data-row-key="${escapeHtml(row.key)}"
          ${pullDisabled ? 'disabled' : ''}
        >
          Update Preview
        </button>
        <button
          type="button"
          class="button button--inline"
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

async function onTableClick(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  const row = getRow(button.dataset.rowKey);
  if (!row) return;

  if (button.dataset.action === 'pull-row') {
    await previewRows([row], `Updating preview for ${row.articleId}...`);
    return;
  }

  if (button.dataset.action === 'publish-row') {
    await publishRows([row], `Publishing ${row.articleId} to live...`);
  }
}

async function onPullContentClick() {
  if (STATE.busy || !APP_CONFIG) return;

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

  const validRows = getRows().filter(isPreviewableRow);
  if (!validRows.length) {
    setAppStatus('No valid article IDs were found in the submitted input.', 'error');
    return;
  }

  await previewRows(validRows, `Generating ${validRows.length} support article preview page(s)...`);
}

async function onPublishSelectedClick() {
  if (STATE.busy) return;

  const selectedRows = getRows().filter((row) => row.selected && isPublishableRow(row));
  if (!selectedRows.length) {
    setAppStatus('Select at least one preview-ready article before publishing.', 'warning');
    return;
  }

  await publishRows(selectedRows, `Publishing ${selectedRows.length} selected article(s) to live...`);
}

async function onPublishAllClick() {
  if (STATE.busy) return;

  const readyRows = getRows().filter(isPublishableRow);
  if (!readyRows.length) {
    setAppStatus('No preview-ready articles are available to publish.', 'warning');
    return;
  }

  await publishRows(readyRows, `Publishing ${readyRows.length} article(s) to live...`);
}

async function previewRows(rows, startMessage) {
  if (!rows.length) return;

  STATE.busy = true;
  syncControls();
  setAppStatus(startMessage, 'working');

  for (const row of rows) {
    row.previewState = 'Generating preview';
    row.previewTone = 'working';
    row.publishState = row.published ? row.publishState : 'Not published';
    row.publishTone = row.published ? row.publishTone : 'neutral';
    row.error = '';
    row.previewReady = false;
    row.published = false;
    row.selected = false;
    renderRow(row);

    try {
      // eslint-disable-next-line no-await-in-loop
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

    renderRow(row);
    updateSummary();
    syncControls();
  }

  STATE.busy = false;
  syncControls();

  const readyCount = rows.filter((row) => row.previewReady).length;
  const failedCount = rows.length - readyCount;

  if (failedCount > 0) {
    setAppStatus(
      `Preview generation completed with ${readyCount} ready and ${failedCount} failed.`,
      'warning',
    );
  } else {
    setAppStatus(
      `Preview generation completed successfully. ${readyCount} article page(s) are ready on .aem.page.`,
      'success',
    );
  }
}

async function publishRows(rows, startMessage) {
  if (!rows.length) return;

  STATE.busy = true;
  syncControls();
  setAppStatus(startMessage, 'working');

  for (const row of rows) {
    row.publishState = 'Publishing';
    row.publishTone = 'working';
    row.error = '';
    row.selected = false;
    renderRow(row);

    try {
      // eslint-disable-next-line no-await-in-loop
      const response = await postAdminAction(row.liveAdminUrl);

      if (!response.ok) {
        throw new Error(await buildResponseError(response, 'Publish failed'));
      }

      row.published = true;
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
    setAppStatus(
      `Publish completed with ${publishedCount} success and ${failedCount} failure(s).`,
      'warning',
    );
  } else {
    setAppStatus(`Published ${publishedCount} support article page(s) to .aem.live.`, 'success');
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