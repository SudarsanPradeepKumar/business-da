export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length < 2) return;

  const textCol = rows[0].querySelector(':scope > div');
  const imageCol = rows[1].querySelector(':scope > div');

  if (textCol) textCol.classList.add('feature-highlight-text');
  if (imageCol) imageCol.classList.add('feature-highlight-image');

  block.innerHTML = '';
  if (textCol) block.append(textCol);
  if (imageCol) block.append(imageCol);

  if (textCol) {
    const paragraphs = textCol.querySelectorAll('p');
    paragraphs.forEach((p) => {
      const link = p.querySelector('a');
      if (link && p.textContent.trim() === link.textContent.trim()) {
        link.classList.add('cta');
      }
    });
  }
}
