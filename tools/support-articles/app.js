const STORAGE_KEY = 'support-import-app-config-v1';

const DEFAULTS = {
  org: '',
  site: '',
  branch: 'main',
  edgeEndpointTemplate: 'https://edgefunction-p148597-e1937574-edge-api.adobeaemcloud.com/support/articles?id={id}',
  previewEndpointTemplate: 'https://admin.hlx.page/preview/{org}/{site}/{branch}/support/articles/{id}',
  publishEndpointTemplate: 'https://admin.hlx.page/live/{org}/{site}/{branch}/support/articles/{id}',
};

const els = {
  org: document.getElementById('org'),
  site: document.getElementById('site'),
  branch: document.getElementById('branch'),
  edgeEndpointTemplate: document.getElementById('edgeEndpointTemplate'),
  previewEndpointTemplate: document.getElementById('previewEndpointTemplate'),
  publishEndpointTemplate: document.getElementById('publishEndpointTemplate'),
  adminToken: document.getElementById('adminToken'),
  articleInput: document.getElementById('articleInput'),
  optionWarm: document.getElementById('optionWarm'),
  optionPreview: document.getElementById('optionPreview'),
  optionPublish: document.getElementById('optionPublish'),
  parseBtn: document.getElementById('parseBtn'),
  runBtn: document.getElementById('runBtn'),
  clearBtn: document.getElementById('clearBtn'),
  resolvedIds: document.getElementById('resolvedIds'),
  resultsBody: document.getElementById('resultsBody'),
  logOutput: document.getElementById('logOutput'),
  summaryResolved: document.getElementById('summaryResolved'),
  summaryWarmed: document.getElementById('summaryWarmed'),
  summaryPreviewed: document.getElementById('summaryPreviewed'),
  summaryPublished: document.getElementById('summaryPublished'),
  summaryFailed: document.getElementById('summaryFailed'),
};

function appendLog(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level.toUpperCase().padEnd(5, ' ');
  els.logOutput.textContent = `${els.logOutput.textContent}\n[${timestamp}] ${prefix} ${message}`.trim();
  els.logOutput.scrollTop = els.logOutput.scrollHeight;
}

function loadStoredConfig() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

function getQueryConfig() {
  const params = new URLSearchParams(window.location.search);
  return {
    org: params.get('org') || '',
    site: params.get('site') || '',
    branch: params.get('ref') || params.get('branch') || '',
    edgeEndpointTemplate: params.get('edgeEndpointTemplate') || '',
    previewEndpointTemplate: params.get('previewEndpointTemplate') || '',
    publishEndpointTemplate: params.get('publishEndpointTemplate') || '',
  };
}

function loadConfig() {
  return {
    ...DEFAULTS,
    ...loadStoredConfig(),
    ...getQueryConfig(),
  };
}

function saveConfig(config) {
  const storable = {
    org: config.org,
    site: config.site,
    branch: config.branch,
    edgeEndpointTemplate: config.edgeEndpointTemplate,
    previewEndpointTemplate: config.previewEndpointTemplate,
    publishEndpointTemplate: config.publishEndpointTemplate,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(storable));
}

function writeConfigToForm(config) {
  els.org.value = config.org || '';
  els.site.value = config.site || '';
  els.branch.value = config.branch || DEFAULTS.branch;
  els.edgeEndpointTemplate.value = config.edgeEndpointTemplate || DEFAULTS.edgeEndpointTemplate;
  els.previewEndpointTemplate.value = config.previewEndpointTemplate
    || DEFAULTS.previewEndpointTemplate;
  els.publishEndpointTemplate.value = config.publishEndpointTemplate
    || DEFAULTS.publishEndpointTemplate;
}

function readConfigFromForm() {
  return {
    org: els.org.value.trim(),
    site: els.site.value.trim(),
    branch: els.branch.value.trim() || 'main',
    edgeEndpointTemplate: els.edgeEndpointTemplate.value.trim(),
    previewEndpointTemplate: els.previewEndpointTemplate.value.trim(),
    publishEndpointTemplate: els.publishEndpointTemplate.value.trim(),
    adminToken: els.adminToken.value.trim(),
  };
}

function normalizeArticleId(candidate) {
  const value = String(candidate || '').trim().replace(/[?#].*$/, '');
  return /^[A-Za-z0-9_-]{6,}$/.test(value) ? value : '';
}

function extractArticleId(rawValue) {
  const raw = String(rawValue || '').trim();
  if (!raw) return '';

  const contentBang = raw.match(/content!([A-Za-z0-9_-]+)/i);
  if (contentBang) {
    return normalizeArticleId(contentBang[1]);
  }

  if (/^[A-Za-z0-9_-]{6,}$/.test(raw) && !/^https?:\/\//i.test(raw)) {
    return normalizeArticleId(raw);
  }

  try {
    const url = new URL(raw);

    if (url.searchParams.get('id')) {
      return normalizeArticleId(url.searchParams.get('id'));
    }

    const pathMatchers = [
      /\/support\/articles\/([^/?#]+)/i,
      /\/contents\/([^/?#]+)/i,
      /\/articles\/([^/?#]+)/i,
      /\/support\/([^/?#]+)/i,
    ];

    const match = pathMatchers
      .map((pattern) => url.pathname.match(pattern))
      .find(Boolean);
    if (match) return normalizeArticleId(match[1]);
  } catch (e) {
    return '';
  }

  return '';
}

function splitInput(text) {
  return text
    .split(/\r?\n|,/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseInput(text) {
  const tokens = splitInput(text);
  const resolvedMap = new Map();
  const invalid = [];

  tokens.forEach((token) => {
    const id = extractArticleId(token);
    if (!id) {
      invalid.push(token);
      return;
    }
    if (!resolvedMap.has(id)) {
      resolvedMap.set(id, { id, raw: token });
    }
  });

  return {
    resolved: [...resolvedMap.values()],
    invalid,
  };
}

function renderResolvedIds(resolved, invalid) {
  els.resolvedIds.innerHTML = '';

  if (!resolved.length && !invalid.length) {
    els.resolvedIds.classList.add('empty-state');
    els.resolvedIds.textContent = 'No article IDs parsed yet.';
    return;
  }

  els.resolvedIds.classList.remove('empty-state');

  resolved.forEach((item) => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = item.id;
    els.resolvedIds.append(chip);
  });

  invalid.forEach((item) => {
    const chip = document.createElement('span');
    chip.className = 'chip invalid';
    chip.textContent = `Unresolved: ${item}`;
    els.resolvedIds.append(chip);
  });
}

function setSummary({
  resolved = 0,
  warmed = 0,
  previewed = 0,
  published = 0,
  failed = 0,
}) {
  els.summaryResolved.textContent = String(resolved);
  els.summaryWarmed.textContent = String(warmed);
  els.summaryPreviewed.textContent = String(previewed);
  els.summaryPublished.textContent = String(published);
  els.summaryFailed.textContent = String(failed);
}

function formatTemplate(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) => encodeURIComponent(values[key] ?? ''));
}

function buildPreviewUrl(config, id) {
  if (!config.org || !config.site || !config.branch) return '';
  return `https://${config.branch}--${config.site}--${config.org}.aem.page/support/articles/${id}`;
}

function buildLiveUrl(config, id) {
  if (!config.org || !config.site || !config.branch) return '';
  return `https://${config.branch}--${config.site}--${config.org}.aem.live/support/articles/${id}`;
}

function clearResults() {
  els.resultsBody.innerHTML = '';
}

function emptyStatusCell(label = 'pending') {
  const td = document.createElement('td');
  const badge = document.createElement('span');
  badge.className = 'status-badge status-idle';
  badge.textContent = label;
  td.append(badge);
  return td;
}

function setBadgeStatus(badge, status, label) {
  badge.className = `status-badge status-${status}`;
  badge.textContent = label;
}

function linkCell(url, label) {
  const td = document.createElement('td');
  if (!url) {
    td.textContent = '—';
    return td;
  }

  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = label || url;
  td.append(link);
  return td;
}

function createResultRow(item, config) {
  const row = document.createElement('tr');

  const inputCell = document.createElement('td');
  inputCell.textContent = item.raw;

  const idCell = document.createElement('td');
  idCell.textContent = item.id;

  const warmCell = emptyStatusCell();
  const previewCell = emptyStatusCell('skipped');
  const publishCell = emptyStatusCell('skipped');

  const previewUrlCell = linkCell(buildPreviewUrl(config, item.id), 'Preview');
  const liveUrlCell = linkCell(buildLiveUrl(config, item.id), 'Live');

  const messageCell = document.createElement('td');
  messageCell.textContent = 'Queued';

  row.append(
    inputCell,
    idCell,
    warmCell,
    previewCell,
    publishCell,
    previewUrlCell,
    liveUrlCell,
    messageCell,
  );

  els.resultsBody.append(row);

  return {
    row,
    warmBadge: warmCell.querySelector('.status-badge'),
    previewBadge: previewCell.querySelector('.status-badge'),
    publishBadge: publishCell.querySelector('.status-badge'),
    messageCell,
  };
}

function shortError(error) {
  const text = error?.message || String(error);
  return text.length > 220 ? `${text.slice(0, 217)}...` : text;
}

async function fetchJson(endpoint) {
  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/json',
    },
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = null;
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${endpoint} :: ${data?.error || text || response.statusText}`);
  }

  return data;
}

async function postAction(url, adminToken) {
  const headers = adminToken ? { 'x-auth-token': adminToken } : {};
  const response = await fetch(url, {
    method: 'POST',
    headers,
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url} :: ${text || response.statusText}`);
  }

  return text;
}

async function warmArticle(item, config) {
  const endpoint = formatTemplate(config.edgeEndpointTemplate, {
    id: item.id,
    org: config.org,
    site: config.site,
    branch: config.branch,
  });

  const payload = await fetchJson(endpoint);
  return { endpoint, payload };
}

async function previewArticle(item, config) {
  const endpoint = formatTemplate(config.previewEndpointTemplate, {
    id: item.id,
    org: config.org,
    site: config.site,
    branch: config.branch,
  });

  await postAction(endpoint, config.adminToken);
  return endpoint;
}

async function publishArticle(item, config) {
  const endpoint = formatTemplate(config.publishEndpointTemplate, {
    id: item.id,
    org: config.org,
    site: config.site,
    branch: config.branch,
  });

  await postAction(endpoint, config.adminToken);
  return endpoint;
}

function setRunning(isRunning) {
  els.parseBtn.disabled = isRunning;
  els.runBtn.disabled = isRunning;
  els.clearBtn.disabled = isRunning;
}

function resetApp() {
  els.articleInput.value = '';
  els.adminToken.value = '';
  renderResolvedIds([], []);
  clearResults();
  els.resultsBody.innerHTML = `
    <tr class="empty-row">
      <td colspan="8">No batch has run yet.</td>
    </tr>
  `;
  els.logOutput.textContent = 'Ready.';
  setSummary({});
}

function parseCurrentInput() {
  const { resolved, invalid } = parseInput(els.articleInput.value);
  renderResolvedIds(resolved, invalid);
  setSummary({
    resolved: resolved.length,
    warmed: 0,
    previewed: 0,
    published: 0,
    failed: invalid.length ? invalid.length : 0,
  });

  if (invalid.length) {
    appendLog(`Ignored ${invalid.length} unresolved input value(s).`, 'warn');
  } else {
    appendLog(`Parsed ${resolved.length} unique article ID(s).`, 'info');
  }

  return { resolved, invalid };
}

async function runBatch() {
  const config = readConfigFromForm();
  saveConfig(config);

  const { resolved, invalid } = parseCurrentInput();

  if (!resolved.length) {
    appendLog('No valid article IDs were found. Nothing to run.', 'error');
    return;
  }

  const shouldWarm = els.optionWarm.checked
    || els.optionPreview.checked
    || els.optionPublish.checked;
  const shouldPreview = els.optionPreview.checked || els.optionPublish.checked;
  const shouldPublish = els.optionPublish.checked;

  if ((shouldPreview || shouldPublish) && !config.adminToken) {
    appendLog('Admin token is required when preview or publish is enabled.', 'error');
    els.adminToken.focus();
    return;
  }

  clearResults();
  appendLog(`Starting batch for ${resolved.length} article(s).`, 'info');
  setRunning(true);

  let warmed = 0;
  let previewed = 0;
  let published = 0;
  let failed = invalid.length;

  const processItem = async (item) => {
    const result = createResultRow(item, config);

    try {
      if (shouldWarm) {
        setBadgeStatus(result.warmBadge, 'running', 'running');
        const warm = await warmArticle(item, config);
        setBadgeStatus(result.warmBadge, 'ok', 'ok');
        result.messageCell.textContent = `Warmed from ${warm.endpoint}`;
        appendLog(`Warmed article ${item.id}.`, 'info');
        warmed += 1;
      } else {
        setBadgeStatus(result.warmBadge, 'skipped', 'skipped');
      }

      if (shouldPreview) {
        setBadgeStatus(result.previewBadge, 'running', 'running');
        await previewArticle(item, config);
        setBadgeStatus(result.previewBadge, 'ok', 'ok');
        appendLog(`Previewed /support/articles/${item.id}.`, 'info');
        previewed += 1;
      } else {
        setBadgeStatus(result.previewBadge, 'skipped', 'skipped');
      }

      if (shouldPublish) {
        setBadgeStatus(result.publishBadge, 'running', 'running');
        await publishArticle(item, config);
        setBadgeStatus(result.publishBadge, 'ok', 'ok');
        appendLog(`Published /support/articles/${item.id}.`, 'info');
        published += 1;
      } else {
        setBadgeStatus(result.publishBadge, 'skipped', 'skipped');
      }

      if (!shouldPublish && shouldPreview) {
        result.messageCell.textContent = 'Preview completed';
      } else if (shouldPublish) {
        result.messageCell.textContent = 'Publish completed';
      } else {
        result.messageCell.textContent = 'Warm completed';
      }
    } catch (error) {
      failed += 1;
      if (result.warmBadge.textContent === 'running') {
        setBadgeStatus(result.warmBadge, 'error', 'error');
      }
      if (result.previewBadge.textContent === 'running') {
        setBadgeStatus(result.previewBadge, 'error', 'error');
      }
      if (result.publishBadge.textContent === 'running') {
        setBadgeStatus(result.publishBadge, 'error', 'error');
      }

      result.messageCell.textContent = shortError(error);
      appendLog(`Failed article ${item.id}: ${shortError(error)}`, 'error');
    }

    setSummary({
      resolved: resolved.length,
      warmed,
      previewed,
      published,
      failed,
    });
  };

  try {
    await resolved.reduce(
      (chain, item) => chain.then(() => processItem(item)),
      Promise.resolve(),
    );
  } finally {
    setRunning(false);
    appendLog('Batch run finished.', 'info');
  }
}

function init() {
  writeConfigToForm(loadConfig());

  setSummary({});
  renderResolvedIds([], []);

  els.parseBtn.addEventListener('click', parseCurrentInput);
  els.runBtn.addEventListener('click', runBatch);
  els.clearBtn.addEventListener('click', resetApp);

  appendLog('App initialized.', 'info');
}

init();
