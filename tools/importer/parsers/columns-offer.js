/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-offer
 * Base block: columns
 * Source: https://www.business.att.com/
 * Generated: 2026-05-18T00:00:00Z
 *
 * Handles two source variations:
 * 1. Offer layout (.offer): two-column with text content + image
 * 2. Link-farm layout (.link-farm): multi-column with heading + link lists
 */
export default function parse(element, { document }) {
  const cells = [];

  // Detect which variation we are dealing with
  const isLinkFarm = element.classList.contains('link-farm') || !!element.querySelector('.link-farm-main');

  if (isLinkFarm) {
    // Link-farm variation: multiple columns of link lists
    // Extract from desktop view only (avoid duplicate mobile-view content)
    const desktopView = element.querySelector('.desktop-view-and-tablet');
    const source = desktopView || element;
    const linkColumns = source.querySelectorAll('.grid-col-3');

    const columnCells = [];
    linkColumns.forEach((col) => {
      const ul = col.querySelector('ul');
      if (ul) {
        const cellContent = document.createElement('div');
        const links = ul.querySelectorAll('li a');
        const list = document.createElement('ul');
        links.forEach((link) => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = link.href;
          a.textContent = link.textContent.trim();
          li.appendChild(a);
          list.appendChild(li);
        });
        cellContent.appendChild(list);
        columnCells.push(cellContent);
      }
    });

    if (columnCells.length > 0) {
      cells.push(columnCells);
    }
  } else {
    // Offer variation: two-column layout with text + image
    const heading = element.querySelector('h2, h1, h3');
    const description = element.querySelector('.type-base p, .wysiwyg-editor p');
    const legalText = element.querySelector('.type-legal-wysiwyg-editor p, .type-legal p');
    const ctaLinks = Array.from(element.querySelectorAll('.cta-container a, .links-container a'));
    const image = element.querySelector('img.imgOffer, .video-content-offer img, .overflow-hidden img');

    // Build text content cell
    const textCell = document.createElement('div');

    if (heading) {
      const h = document.createElement('h2');
      h.textContent = heading.textContent.trim();
      textCell.appendChild(h);
    }

    if (description) {
      const p = document.createElement('p');
      p.textContent = description.textContent.trim();
      textCell.appendChild(p);
    }

    if (legalText) {
      const legal = document.createElement('p');
      legal.innerHTML = legalText.innerHTML;
      textCell.appendChild(legal);
    }

    ctaLinks.forEach((link) => {
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.textContent.trim();
      textCell.appendChild(a);
    });

    // Build image cell
    const imageCell = document.createElement('div');
    if (image) {
      const img = document.createElement('img');
      img.src = image.src;
      img.alt = image.alt || '';
      imageCell.appendChild(img);
    }

    // Single row with two columns: text and image
    cells.push([textCell, imageCell]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-offer', cells });
  element.replaceWith(block);
}
