/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-promo
 * Base block: cards
 * Source: https://www.business.att.com/
 * Generated: 2026-05-18
 *
 * Extracts promotional cards from the .flex-cards component.
 * Each card has: image, eyebrow, heading, description, legal text, and CTA.
 * Output: one row per card with [image, content] cells.
 */
export default function parse(element, { document }) {
  // Extract all card wrappers from the flex-cards component
  const cardWrappers = element.querySelectorAll('.card-wrapper');
  const cells = [];

  cardWrappers.forEach((cardWrapper) => {
    const card = cardWrapper.querySelector('.card.flex-card');
    if (!card) return;

    // Extract image
    const image = card.querySelector(':scope > img');

    // Build content cell
    const contentCell = [];

    // Extract eyebrow text
    const eyebrow = card.querySelector('[class*="eyebrow-lg"]');
    if (eyebrow) {
      const eyebrowEl = document.createElement('p');
      eyebrowEl.textContent = eyebrow.textContent.trim();
      contentCell.push(eyebrowEl);
    }

    // Extract heading (h3)
    const heading = card.querySelector('h3');
    if (heading) {
      contentCell.push(heading);
    }

    // Extract description from .type-base
    const description = card.querySelector('.type-base p');
    if (description) {
      contentCell.push(description);
    }

    // Extract legal text from .type-legal
    const legal = card.querySelector('.type-legal p');
    if (legal) {
      contentCell.push(legal);
    }

    // Extract CTA links
    const ctaLinks = card.querySelectorAll('.flexCardItemCta a');
    ctaLinks.forEach((link) => {
      contentCell.push(link);
    });

    // Build row: [image, content]
    if (image && contentCell.length > 0) {
      cells.push([image, contentCell]);
    } else if (contentCell.length > 0) {
      cells.push([contentCell]);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-promo', cells });
  element.replaceWith(block);
}
