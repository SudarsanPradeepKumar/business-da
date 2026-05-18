/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-valueprop
 * Base block: cards
 * Source: https://www.business.att.com/
 * Selector: .generic-list-value-prop.aem-GridColumn
 * Generated: 2026-05-18
 *
 * Extracts value proposition cards from the generic-list-value-prop component.
 * Each card has: icon image, heading (h4), description text, and CTA link.
 * Output: standard cards table with one row per card (image cell + body cell).
 */
export default function parse(element, { document }) {
  // Find all individual value prop card items
  const cards = element.querySelectorAll('.generic-list-icon-vp');

  const cells = [];

  cards.forEach((card) => {
    // Extract icon image from the span wrapper
    const img = card.querySelector('span.height-xl-all img, span[class*="height-xl"] img, img');

    // Extract heading (h4 in source, but fallback to h3/h5)
    const heading = card.querySelector('h4, h3, h5, [class*="heading"]');

    // Extract description text from .description div or fallback
    const descriptionEl = card.querySelector('.description, .type-sm, div[class*="description"]');

    // Extract CTA link
    const ctaLink = card.querySelector('a.primary-cta, a[class*="cta"], a');

    // Build image cell
    const imageCell = [];
    if (img) {
      imageCell.push(img);
    }

    // Build body cell with heading, description, and CTA
    const bodyCell = [];
    if (heading) {
      bodyCell.push(heading);
    }
    if (descriptionEl) {
      bodyCell.push(descriptionEl);
    }
    if (ctaLink) {
      bodyCell.push(ctaLink);
    }

    // Each card is a row with image cell and body cell
    if (imageCell.length > 0 || bodyCell.length > 0) {
      cells.push([imageCell, bodyCell]);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-valueprop', cells });
  element.replaceWith(block);
}
