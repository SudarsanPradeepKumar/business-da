/* eslint-disable */
/* global WebImporter */

/**
 * Parser for carousel-industry
 * Base block: carousel
 * Source: https://www.business.att.com/
 * Generated: 2026-05-18
 *
 * Source structure: .story-stack with a master header (heading + description)
 * and multiple .swiper-slide items, each containing an icon image, a background
 * image, a heading (.heading-sm), and a description (.story-description p).
 *
 * Target structure: Carousel block with one row per slide.
 * Each row has two cells: [image, content (heading + description)].
 */
export default function parse(element, { document }) {
  // Extract all carousel slides
  const slides = element.querySelectorAll('.swiper-slide');

  const cells = [];

  slides.forEach((slide) => {
    // Extract the main slide image (swiper-image, the larger background image)
    const slideImage = slide.querySelector('img.swiper-image');

    // Extract the heading from the slide content
    const heading = slide.querySelector('.heading-sm, .heading-sm-storyStack');

    // Extract the description paragraph from the slide content
    const description = slide.querySelector('.story-description p, .type-base.wysiwyg-editor p');

    // Build the image cell
    const imageCell = [];
    if (slideImage) {
      imageCell.push(slideImage);
    }

    // Build the content cell with heading and description
    const contentCell = [];
    if (heading) {
      // Create an h3 element to preserve heading semantics
      const h3 = document.createElement('h3');
      h3.textContent = heading.textContent.trim();
      contentCell.push(h3);
    }
    if (description) {
      const p = document.createElement('p');
      p.textContent = description.textContent.trim();
      contentCell.push(p);
    }

    // Only add the row if we have meaningful content
    if (imageCell.length > 0 || contentCell.length > 0) {
      cells.push([imageCell, contentCell]);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-industry', cells });
  element.replaceWith(block);
}
