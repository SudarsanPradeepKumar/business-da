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
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
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
 * True only when a node is a standalone video URL paragraph.
 * Good:
 * <p><a href="https://www.youtube.com/watch?v=abc">https://www.youtube.com/watch?v=abc</a></p>
 *
 * Not good:
 * <p>You can view our playlist on <a href="...">YouTube</a>.</p>
 * @param {Element} node
 * @returns {boolean}
 */
function isStandaloneVideoParagraph(node) {
  if (!node || node.tagName !== 'P') return false;

  const links = node.querySelectorAll('a[href]');
  if (links.length !== 1) return false;

  const link = links[0];
  const href = link.getAttribute('href');
  if (!href || !isYouTubeVideoUrl(href)) return false;

  const paragraphText = node.textContent.trim();
  const linkText = link.textContent.trim();

  return paragraphText === linkText;
}

/**
 * Returns true only for the related content heading.
 * @param {Element} node
 * @returns {boolean}
 */
function isRelatedContentHeading(node) {
  return node
    && /^H[1-6]$/.test(node.tagName)
    && node.textContent.trim().toLowerCase() === 'related content';
}

/**
 * Create a top-level semantic section from nodes.
 * @param {Element[]} nodes
 * @returns {HTMLDivElement}
 */
function createSectionFromNodes(nodes) {
  const section = document.createElement('div');
  nodes.forEach((node) => section.append(node));
  return section;
}

/**
 * Splits mixed sections around standalone video paragraphs so the video
 * can be autoblocked without affecting prose before/after it.
 * @param {Element} main
 */
function splitSectionsAroundVideoParagraphs(main) {
  const sections = [...main.querySelectorAll(':scope > div')];

  sections.forEach((section) => {
    const children = [...section.children];
    const hasStandaloneVideo = children.some((child) => isStandaloneVideoParagraph(child));
    if (!hasStandaloneVideo) return;

    const replacementSections = [];
    let buffer = [];

    children.forEach((child) => {
      if (isStandaloneVideoParagraph(child)) {
        if (buffer.length) {
          replacementSections.push(createSectionFromNodes(buffer));
          buffer = [];
        }
        replacementSections.push(createSectionFromNodes([child]));
      } else {
        buffer.push(child);
      }
    });

    if (buffer.length) {
      replacementSections.push(createSectionFromNodes(buffer));
    }

    section.replaceWith(...replacementSections);
  });
}

/**
 * Splits mixed sections around the "Related content" heading so the sidebar
 * content can be isolated from the article body.
 * @param {Element} main
 */
function splitSectionsAroundRelatedContent(main) {
  const sections = [...main.querySelectorAll(':scope > div')];

  sections.forEach((section) => {
    const children = [...section.children];
    const headingIndex = children.findIndex((child) => isRelatedContentHeading(child));
    if (headingIndex === -1) return;

    const before = children.slice(0, headingIndex);
    const after = children.slice(headingIndex);

    const replacements = [];
    if (before.length) replacements.push(createSectionFromNodes(before));

    if (after.length) {
      const relatedSection = createSectionFromNodes(after);
      relatedSection.dataset.relatedContent = 'true';
      replacements.push(relatedSection);
    }

    section.replaceWith(...replacements);
  });
}

/**
 * Returns the href only when the section is a standalone video-link paragraph.
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

  if (paragraphText !== linkText) return null;

  return href;
}

/**
 * Converts plain standalone YouTube video-link sections into a real embed block
 * before decorateBlocks(main) runs.
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
    section.dataset.videoEmbed = 'true';
    section.innerHTML = '';
    section.append(embedBlock);
  });
}

/**
 * Builds a two-column support-article layout in the live DOM after sections
 * are decorated.
 * Structure:
 * - first section = intro
 * - middle sections = article main
 * - related-content section = sidebar
 * @param {Element} main
 */
function buildSupportArticleLayout(main) {
  const topSections = [...main.querySelectorAll(':scope > .section')];
  if (topSections.length < 2) return;
  if (main.querySelector(':scope > .support-article-layout')) return;

  const introSection = topSections[0];
  const relatedSection = topSections.find((section) => section.dataset.relatedContent === 'true'
    || section.querySelector('h2')?.textContent.trim().toLowerCase() === 'related content');

  if (!relatedSection) return;

  const contentSections = topSections.filter(
    (section) => section !== introSection && section !== relatedSection,
  );

  if (!contentSections.length) return;

  introSection.classList.add('support-article-intro');

  const layout = document.createElement('div');
  layout.className = 'support-article-layout';

  const mainCol = document.createElement('div');
  mainCol.className = 'support-article-main';

  const sidebar = document.createElement('aside');
  sidebar.className = 'support-article-sidebar';

  contentSections.forEach((section) => mainCol.append(section));
  sidebar.append(relatedSection);

  layout.append(mainCol, sidebar);
  introSection.insertAdjacentElement('afterend', layout);
}

function buildAutoBlocks(main) {
  try {
    if (!isUniversalEditor()) {
      // auto load `*/fragments/*` references
      const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
      if (fragments.length > 0) {
        // eslint-disable-next-line import/no-cycle
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

    splitSectionsAroundVideoParagraphs(main);
    splitSectionsAroundRelatedContent(main);
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

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
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

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
  buildSupportArticleLayout(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
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
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
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
    // eslint-disable-next-line import/no-cycle
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
    // wait for sidekick to be loaded
    document.addEventListener('sidekick-ready', () => {
      addSidekickListeners(document.querySelector('aem-sidekick'));
    }, { once: true });
  }
}

(() => {
  const hasQE = new URL(window.location.href).searchParams.has('quick-edit');
  if (hasQE) import('../tools/quick-edit/quick-edit.js').then((mod) => mod.default());
})();

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
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

(async function loadDa() {
  if (!new URL(window.location.href).searchParams.get('dapreview')) return;
  // eslint-disable-next-line import/no-unresolved
  import('https://da.live/scripts/dapreview.js').then(({ default: daPreview }) => daPreview(loadPage));
}());

(async function loadDa() {
  const { searchParams } = new URL(window.location.href);

  /* eslint-disable import/no-unresolved */
  if (searchParams.get('dapreview')) {
    import('https://da.live/scripts/dapreview.js')
      .then(({ default: daPreview }) => daPreview(loadPage));
  }
  if (searchParams.get('daexperiment')) {
    import('https://da.live/nx/public/plugins/exp/exp.js');
  }
}());
