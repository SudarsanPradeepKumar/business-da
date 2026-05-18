/* eslint-disable */
/* global WebImporter */

/**
 * Parser for form
 * Base block: form
 * Source: https://www.business.att.com/
 * Selector: .rai-form.aem-GridColumn
 * Generated: 2026-05-18
 *
 * Source structure:
 * - Header section: .RAIHeader
 *   - Heading: .eyebrow-heading h2.heading-xxl
 *   - Description: .type-base p
 *   - Legal text: .type-legal p
 * - Form: form#bs-rai-leadform
 *   - Fields: first name, last name, email, phone, company, product interest, comments
 *   - Hidden fields for tracking/analytics
 *
 * The EDS form block expects a link to a form definition JSON.
 * This parser creates the form block table with a placeholder link
 * that references the form path to be created during form migration.
 */
export default function parse(element, { document }) {
  // Extract the form element to determine form identity
  const formEl = element.querySelector('form#bs-rai-leadform, form.bs-rai-leadform, form');

  // Build the form definition link
  // EDS form blocks reference a form JSON definition by path
  const formLink = document.createElement('a');
  const formPath = '/forms/rai-lead-form';
  formLink.href = formPath;
  formLink.textContent = formPath;

  // Build cells: single row with the form link
  const cells = [
    [formLink],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'form', cells });
  element.replaceWith(block);
}
