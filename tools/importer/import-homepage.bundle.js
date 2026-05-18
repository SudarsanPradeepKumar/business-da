/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/hero-homepage.js
  function parse(element, { document }) {
    const bgImage = element.querySelector(".bg-hero-panel img, .bg-no-repeat img");
    const fgImage = element.querySelector(".hero-panel-image img, .zoomable");
    const eyebrowEl = element.querySelector('[class*="eyebrow-xxl"], [class*="eyebrow"]');
    const heading = element.querySelector('h1, h2, [class*="heading-xxl"]');
    const description = element.querySelector(".type-base p, .wysiwyg-editor p");
    const ctaLinks = Array.from(element.querySelectorAll("a.btn, a.cta, a.button, .cta-wrapper a"));
    const cells = [];
    const heroImage = bgImage || fgImage;
    if (heroImage) {
      cells.push([heroImage]);
    }
    const contentCell = [];
    if (eyebrowEl) {
      const eyebrowText = eyebrowEl.textContent.trim();
      if (eyebrowText) {
        const eyebrowP = document.createElement("p");
        eyebrowP.textContent = eyebrowText;
        contentCell.push(eyebrowP);
      }
    }
    if (heading) {
      contentCell.push(heading);
    }
    if (description) {
      contentCell.push(description);
    }
    if (ctaLinks.length > 0) {
      contentCell.push(...ctaLinks);
    }
    if (contentCell.length > 0) {
      cells.push(contentCell);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-homepage", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-product.js
  function parse2(element, { document }) {
    const tileCards = Array.from(element.querySelectorAll(".tile-card"));
    const cells = [];
    tileCards.forEach((card) => {
      const image = card.querySelector(".card-img img, img");
      const bodyContent = [];
      const heading = card.querySelector("h3.heading-md, h3.js-heading-section, h3");
      if (heading) {
        bodyContent.push(heading);
      }
      const description = card.querySelector(".tileSubheading p, .js-textBody-section p");
      if (description) {
        bodyContent.push(description);
      }
      const priceDescription = card.querySelector(".price-description");
      const priceAmount = card.querySelector(".price-amount-qty");
      const priceDisclosure = card.querySelector(".price-disclosure");
      if (priceDescription || priceAmount) {
        const priceP = document.createElement("p");
        const priceParts = [];
        if (priceDescription) {
          priceParts.push(priceDescription.textContent.trim());
        }
        if (priceAmount) {
          priceParts.push("$" + priceAmount.textContent.trim());
        }
        if (priceDisclosure) {
          priceParts.push(priceDisclosure.textContent.trim());
        }
        priceP.textContent = priceParts.join(" ");
        bodyContent.push(priceP);
      }
      const legalText = card.querySelector(".cardlegal p, .type-legal-wysiwyg-editor p");
      if (legalText) {
        const legalP = document.createElement("p");
        const legalEm = document.createElement("em");
        legalEm.textContent = legalText.textContent.trim();
        legalP.appendChild(legalEm);
        bodyContent.push(legalP);
      }
      const ctaLink = card.querySelector(".cta-container a, a.tile-anchor, a.btn-primary");
      if (ctaLink) {
        bodyContent.push(ctaLink);
      }
      if (image && bodyContent.length > 0) {
        cells.push([image, bodyContent]);
      } else if (bodyContent.length > 0) {
        cells.push([bodyContent]);
      }
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-product", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-promo.js
  function parse3(element, { document }) {
    const cardWrappers = element.querySelectorAll(".card-wrapper");
    const cells = [];
    cardWrappers.forEach((cardWrapper) => {
      const card = cardWrapper.querySelector(".card.flex-card");
      if (!card) return;
      const image = card.querySelector(":scope > img");
      const contentCell = [];
      const eyebrow = card.querySelector('[class*="eyebrow-lg"]');
      if (eyebrow) {
        const eyebrowEl = document.createElement("p");
        eyebrowEl.textContent = eyebrow.textContent.trim();
        contentCell.push(eyebrowEl);
      }
      const heading = card.querySelector("h3");
      if (heading) {
        contentCell.push(heading);
      }
      const description = card.querySelector(".type-base p");
      if (description) {
        contentCell.push(description);
      }
      const legal = card.querySelector(".type-legal p");
      if (legal) {
        contentCell.push(legal);
      }
      const ctaLinks = card.querySelectorAll(".flexCardItemCta a");
      ctaLinks.forEach((link) => {
        contentCell.push(link);
      });
      if (image && contentCell.length > 0) {
        cells.push([image, contentCell]);
      } else if (contentCell.length > 0) {
        cells.push([contentCell]);
      }
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-promo", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-valueprop.js
  function parse4(element, { document }) {
    const cards = element.querySelectorAll(".generic-list-icon-vp");
    const cells = [];
    cards.forEach((card) => {
      const img = card.querySelector('span.height-xl-all img, span[class*="height-xl"] img, img');
      const heading = card.querySelector('h4, h3, h5, [class*="heading"]');
      const descriptionEl = card.querySelector('.description, .type-sm, div[class*="description"]');
      const ctaLink = card.querySelector('a.primary-cta, a[class*="cta"], a');
      const imageCell = [];
      if (img) {
        imageCell.push(img);
      }
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
      if (imageCell.length > 0 || bodyCell.length > 0) {
        cells.push([imageCell, bodyCell]);
      }
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-valueprop", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-offer.js
  function parse5(element, { document }) {
    const cells = [];
    const isLinkFarm = element.classList.contains("link-farm") || !!element.querySelector(".link-farm-main");
    if (isLinkFarm) {
      const desktopView = element.querySelector(".desktop-view-and-tablet");
      const source = desktopView || element;
      const linkColumns = source.querySelectorAll(".grid-col-3");
      const columnCells = [];
      linkColumns.forEach((col) => {
        const ul = col.querySelector("ul");
        if (ul) {
          const cellContent = document.createElement("div");
          const links = ul.querySelectorAll("li a");
          const list = document.createElement("ul");
          links.forEach((link) => {
            const li = document.createElement("li");
            const a = document.createElement("a");
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
      const heading = element.querySelector("h2, h1, h3");
      const description = element.querySelector(".type-base p, .wysiwyg-editor p");
      const legalText = element.querySelector(".type-legal-wysiwyg-editor p, .type-legal p");
      const ctaLinks = Array.from(element.querySelectorAll(".cta-container a, .links-container a"));
      const image = element.querySelector("img.imgOffer, .video-content-offer img, .overflow-hidden img");
      const textCell = document.createElement("div");
      if (heading) {
        const h = document.createElement("h2");
        h.textContent = heading.textContent.trim();
        textCell.appendChild(h);
      }
      if (description) {
        const p = document.createElement("p");
        p.textContent = description.textContent.trim();
        textCell.appendChild(p);
      }
      if (legalText) {
        const legal = document.createElement("p");
        legal.innerHTML = legalText.innerHTML;
        textCell.appendChild(legal);
      }
      ctaLinks.forEach((link) => {
        const a = document.createElement("a");
        a.href = link.href;
        a.textContent = link.textContent.trim();
        textCell.appendChild(a);
      });
      const imageCell = document.createElement("div");
      if (image) {
        const img = document.createElement("img");
        img.src = image.src;
        img.alt = image.alt || "";
        imageCell.appendChild(img);
      }
      cells.push([textCell, imageCell]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-offer", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-dark.js
  function parse6(element, { document }) {
    const bgImage = element.querySelector(".bg-art .bg-hero-panel img, .bg-art img, .hero-wrapper img:first-of-type");
    const eyebrow = element.querySelector('[class*="eyebrow-xxxl"], [class*="eyebrow"]');
    const heading = element.querySelector('h2[class*="heading-xxl"], h2[class*="heading"], h1, h2, h3');
    const description = element.querySelector('.type-base.wysiwyg-editor, .type-base, [class*="wysiwyg-editor"]');
    const ctaLinks = Array.from(element.querySelectorAll(".cta-container a, a.btn-primary, a.btn-secondary"));
    const cells = [];
    if (bgImage) {
      cells.push([bgImage]);
    }
    const contentCell = [];
    if (eyebrow) {
      const eyebrowEl = document.createElement("p");
      eyebrowEl.textContent = eyebrow.textContent.trim();
      contentCell.push(eyebrowEl);
    }
    if (heading) {
      contentCell.push(heading);
    }
    if (description) {
      contentCell.push(description);
    }
    if (ctaLinks.length > 0) {
      contentCell.push(...ctaLinks);
    }
    cells.push(contentCell);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-dark", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-industry.js
  function parse7(element, { document }) {
    const slides = element.querySelectorAll(".swiper-slide");
    const cells = [];
    slides.forEach((slide) => {
      const slideImage = slide.querySelector("img.swiper-image");
      const heading = slide.querySelector(".heading-sm, .heading-sm-storyStack");
      const description = slide.querySelector(".story-description p, .type-base.wysiwyg-editor p");
      const imageCell = [];
      if (slideImage) {
        imageCell.push(slideImage);
      }
      const contentCell = [];
      if (heading) {
        const h3 = document.createElement("h3");
        h3.textContent = heading.textContent.trim();
        contentCell.push(h3);
      }
      if (description) {
        const p = document.createElement("p");
        p.textContent = description.textContent.trim();
        contentCell.push(p);
      }
      if (imageCell.length > 0 || contentCell.length > 0) {
        cells.push([imageCell, contentCell]);
      }
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-industry", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-testimonial.js
  function parse8(element, { document }) {
    const tileCards = Array.from(element.querySelectorAll(".tile-card"));
    const cells = [];
    tileCards.forEach((card) => {
      const image = card.querySelector(".card-img img, img");
      const bodyContent = [];
      const eyebrow = card.querySelector("p.type-eyebrow-md, p.eyebrow-text, .js-eyeBrow-section");
      if (eyebrow) {
        bodyContent.push(eyebrow);
      }
      const heading = card.querySelector("h3.heading-md, h3.js-heading-section, h3");
      if (heading) {
        bodyContent.push(heading);
      }
      const description = card.querySelector(".tileSubheading p, .js-textBody-section p");
      if (description) {
        bodyContent.push(description);
      }
      const legalText = card.querySelector(".cardlegal p, .type-legal-wysiwyg-editor p");
      if (legalText) {
        const legalP = document.createElement("p");
        const legalEm = document.createElement("em");
        legalEm.textContent = legalText.textContent.trim();
        legalP.appendChild(legalEm);
        bodyContent.push(legalP);
      }
      const ctaLink = card.querySelector(".cta-container a, a.tile-anchor, a.btn-primary");
      if (ctaLink) {
        bodyContent.push(ctaLink);
      }
      if (image && bodyContent.length > 0) {
        cells.push([image, bodyContent]);
      } else if (bodyContent.length > 0) {
        cells.push([bodyContent]);
      }
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-testimonial", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/form.js
  function parse9(element, { document }) {
    const formEl = element.querySelector("form#bs-rai-leadform, form.bs-rai-leadform, form");
    const formLink = document.createElement("a");
    const formPath = "/forms/rai-lead-form";
    formLink.href = formPath;
    formLink.textContent = formPath;
    const cells = [
      [formLink]
    ];
    const block = WebImporter.Blocks.createBlock(document, { name: "form", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/att-business-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        ".cookie-disclaimer-component",
        ".att-modal-container",
        ".modal-popup-container",
        "#nuanMessagingFrame",
        "#inqTestDiv",
        "#inqDivResizeCorner",
        "#inqResizeBox",
        "#inqTitleBar",
        "#injectTargetScreenReader"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        ".global-navigation.parbase",
        ".footer-page-css-includes",
        ".footer.aem-GridColumn",
        ".cloudservice.testandtarget",
        "#gpc-banner-container",
        "#batBeacon417724488847",
        "#db_lr_pixel_ad",
        ".skip-to-content-link",
        "iframe",
        "noscript",
        "link"
      ]);
      const trackedElements = element.querySelectorAll("[data-track]");
      trackedElements.forEach((el) => {
        el.removeAttribute("data-track");
      });
    }
  }

  // tools/importer/transformers/att-business-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.afterTransform) {
      const { template } = payload;
      if (!template || !template.sections || template.sections.length < 2) return;
      const { document } = element.ownerDocument ? { document: element.ownerDocument } : { document };
      const sections = [...template.sections].reverse();
      sections.forEach((section) => {
        const sectionEl = element.querySelector(section.selector);
        if (!sectionEl) return;
        if (section.style) {
          const sectionMetadata = WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          sectionEl.after(sectionMetadata);
        }
        if (section.id !== "section-1") {
          const hr = document.createElement("hr");
          sectionEl.before(hr);
        }
      });
    }
  }

  // tools/importer/import-homepage.js
  var parsers = {
    "hero-homepage": parse,
    "cards-product": parse2,
    "cards-promo": parse3,
    "cards-valueprop": parse4,
    "columns-offer": parse5,
    "hero-dark": parse6,
    "carousel-industry": parse7,
    "cards-testimonial": parse8,
    "form": parse9
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "AT&T Business homepage with hero banner, product/service offerings, and promotional content",
    urls: ["https://www.business.att.com/"],
    blocks: [
      {
        name: "hero-homepage",
        instances: ["main#baem-container .root > .aem-Grid > .hero.aem-GridColumn:nth-child(1)"]
      },
      {
        name: "cards-product",
        instances: ["main#baem-container .multi-tile-cards.aem-GridColumn:nth-of-type(1)"]
      },
      {
        name: "cards-promo",
        instances: [".flex-cards.aem-GridColumn"]
      },
      {
        name: "cards-valueprop",
        instances: [".generic-list-value-prop.aem-GridColumn"]
      },
      {
        name: "columns-offer",
        instances: [".offer.aem-GridColumn:nth-of-type(1)", ".offer.aem-GridColumn:nth-of-type(2)", ".link-farm.aem-GridColumn"]
      },
      {
        name: "hero-dark",
        instances: ["main#baem-container .root > .aem-Grid > .hero.aem-GridColumn:nth-child(2)", "main#baem-container .root > .aem-Grid > .hero.aem-GridColumn:nth-child(3)"]
      },
      {
        name: "carousel-industry",
        instances: [".story-stack.aem-GridColumn"]
      },
      {
        name: "cards-testimonial",
        instances: [".multi-tile-cards.aem-GridColumn:nth-of-type(2)"]
      },
      {
        name: "form",
        instances: [".rai-form.aem-GridColumn"]
      }
    ],
    sections: [
      { id: "section-1", name: "Hero", selector: "main#baem-container .root > .aem-Grid > .hero.aem-GridColumn:nth-child(1)", style: null, blocks: ["hero-homepage"], defaultContent: [] },
      { id: "section-2", name: "Products", selector: "main#baem-container .multi-tile-cards.aem-GridColumn:nth-of-type(1)", style: null, blocks: ["cards-product"], defaultContent: [".multi-tile-cards .eyebrow-heading h2", ".multi-tile-cards .type-base"] },
      { id: "section-3", name: "Promos", selector: ".flex-cards.aem-GridColumn", style: null, blocks: ["cards-promo"], defaultContent: [".flex-cards h2"] },
      { id: "section-4", name: "Value Props", selector: ".generic-list-value-prop.aem-GridColumn", style: null, blocks: ["cards-valueprop"], defaultContent: [".generic-list-value-prop h2", ".generic-list-value-prop .type-base"] },
      { id: "section-5", name: "JD Power Award", selector: ".offer.aem-GridColumn:nth-of-type(1)", style: "grey", blocks: ["columns-offer"], defaultContent: [] },
      { id: "section-6", name: "Dark Hero - Connectivity", selector: "main#baem-container .root > .aem-Grid > .hero.aem-GridColumn:nth-child(2)", style: null, blocks: ["hero-dark"], defaultContent: [] },
      { id: "section-7", name: "Micro Banner", selector: ".micro-banner.aem-GridColumn", style: "accent", blocks: [], defaultContent: [".micro-banner h2, .micro-banner .type-base, .micro-banner .type-legal"] },
      { id: "section-8", name: "Switch to ATT", selector: ".offer.aem-GridColumn:nth-of-type(2)", style: null, blocks: ["columns-offer"], defaultContent: [] },
      { id: "section-9", name: "Industry Carousel", selector: ".story-stack.aem-GridColumn", style: null, blocks: ["carousel-industry"], defaultContent: [".story-stack h2", ".story-stack .type-base"] },
      { id: "section-10", name: "Dark Hero - Guarantee", selector: "main#baem-container .root > .aem-Grid > .hero.aem-GridColumn:nth-child(3)", style: null, blocks: ["hero-dark"], defaultContent: [] },
      { id: "section-11", name: "Testimonials", selector: ".multi-tile-cards.aem-GridColumn:nth-of-type(2)", style: null, blocks: ["cards-testimonial"], defaultContent: [".multi-tile-cards:nth-of-type(2) h2", ".multi-tile-cards:nth-of-type(2) .type-base"] },
      { id: "section-12", name: "Contact Form", selector: ".rai-form.aem-GridColumn", style: "grey", blocks: ["form"], defaultContent: [".rai-form .RAIHeader h2", ".rai-form .RAIHeader .type-base", ".rai-form .RAIHeader .type-legal"] },
      { id: "section-13", name: "Link Farm", selector: ".link-farm.aem-GridColumn", style: "grey", blocks: ["columns-offer"], defaultContent: [".link-farm h2"] }
    ]
  };
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element
          });
        });
      });
    });
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "") || "/index"
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
