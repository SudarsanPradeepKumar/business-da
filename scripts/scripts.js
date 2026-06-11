import {
  buildBlock,
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    if (h1.closest('.hero') || picture.closest('.hero')
      || h1.closest('[class^="hero"]') || picture.closest('[class^="hero"]')) {
      return;
    }
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) {
      sessionStorage.setItem('fonts-loaded', 'true');
    }
  } catch (e) {
    // do nothing
  }
}

function isUniversalEditor() {
  return /\.(stage-ue|ue)\.da\.live$/.test(window.location.hostname);
}

function buildHeroHomepageBlock(main) {
  const sections = main.querySelectorAll(':scope > div');
  sections.forEach((section) => {
    const firstP = section.querySelector(':scope > p:first-child');
    const h1 = section.querySelector(':scope > h1');
    if (!firstP || !h1) return;
    const url = firstP.textContent.trim();
    if (!url.startsWith('http') || !url.includes('/assets/')) return;

    const imageCell = document.createElement('div');
    const textCell = document.createElement('div');
    const row = document.createElement('div');

    imageCell.append(firstP);
    [...section.querySelectorAll(':scope > p, :scope > h1')].forEach((el) => {
      textCell.append(el);
    });

    row.append(imageCell, textCell);
    const block = buildBlock('hero-homepage', '');
    block.textContent = '';
    block.append(row);

    section.prepend(block);
  });
}

/**
 * Returns true only for direct YouTube video URLs, not playlist links.
 * @param {string} url
 * @returns {boolean}
 */
function isYouTubeVideoUrl(url) {
  try {
    const parsed = new URL(url, window.location.href);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') return true;

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname.startsWith('/watch') && parsed.searchParams.get('v')) return true;
      if (parsed.pathname.startsWith('/embed/')) return true;
      return false;
    }

    return false;
  } catch (e) {
    return false;
  }
}

/**
 * Returns a YouTube video link only when the section is just a standalone
 * URL paragraph, not regular prose with a link in it.
 * @param {Element} section
 * @returns {string|null}
 */
function getYouTubeVideoLinkFromSection(section) {
  const children = [...section.children].filter((el) => (el.textContent || '').trim().length > 0);

  if (children.length !== 1) return null;

  const onlyChild = children[0];
  if (onlyChild.tagName !== 'P') return null;

  const links = onlyChild.querySelectorAll('a[href]');
  if (links.length !== 1) return null;

  const link = links[0];
  const href = link.getAttribute('href');
  if (!href || !isYouTubeVideoUrl(href)) return null;

  const paragraphText = onlyChild.textContent.trim();
  const linkText = link.textContent.trim();

  // Only convert when the whole paragraph is effectively just the link.
  // This prevents prose such as:
  // "You can view our entire Business Center playlist on YouTube."
  if (paragraphText !== linkText) return null;

  return href;
}

/**
 * Converts plain video-link sections into a real embed block before
 * decorateBlocks(main) runs.
 * @param {Element} main
 */
function autoBlockYouTubeEmbeds(main) {
  [...main.querySelectorAll(':scope > div')].forEach((section) => {
    const href = getYouTubeVideoLinkFromSection(section);
    if (!href) return;

    if (section.querySelector('.embed, .video')) return;

    const link = document.createElement('a');
    link.href = href;
    link.textContent = href;

    const embedBlock = buildBlock('embed', [[link]]);
    section.innerHTML = '';
    section.append(embedBlock);
  });
}

function buildAutoBlocks(main) {
  try {
    if (!isUniversalEditor()) {
      const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
      if (fragments.length > 0) {
        import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
          fragments.forEach(async (fragment) => {
            try {
              const { pathname } = new URL(fragment.href);
              const frag = await loadFragment(pathname);
              fragment.parentElement.replaceWith(...frag.children);
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error('Fragment loading failed', error);
            }
          });
        });
      }
    }

    buildHeroHomepageBlock(main);
    buildHeroBlock(main);
    autoBlockYouTubeEmbeds(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch {
      // continue
    }

    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) {
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
}

async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();

  const loadQuickEdit = async (...args) => {
    const { default: initQuickEdit } = await import('../tools/quick-edit/quick-edit.js');
    initQuickEdit(...args);
  };

  const addSidekickListeners = (sk) => {
    sk.addEventListener('custom:quick-edit', loadQuickEdit);
  };

  const sk = document.querySelector('aem-sidekick');
  if (sk) {
    addSidekickListeners(sk);
  } else {
    document.addEventListener('sidekick-ready', () => {
      addSidekickListeners(document.querySelector('aem-sidekick'));
    }, { once: true });
  }
}

(() => {
  const hasQE = new URL(window.location.href).searchParams.has('quick-edit');
  if (hasQE) import('../tools/quick-edit/quick-edit.js').then((mod) => mod.default());
})();

function loadDelayed() {
  window.setTimeout(() => import('./delayed.js'), 3000);
}

export async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();

  if (/\.(stage-ue|ue)\.da\.live$/.test(window.location.hostname)) {
    await import(`${window.hlx.codeBasePath}/ue/scripts/ue.js`).then(({ default: ueSetup }) => ueSetup());
  }
}

loadPage();

(async function loadDaPreview() {
  if (!new URL(window.location.href).searchParams.get('dapreview')) return;
  import('https://da.live/scripts/dapreview.js').then(({ default: daPreview }) => daPreview(loadPage));
}());

(async function loadDaFeatures() {
  const { searchParams } = new URL(window.location.href);

  if (searchParams.get('dapreview')) {
    import('https://da.live/scripts/dapreview.js')
      .then(({ default: daPreview }) => daPreview(loadPage));
  }
  if (searchParams.get('daexperiment')) {
    import('https://da.live/nx/public/plugins/exp/exp.js');
  }
}());