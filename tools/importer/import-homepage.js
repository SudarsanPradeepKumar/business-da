/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroHomepageParser from './parsers/hero-homepage.js';
import cardsProductParser from './parsers/cards-product.js';
import cardsPromoParser from './parsers/cards-promo.js';
import cardsValuepropParser from './parsers/cards-valueprop.js';
import columnsOfferParser from './parsers/columns-offer.js';
import heroDarkParser from './parsers/hero-dark.js';
import carouselIndustryParser from './parsers/carousel-industry.js';
import cardsTestimonialParser from './parsers/cards-testimonial.js';
import formParser from './parsers/form.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/att-business-cleanup.js';
import sectionsTransformer from './transformers/att-business-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-homepage': heroHomepageParser,
  'cards-product': cardsProductParser,
  'cards-promo': cardsPromoParser,
  'cards-valueprop': cardsValuepropParser,
  'columns-offer': columnsOfferParser,
  'hero-dark': heroDarkParser,
  'carousel-industry': carouselIndustryParser,
  'cards-testimonial': cardsTestimonialParser,
  'form': formParser,
};

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'AT&T Business homepage with hero banner, product/service offerings, and promotional content',
  urls: ['https://www.business.att.com/'],
  blocks: [
    {
      name: 'hero-homepage',
      instances: ['main#baem-container .root > .aem-Grid > .hero.aem-GridColumn:nth-child(1)'],
    },
    {
      name: 'cards-product',
      instances: ['main#baem-container .multi-tile-cards.aem-GridColumn:nth-of-type(1)'],
    },
    {
      name: 'cards-promo',
      instances: ['.flex-cards.aem-GridColumn'],
    },
    {
      name: 'cards-valueprop',
      instances: ['.generic-list-value-prop.aem-GridColumn'],
    },
    {
      name: 'columns-offer',
      instances: ['.offer.aem-GridColumn:nth-of-type(1)', '.offer.aem-GridColumn:nth-of-type(2)', '.link-farm.aem-GridColumn'],
    },
    {
      name: 'hero-dark',
      instances: ['main#baem-container .root > .aem-Grid > .hero.aem-GridColumn:nth-child(2)', 'main#baem-container .root > .aem-Grid > .hero.aem-GridColumn:nth-child(3)'],
    },
    {
      name: 'carousel-industry',
      instances: ['.story-stack.aem-GridColumn'],
    },
    {
      name: 'cards-testimonial',
      instances: ['.multi-tile-cards.aem-GridColumn:nth-of-type(2)'],
    },
    {
      name: 'form',
      instances: ['.rai-form.aem-GridColumn'],
    },
  ],
  sections: [
    { id: 'section-1', name: 'Hero', selector: 'main#baem-container .root > .aem-Grid > .hero.aem-GridColumn:nth-child(1)', style: null, blocks: ['hero-homepage'], defaultContent: [] },
    { id: 'section-2', name: 'Products', selector: 'main#baem-container .multi-tile-cards.aem-GridColumn:nth-of-type(1)', style: null, blocks: ['cards-product'], defaultContent: ['.multi-tile-cards .eyebrow-heading h2', '.multi-tile-cards .type-base'] },
    { id: 'section-3', name: 'Promos', selector: '.flex-cards.aem-GridColumn', style: null, blocks: ['cards-promo'], defaultContent: ['.flex-cards h2'] },
    { id: 'section-4', name: 'Value Props', selector: '.generic-list-value-prop.aem-GridColumn', style: null, blocks: ['cards-valueprop'], defaultContent: ['.generic-list-value-prop h2', '.generic-list-value-prop .type-base'] },
    { id: 'section-5', name: 'JD Power Award', selector: '.offer.aem-GridColumn:nth-of-type(1)', style: 'grey', blocks: ['columns-offer'], defaultContent: [] },
    { id: 'section-6', name: 'Dark Hero - Connectivity', selector: 'main#baem-container .root > .aem-Grid > .hero.aem-GridColumn:nth-child(2)', style: null, blocks: ['hero-dark'], defaultContent: [] },
    { id: 'section-7', name: 'Micro Banner', selector: '.micro-banner.aem-GridColumn', style: 'accent', blocks: [], defaultContent: ['.micro-banner h2, .micro-banner .type-base, .micro-banner .type-legal'] },
    { id: 'section-8', name: 'Switch to ATT', selector: '.offer.aem-GridColumn:nth-of-type(2)', style: null, blocks: ['columns-offer'], defaultContent: [] },
    { id: 'section-9', name: 'Industry Carousel', selector: '.story-stack.aem-GridColumn', style: null, blocks: ['carousel-industry'], defaultContent: ['.story-stack h2', '.story-stack .type-base'] },
    { id: 'section-10', name: 'Dark Hero - Guarantee', selector: 'main#baem-container .root > .aem-Grid > .hero.aem-GridColumn:nth-child(3)', style: null, blocks: ['hero-dark'], defaultContent: [] },
    { id: 'section-11', name: 'Testimonials', selector: '.multi-tile-cards.aem-GridColumn:nth-of-type(2)', style: null, blocks: ['cards-testimonial'], defaultContent: ['.multi-tile-cards:nth-of-type(2) h2', '.multi-tile-cards:nth-of-type(2) .type-base'] },
    { id: 'section-12', name: 'Contact Form', selector: '.rai-form.aem-GridColumn', style: 'grey', blocks: ['form'], defaultContent: ['.rai-form .RAIHeader h2', '.rai-form .RAIHeader .type-base', '.rai-form .RAIHeader .type-legal'] },
    { id: 'section-13', name: 'Link Farm', selector: '.link-farm.aem-GridColumn', style: 'grey', blocks: ['columns-offer'], defaultContent: ['.link-farm h2'] },
  ],
};

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
        });
      });
    });
  });
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. Execute beforeTransform transformers (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers
    pageBlocks.forEach((block) => {
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      }
    });

    // 4. Execute afterTransform transformers (final cleanup + section breaks)
    executeTransformers('afterTransform', main, payload);

    // 5. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, '') || '/index',
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
