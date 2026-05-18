/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: AT&T Business section breaks and section metadata.
 * Inserts <hr> section breaks and Section Metadata blocks based on template sections.
 * Only runs in afterTransform. Processes sections in reverse order.
 * All selectors sourced from page-templates.json and validated against migration-work/cleaned.html.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.afterTransform) {
    const { template } = payload;
    if (!template || !template.sections || template.sections.length < 2) return;

    const { document } = element.ownerDocument ? { document: element.ownerDocument } : { document };

    // Process sections in reverse order to avoid offset issues when inserting elements
    const sections = [...template.sections].reverse();

    sections.forEach((section) => {
      const sectionEl = element.querySelector(section.selector);
      if (!sectionEl) return;

      // Insert Section Metadata block after the section element if style is defined
      if (section.style) {
        const sectionMetadata = WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        sectionEl.after(sectionMetadata);
      }

      // Insert <hr> before the section element (except for the first section)
      if (section.id !== 'section-1') {
        const hr = document.createElement('hr');
        sectionEl.before(hr);
      }
    });
  }
}
