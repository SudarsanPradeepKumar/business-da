/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-dark variant.
 * Base block: hero
 * Source: https://www.business.att.com/
 * Generated: 2026-05-18
 *
 * Structure (from block decorate logic):
 *   Row 1: Background image (optional - block adds 'no-image' class if absent)
 *   Row 2: Content cell (eyebrow, heading, description, CTAs)
 *
 * Selectors validated against: migration-work/block-context/hero-dark/source.html
 *   - Background image: .bg-art .bg-hero-panel img
 *   - Eyebrow: [class*="eyebrow-xxxl"]
 *   - Heading: h2[class*="heading-xxl"]
 *   - Description: .type-base.wysiwyg-editor
 *   - CTAs: .cta-container a
 */
export default function parse(element, { document }) {
  // Extract background image from the bg-art / bg-hero-panel area
  const bgImage = element.querySelector('.bg-art .bg-hero-panel img, .bg-art img, .hero-wrapper img:first-of-type');

  // Extract eyebrow text
  const eyebrow = element.querySelector('[class*="eyebrow-xxxl"], [class*="eyebrow"]');

  // Extract heading (h2 with heading class, fallback to any h1/h2/h3)
  const heading = element.querySelector('h2[class*="heading-xxl"], h2[class*="heading"], h1, h2, h3');

  // Extract description paragraph
  const description = element.querySelector('.type-base.wysiwyg-editor, .type-base, [class*="wysiwyg-editor"]');

  // Extract CTA links from cta-container
  const ctaLinks = Array.from(element.querySelectorAll('.cta-container a, a.btn-primary, a.btn-secondary'));

  // Build cells array matching the hero-dark block structure
  const cells = [];

  // Row 1: Background image (if present)
  if (bgImage) {
    cells.push([bgImage]);
  }

  // Row 2: Content cell - eyebrow, heading, description, CTAs
  const contentCell = [];
  if (eyebrow) {
    // Create a paragraph for the eyebrow text to preserve it as default content
    const eyebrowEl = document.createElement('p');
    eyebrowEl.textContent = eyebrow.textContent.trim();
    contentCell.push(eyebrowEl);
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
  cells.push(contentCell);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-dark', cells });
  element.replaceWith(block);
}
