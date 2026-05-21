export default function decorate(block) {
  const row = block.querySelector(':scope > div');
  if (!row) return;

  const imageCell = row.children[0];
  if (!imageCell) return;

  // Convert URL string to picture element if needed
  if (!imageCell.querySelector('picture')) {
    const url = imageCell.textContent.trim();
    if (url && (url.startsWith('http') || url.startsWith('/'))) {
      const picture = document.createElement('picture');
      const img = document.createElement('img');
      img.src = url;
      img.alt = '';
      img.loading = 'eager';
      picture.append(img);
      imageCell.textContent = '';
      imageCell.append(picture);
    }
  }
}
