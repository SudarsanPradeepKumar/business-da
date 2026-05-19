function createSlide(row, slideIndex) {
  const columns = row.querySelectorAll(':scope > div');
  const imageCol = columns[0];
  const contentCol = columns[1];

  const slide = document.createElement('div');
  slide.classList.add('carousel-industry-item');
  slide.dataset.slideIndex = slideIndex;

  const imageDiv = document.createElement('div');
  imageDiv.classList.add('carousel-industry-item-image');
  if (imageCol) imageDiv.append(...imageCol.childNodes);

  const contentDiv = document.createElement('div');
  contentDiv.classList.add('carousel-industry-item-content');
  if (contentCol) contentDiv.append(...contentCol.childNodes);

  const arrow = document.createElement('span');
  arrow.classList.add('carousel-industry-item-arrow');
  arrow.setAttribute('aria-hidden', 'true');

  slide.append(imageDiv, contentDiv, arrow);
  return slide;
}

export default async function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];

  const container = document.createElement('div');
  container.classList.add('carousel-industry-layout');

  const imagePanel = document.createElement('div');
  imagePanel.classList.add('carousel-industry-image-panel');

  const listPanel = document.createElement('div');
  listPanel.classList.add('carousel-industry-list-panel');

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx);
    listPanel.append(slide);
    row.remove();
  });

  const firstItem = listPanel.querySelector('.carousel-industry-item');
  if (firstItem) {
    firstItem.classList.add('active');
    const firstImg = firstItem.querySelector('.carousel-industry-item-image picture');
    if (firstImg) {
      imagePanel.append(firstImg.cloneNode(true));
    }
  }

  container.append(imagePanel, listPanel);
  block.append(container);

  const items = listPanel.querySelectorAll('.carousel-industry-item');
  items.forEach((item) => {
    item.addEventListener('mouseenter', () => {
      items.forEach((i) => i.classList.remove('active'));
      item.classList.add('active');

      const pic = item.querySelector('.carousel-industry-item-image picture');
      if (pic) {
        imagePanel.innerHTML = '';
        imagePanel.append(pic.cloneNode(true));
      }
    });
  });
}
