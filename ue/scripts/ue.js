function convertUrlToImage(container, url) {
  const picture = document.createElement('picture');
  const img = document.createElement('img');
  img.src = url;
  img.alt = '';
  img.loading = 'eager';
  img.style.maxWidth = '100%';
  picture.append(img);
  container.textContent = '';
  container.append(picture);
}

function decorateImages() {
  // Handle blocks with hero-homepage class (after auto-blocking)
  document.querySelectorAll('.hero-homepage').forEach((block) => {
    const row = block.querySelector(':scope > div');
    if (!row) return;
    const imageCell = row.children[0];
    if (!imageCell || imageCell.querySelector('picture, img')) return;

    const url = imageCell.textContent.trim();
    if (url && url.startsWith('http')) {
      convertUrlToImage(imageCell, url);
    }
  });

  // Handle raw UE content (no block wrapper yet)
  document.querySelectorAll('main p').forEach((p) => {
    if (p.querySelector('picture, img')) return;
    const url = p.textContent.trim();
    if (url && url.startsWith('http') && url.includes('/assets/')) {
      convertUrlToImage(p, url);
    }
  });
}

export default function ue() {
  decorateImages();

  const main = document.querySelector('main');
  if (main) {
    const observer = new MutationObserver(() => {
      decorateImages();
    });
    observer.observe(main, { childList: true, subtree: true, characterData: true });
  }
}
