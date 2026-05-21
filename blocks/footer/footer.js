import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  if (!fragment) return;

  block.textContent = '';
  const footer = document.createElement('div');
  footer.className = 'footer-content';

  const sections = [...fragment.querySelectorAll(':scope .section')];

  // Section 1: Logo + Social links (cyan bar)
  if (sections[0]) {
    const topBar = document.createElement('div');
    topBar.className = 'footer-top-bar';

    const container = document.createElement('div');
    container.className = 'footer-top-container';

    const logoLink = sections[0].querySelector('a');
    if (logoLink) {
      const logoWrapper = document.createElement('div');
      logoWrapper.className = 'footer-logo';
      const a = document.createElement('a');
      a.href = logoLink.href;
      const img = sections[0].querySelector('img');
      if (img) {
        const newImg = document.createElement('img');
        newImg.src = img.src;
        newImg.alt = img.alt || 'AT&T Business';
        a.append(newImg);
      }
      logoWrapper.append(a);
      container.append(logoWrapper);
    }

    const socialLinks = sections[0].querySelectorAll('ul a');
    if (socialLinks.length > 0) {
      const socialWrapper = document.createElement('div');
      socialWrapper.className = 'footer-social';
      socialLinks.forEach((link) => {
        const a = document.createElement('a');
        a.href = link.href;
        a.title = link.textContent.trim();
        a.setAttribute('aria-label', link.textContent.trim());
        a.textContent = link.textContent.trim();
        socialWrapper.append(a);
      });
      container.append(socialWrapper);
    }

    topBar.append(container);
    footer.append(topBar);
  }

  // Section 2: Utility links
  if (sections[1]) {
    const utilBar = document.createElement('div');
    utilBar.className = 'footer-utility';

    const container = document.createElement('div');
    container.className = 'footer-utility-container';

    const links = sections[1].querySelectorAll('a');
    links.forEach((link) => {
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.textContent.trim();
      container.append(a);
    });

    utilBar.append(container);
    footer.append(utilBar);
  }

  // Section 3: Legal links + Copyright
  if (sections[2]) {
    const legalBar = document.createElement('div');
    legalBar.className = 'footer-legal';

    const container = document.createElement('div');
    container.className = 'footer-legal-container';

    const legalLinks = document.createElement('div');
    legalLinks.className = 'footer-legal-links';
    const links = sections[2].querySelectorAll('ul a');
    links.forEach((link) => {
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.textContent.trim();
      legalLinks.append(a);
    });
    container.append(legalLinks);

    const copyrightP = sections[2].querySelector('p:last-of-type');
    if (copyrightP && !copyrightP.querySelector('a')) {
      const copyright = document.createElement('p');
      copyright.className = 'footer-copyright';
      copyright.textContent = copyrightP.textContent.trim();
      container.append(copyright);
    } else {
      const allPs = sections[2].querySelectorAll('p');
      allPs.forEach((p) => {
        if (!p.querySelector('a') && p.textContent.includes('©')) {
          const copyright = document.createElement('p');
          copyright.className = 'footer-copyright';
          copyright.textContent = p.textContent.trim();
          container.append(copyright);
        }
      });
    }

    legalBar.append(container);
    footer.append(legalBar);
  }

  block.append(footer);
}
