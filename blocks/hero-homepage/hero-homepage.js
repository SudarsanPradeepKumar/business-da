export default function decorate(block) {
  const textCell = block.querySelector(':scope > div > div:nth-child(2)');
  if (!textCell) return;

  const headingP = textCell.querySelector(':scope > p:nth-of-type(2)');
  if (headingP && !textCell.querySelector('h1')) {
    const h1 = document.createElement('h1');
    h1.textContent = headingP.textContent;
    h1.id = headingP.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    headingP.replaceWith(h1);
  }
}
