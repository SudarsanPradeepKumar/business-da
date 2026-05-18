/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-testimonial
 * Base block: cards
 * Source: https://www.business.att.com/
 * Selector: .multi-tile-cards.aem-GridColumn:nth-of-type(2)
 * Generated: 2026-05-18
 *
 * Source structure:
 * - Section heading: .eyebrow-heading h2.heading-xxl.multi-cta-heading
 * - Section description: .type-base.multi-cta-body p
 * - Card tiles: .tile-card
 *   - Image: .card-img img
 *   - Eyebrow (industry): p.type-eyebrow-md.eyebrow-text
 *   - Heading (quote): h3.heading-md.js-heading-section
 *   - Description: .tileSubheading p / .js-textBody-section p
 *   - Attribution/legal: .cardlegal p / .type-legal-wysiwyg-editor p
 *   - CTA: .cta-container a
 *
 * Target structure (cards block):
 * - One row per card
 * - Cell 1: card image
 * - Cell 2: eyebrow + testimonial quote heading + description + attribution + CTA link
 */
export default function parse(element, { document }) {
  // Extract all tile cards from the multi-tile-cards container
  const tileCards = Array.from(element.querySelectorAll('.tile-card'));

  // Build cells array - one row per card
  const cells = [];

  tileCards.forEach((card) => {
    // Cell 1: Card image
    const image = card.querySelector('.card-img img, img');

    // Cell 2: Card body content
    const bodyContent = [];

    // Eyebrow text (industry category like "Retail", "Real estate")
    const eyebrow = card.querySelector('p.type-eyebrow-md, p.eyebrow-text, .js-eyeBrow-section');
    if (eyebrow) {
      bodyContent.push(eyebrow);
    }

    // Testimonial quote heading (h3)
    const heading = card.querySelector('h3.heading-md, h3.js-heading-section, h3');
    if (heading) {
      bodyContent.push(heading);
    }

    // Card description
    const description = card.querySelector('.tileSubheading p, .js-textBody-section p');
    if (description) {
      bodyContent.push(description);
    }

    // Attribution/legal text (e.g., "Kara Brinley, Karadise Boutique Owner")
    const legalText = card.querySelector('.cardlegal p, .type-legal-wysiwyg-editor p');
    if (legalText) {
      const legalP = document.createElement('p');
      const legalEm = document.createElement('em');
      legalEm.textContent = legalText.textContent.trim();
      legalP.appendChild(legalEm);
      bodyContent.push(legalP);
    }

    // CTA link (e.g., "Read the full story")
    const ctaLink = card.querySelector('.cta-container a, a.tile-anchor, a.btn-primary');
    if (ctaLink) {
      bodyContent.push(ctaLink);
    }

    // Build the row: [image cell, body cell]
    if (image && bodyContent.length > 0) {
      cells.push([image, bodyContent]);
    } else if (bodyContent.length > 0) {
      cells.push([bodyContent]);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-testimonial', cells });
  element.replaceWith(block);
}
