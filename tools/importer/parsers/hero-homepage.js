/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-homepage
 * Base block: hero
 * Source: https://www.business.att.com/
 * Selector: main#baem-container .root > .aem-Grid > .hero.aem-GridColumn:nth-child(1)
 * Generated: 2026-05-18
 *
 * Source structure:
 * - Background image: .bg-hero-panel img
 * - Eyebrow: .eyebrow-xxl-desktop (text node)
 * - Heading: h1.heading-xxl-desktop
 * - Description: .type-base p
 * - Foreground/mobile image: .hero-panel-image img
 */
export default function parse(element, { document }) {
  // Extract background image (desktop hero background)
  const bgImage = element.querySelector('.bg-hero-panel img, .bg-no-repeat img');

  // Extract foreground/mobile image
  const fgImage = element.querySelector('.hero-panel-image img, .zoomable');

  // Extract eyebrow text
  const eyebrowEl = element.querySelector('[class*="eyebrow-xxl"], [class*="eyebrow"]');

  // Extract heading
  const heading = element.querySelector('h1, h2, [class*="heading-xxl"]');

  // Extract description
  const description = element.querySelector('.type-base p, .wysiwyg-editor p');

  // Extract CTA links (if present)
  const ctaLinks = Array.from(element.querySelectorAll('a.btn, a.cta, a.button, .cta-wrapper a'));

  // Build cells array matching hero block structure
  const cells = [];

  // Row 1: Hero image (use background image if available, fallback to foreground image)
  const heroImage = bgImage || fgImage;
  if (heroImage) {
    cells.push([heroImage]);
  }

  // Row 2: Content cell (eyebrow + heading + description + CTAs)
  const contentCell = [];

  if (eyebrowEl) {
    // Create a paragraph element for the eyebrow text
    const eyebrowText = eyebrowEl.textContent.trim();
    if (eyebrowText) {
      const eyebrowP = document.createElement('p');
      eyebrowP.textContent = eyebrowText;
      contentCell.push(eyebrowP);
    }
  }

  if (heading) {
    contentCell.push(heading);
  }

  if (description) {
    contentCell.push(description);
  }

  if (ctaLinks.length > 0) {
    contentCell.push(...ctaLinks);
  }

  if (contentCell.length > 0) {
    cells.push(contentCell);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-homepage', cells });
  element.replaceWith(block);
}
