import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const isDesktop = window.matchMedia('(min-width: 900px)');

function closeAllMegaMenus(nav) {
  nav.querySelectorAll('.nav-mega-menu').forEach((menu) => {
    menu.setAttribute('aria-hidden', 'true');
  });
  nav.querySelectorAll('.nav-sections .nav-drop').forEach((item) => {
    item.setAttribute('aria-expanded', 'false');
  });
  nav.querySelectorAll('.nav-sections .nav-drop-trigger').forEach((trigger) => {
    trigger.setAttribute('aria-expanded', 'false');
  });
}

function toggleMegaMenu(nav, index) {
  const menus = nav.querySelectorAll('.nav-mega-menu');
  const drops = nav.querySelectorAll('.nav-sections .nav-drop');
  const triggers = nav.querySelectorAll('.nav-sections .nav-drop-trigger');
  const menu = menus[index];
  if (!menu) return;

  const isOpen = menu.getAttribute('aria-hidden') === 'false';
  closeAllMegaMenus(nav);

  if (!isOpen) {
    menu.setAttribute('aria-hidden', 'false');
    if (drops[index]) drops[index].setAttribute('aria-expanded', 'true');
    if (triggers[index]) triggers[index].setAttribute('aria-expanded', 'true');
  }
}

function toggleMobileMenu(nav) {
  const expanded = nav.getAttribute('aria-expanded') === 'true';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  document.body.style.overflowY = expanded ? '' : 'hidden';
  const btn = nav.querySelector('.nav-hamburger button');
  btn.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
}

function buildMegaMenu(categoryItems, headingText) {
  const wrapper = document.createElement('div');
  wrapper.className = 'nav-mega-menu';
  wrapper.setAttribute('aria-hidden', 'true');

  const heading = document.createElement('h3');
  heading.className = 'nav-mega-heading';
  heading.textContent = headingText;
  wrapper.append(heading);

  const grid = document.createElement('div');
  grid.className = 'nav-mega-grid';

  categoryItems.forEach((cat) => {
    const catLink = cat.querySelector(':scope > a') || cat.querySelector(':scope > p > a');
    const subItems = cat.querySelectorAll(':scope > ul > li');

    if (!catLink) return;

    const card = document.createElement('div');
    card.className = 'nav-mega-category';

    const catTitle = document.createElement('a');
    catTitle.href = catLink.href;
    catTitle.className = 'nav-mega-category-title';
    catTitle.textContent = catLink.textContent.trim();
    card.append(catTitle);

    if (subItems.length > 0) {
      const subList = document.createElement('ul');
      subList.className = 'nav-mega-category-links';
      subItems.forEach((sub) => {
        const li = document.createElement('li');
        const link = sub.querySelector('a');
        if (link) {
          const a = document.createElement('a');
          a.href = link.href;
          a.textContent = link.textContent.trim();
          li.append(a);
        } else {
          li.textContent = sub.textContent.trim();
        }
        subList.append(li);
      });
      card.append(subList);
    }

    grid.append(card);
  });

  wrapper.append(grid);
  return wrapper;
}

function buildSegmentBar(toolsSection) {
  const bar = document.createElement('div');
  bar.className = 'nav-segment-bar';

  const container = document.createElement('div');
  container.className = 'nav-segment-container';

  const leftLinks = document.createElement('div');
  leftLinks.className = 'nav-segment-left';

  const rightLinks = document.createElement('div');
  rightLinks.className = 'nav-segment-right';

  const links = toolsSection.querySelectorAll('a');
  links.forEach((link) => {
    const text = link.textContent.trim();
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = text;

    if (text === 'Personal' || text === 'Business') {
      if (text === 'Business') a.classList.add('active');
      leftLinks.append(a);
    } else if (text === 'Support' || text === 'Contact Sales') {
      rightLinks.append(a);
    }
  });

  container.append(leftLinks);
  container.append(rightLinks);
  bar.append(container);
  return bar;
}

function buildSearch() {
  const searchWrapper = document.createElement('div');
  searchWrapper.className = 'nav-search';

  const form = document.createElement('form');
  form.className = 'nav-search-form';
  form.setAttribute('role', 'search');

  const input = document.createElement('input');
  input.type = 'search';
  input.placeholder = 'Search';
  input.className = 'nav-search-input';
  input.setAttribute('aria-label', 'Search');

  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'nav-search-button';
  button.setAttribute('aria-label', 'Submit search');
  button.innerHTML = '<span class="icon icon-search"></span>';

  form.append(input);
  form.append(button);
  searchWrapper.append(form);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (query) {
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
  });

  return searchWrapper;
}

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  if (!fragment) return;

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');

  // Get the section divs from fragment
  const sections = [...fragment.querySelectorAll(':scope .section')];
  sections.forEach((section) => nav.append(section));

  const sectionClasses = ['brand', 'sections', 'tools'];
  const sectionDivs = nav.querySelectorAll(':scope > .section');
  sectionDivs.forEach((section, i) => {
    if (sectionClasses[i]) section.classList.add(`nav-${sectionClasses[i]}`);
  });

  // Brand section
  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    navBrand.querySelectorAll('.button').forEach((btn) => {
      btn.className = '';
      const container = btn.closest('.button-container');
      if (container) container.className = '';
    });
    const img = navBrand.querySelector('img');
    if (img) {
      img.className = 'nav-brand-logo';
      img.alt = img.alt || 'AT&T Business';
    }
  }

  // Sections - build mega menus
  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    // Remove button classes from links
    navSections.querySelectorAll('.button').forEach((btn) => {
      btn.className = '';
      const container = btn.closest('.button-container');
      if (container) container.className = '';
    });

    const topLevelItems = navSections.querySelectorAll('.default-content-wrapper > ul > li');
    const megaMenuContainer = document.createElement('div');
    megaMenuContainer.className = 'nav-mega-container';

    topLevelItems.forEach((item, index) => {
      const strong = item.querySelector(':scope > strong') || item.querySelector(':scope > p > strong');
      const subList = item.querySelector(':scope > ul');

      if (strong && subList) {
        item.classList.add('nav-drop');
        item.setAttribute('aria-expanded', 'false');

        const headingText = strong.textContent.trim();
        const categoryItems = [...subList.querySelectorAll(':scope > li')];

        // Build mega menu for desktop
        const megaMenu = buildMegaMenu(categoryItems, headingText);
        megaMenu.dataset.index = index;
        megaMenuContainer.append(megaMenu);

        // Build mobile submenu
        const mobileSubmenu = document.createElement('div');
        mobileSubmenu.className = 'nav-mobile-submenu';
        mobileSubmenu.setAttribute('aria-hidden', 'true');
        mobileSubmenu.append(subList.cloneNode(true));

        // Replace item content with trigger button
        const trigger = document.createElement('button');
        trigger.className = 'nav-drop-trigger';
        trigger.textContent = headingText;
        trigger.setAttribute('aria-expanded', 'false');

        item.textContent = '';
        item.append(trigger);
        item.append(mobileSubmenu);

        trigger.addEventListener('click', () => {
          if (isDesktop.matches) {
            toggleMegaMenu(nav, index);
          } else {
            const isOpen = mobileSubmenu.getAttribute('aria-hidden') === 'false';
            navSections.querySelectorAll('.nav-mobile-submenu').forEach((m) => m.setAttribute('aria-hidden', 'true'));
            navSections.querySelectorAll('.nav-drop-trigger').forEach((t) => t.setAttribute('aria-expanded', 'false'));
            if (!isOpen) {
              mobileSubmenu.setAttribute('aria-hidden', 'false');
              trigger.setAttribute('aria-expanded', 'true');
            }
          }
        });
      }
    });

    navSections.append(megaMenuContainer);
  }

  // Tools section - build segment bar and account
  const navTools = nav.querySelector('.nav-tools');
  let segmentBar = null;
  if (navTools) {
    segmentBar = buildSegmentBar(navTools);
    navTools.textContent = '';
    navTools.append(buildSearch());

    const accountLink = document.createElement('a');
    accountLink.href = '/login-portal';
    accountLink.className = 'nav-account-btn';
    accountLink.textContent = 'Account sign in';
    navTools.append(accountLink);
  }

  // Hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
    <span class="nav-hamburger-icon"></span>
  </button>`;
  hamburger.addEventListener('click', () => toggleMobileMenu(nav));
  nav.prepend(hamburger);

  // Close mega menus on escape
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      closeAllMegaMenus(nav);
      if (!isDesktop.matches) {
        nav.setAttribute('aria-expanded', 'false');
        document.body.style.overflowY = '';
      }
    }
  });

  // Close mega menus on click outside
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) closeAllMegaMenus(nav);
  });

  // Responsive handling
  isDesktop.addEventListener('change', () => {
    closeAllMegaMenus(nav);
    if (isDesktop.matches) {
      nav.setAttribute('aria-expanded', 'false');
      document.body.style.overflowY = '';
    }
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  if (segmentBar) navWrapper.prepend(segmentBar);
  navWrapper.append(nav);
  block.append(navWrapper);
}
