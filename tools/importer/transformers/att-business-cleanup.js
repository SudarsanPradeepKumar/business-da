/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: AT&T Business site-wide cleanup.
 * Removes non-authorable content from the DOM before and after block parsing.
 * All selectors sourced from captured DOM in migration-work/cleaned.html.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Cookie disclaimer banner (line 3538 in cleaned.html: <div class="cookie-disclaimer-component">)
    // Modal/popup containers that may block parsing (line 3556-3558)
    // Chat widget - Nuance messaging frame (line 3578: <div id="nuanMessagingFrame">)
    WebImporter.DOMUtils.remove(element, [
      '.cookie-disclaimer-component',
      '.att-modal-container',
      '.modal-popup-container',
      '#nuanMessagingFrame',
      '#inqTestDiv',
      '#inqDivResizeCorner',
      '#inqResizeBox',
      '#inqTitleBar',
      '#injectTargetScreenReader',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Global navigation header (line 5: <div class="global-navigation parbase aem-GridColumn">)
    // Footer section (line 2961-2975: .footer-page-css-includes, .footer)
    // Cloudservice testing/targeting (line 3553: <div class="cloudservice testandtarget">)
    // GPC privacy banner container (line 3563: <div id="gpc-banner-container">)
    // Tracking beacons and pixels (lines 3567-3568)
    // Skip-to-content link (line 10: <a class="skip-to-content-link">)
    WebImporter.DOMUtils.remove(element, [
      '.global-navigation.parbase',
      '.footer-page-css-includes',
      '.footer.aem-GridColumn',
      '.cloudservice.testandtarget',
      '#gpc-banner-container',
      '#batBeacon417724488847',
      '#db_lr_pixel_ad',
      '.skip-to-content-link',
      'iframe',
      'noscript',
      'link',
    ]);

    // Remove tracking attributes found in captured DOM (att-track classes, data-* attributes)
    const trackedElements = element.querySelectorAll('[data-track]');
    trackedElements.forEach((el) => {
      el.removeAttribute('data-track');
    });
  }
}
