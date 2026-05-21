function decorateImages() {
  document.querySelectorAll('.hero-homepage').forEach((block) => {
    const row = block.querySelector(':scope > div');
    if (!row) return;
    const imageCell = row.children[0];
    if (!imageCell || imageCell.querySelector('picture, img')) return;

    const url = imageCell.textContent.trim();
    if (url && url.startsWith('http')) {
      const picture = document.createElement('picture');
      const img = document.createElement('img');
      img.src = url;
      img.alt = '';
      img.loading = 'eager';
      picture.append(img);
      imageCell.textContent = '';
      imageCell.append(picture);
    }
  });
}

export default function ue() {
  decorateImages();

  // Re-run when author makes changes
  const main = document.querySelector('main');
  if (main) {
    const observer = new MutationObserver(() => {
      decorateImages();
    });
    observer.observe(main, { childList: true, subtree: true, characterData: true });
  }
}
