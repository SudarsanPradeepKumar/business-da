/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-product
 * Base block: cards
 * Source: https://www.business.att.com/
 * Selector: main#baem-container .multi-tile-cards.aem-GridColumn:nth-of-type(1)
 * Generated: 2026-05-18
 *
 * Source structure:
 * - Section heading: .eyebrow-heading h2.heading-xxl.multi-cta-heading
 * - Section description: .type-base.multi-cta-body p
 * - Card tiles: .tile-card
 *   - Image: .card-img img
 *   - Card heading: h3.heading-md.js-heading-section
 *   - Card description: .tileSubheading p
 *   - Price description: .price-description
 *   - Price amount: .price-amount-qty
 *   - Price disclosure: .price-disclosure
 *   - Legal text: .cardlegal p
 *   - CTA: .cta-container a
 *
 * Target structure (cards block):
 * - One row per card
 * - Cell 1: card image
 * - Cell 2: heading + description + price info + CTA link
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

    // Card heading (h3)
    const heading = card.querySelector('h3.heading-md, h3.js-heading-section, h3');
    if (heading) {
      bodyContent.push(heading);
    }

    // Card description
    const description = card.querySelector('.tileSubheading p, .js-textBody-section p');
    if (description) {
      bodyContent.push(description);
    }

    // Price information - combine into a single paragraph for authoring clarity
    const priceDescription = card.querySelector('.price-description');
    const priceAmount = card.querySelector('.price-amount-qty');
    const priceDisclosure = card.querySelector('.price-disclosure');

    if (priceDescription || priceAmount) {
      const priceP = document.createElement('p');
      const priceParts = [];

      if (priceDescription) {
        priceParts.push(priceDescription.textContent.trim());
      }
      if (priceAmount) {
        // Extract amount and frequency text (e.g. "25 /mo. plus taxes and fees")
        priceParts.push('$' + priceAmount.textContent.trim());
      }
      if (priceDisclosure) {
        priceParts.push(priceDisclosure.textContent.trim());
      }

      priceP.textContent = priceParts.join(' ');
      bodyContent.push(priceP);
    }

    // Legal text (optional)
    const legalText = card.querySelector('.cardlegal p, .type-legal-wysiwyg-editor p');
    if (legalText) {
      const legalP = document.createElement('p');
      const legalEm = document.createElement('em');
      legalEm.textContent = legalText.textContent.trim();
      legalP.appendChild(legalEm);
      bodyContent.push(legalP);
    }

    // CTA link
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

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-product', cells });
  element.replaceWith(block);
}
