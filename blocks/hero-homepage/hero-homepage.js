export default function decorate(block) {
  const rows = [...block.children];
  const firstRow = rows[0];
  if (!firstRow) return;

  const cells = [...firstRow.children];

  // Already in 2-column format (DA native editor) — just promote heading
  if (cells.length === 2) {
    const textCell = cells[1];
    const secondP = textCell.querySelector(':scope > p:nth-of-type(2)');
    if (secondP && !textCell.querySelector('h1')) {
      const h1 = document.createElement('h1');
      h1.textContent = secondP.textContent;
      h1.id = h1.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      secondP.replaceWith(h1);
    }
    return;
  }

  // Single-cell format (UE authored) — restructure into 2-column layout
  const cell = cells[0];
  if (!cell) return;

  const picture = cell.querySelector('picture');
  const paragraphs = [...cell.querySelectorAll(':scope > p')];

  const imageCell = document.createElement('div');
  if (picture) {
    imageCell.append(picture);
  } else {
    // Image might be a URL in a <p> — convert to picture
    const firstP = paragraphs.shift();
    if (firstP && firstP.textContent.startsWith('http')) {
      const pic = document.createElement('picture');
      const img = document.createElement('img');
      img.src = firstP.textContent.trim();
      img.loading = 'lazy';
      img.alt = '';
      pic.append(img);
      imageCell.append(pic);
    } else if (firstP) {
      paragraphs.unshift(firstP);
    }
  }

  const textCell = document.createElement('div');
  const [eyebrow, heading, description] = paragraphs;

  if (eyebrow) {
    const p = document.createElement('p');
    p.textContent = eyebrow.textContent;
    textCell.append(p);
  }
  if (heading) {
    const h1 = document.createElement('h1');
    h1.textContent = heading.textContent;
    h1.id = h1.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    textCell.append(h1);
  }
  if (description) {
    const p = document.createElement('p');
    p.textContent = description.textContent;
    textCell.append(p);
  }

  block.innerHTML = '';
  const row = document.createElement('div');
  row.append(imageCell, textCell);
  block.append(row);
}
