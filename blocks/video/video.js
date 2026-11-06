/*
 * Video Block
 * Show a video referenced by a link
 * https://www.hlx.live/developer/block-collection/video
 */

import { getVideoSource, getVideoTypeLabel, loadVideoEmbed, shouldPlayOnLoad, embedVideoWithApi } from '../../scripts/utils/video.js';

export default async function decorate(block) {
  const placeholder = block.querySelector('picture');
  const linkEl = block.querySelector('a');
  if (!linkEl) return;
  const markdownLink = linkEl.textContent.trim().match(/^\[[^\]]+\]\((https?:\/\/[^)]+)\)$/);
  const link = markdownLink ? markdownLink[1] : linkEl.href;
  block.textContent = '';
  block.dataset.embedLoaded = false;

  const autoplay = block.classList.contains('autoplay');
  if (placeholder) {
    block.classList.add('placeholder');
    const wrapper = document.createElement('div');
    wrapper.className = 'video-placeholder';
    wrapper.append(placeholder);

    if (!autoplay) {
      const source = getVideoSource(link);
      const videoType = getVideoTypeLabel(source);
      const ariaLabel = `Play ${videoType}`;

      wrapper.insertAdjacentHTML(
        'beforeend',
        `<div class="video-placeholder-play"><button type="button" title="${ariaLabel}" aria-label="${ariaLabel}"></button></div>`,
      );
      wrapper.addEventListener('click', () => {
        wrapper.remove();
        embedVideoWithApi(block, link, { autoplay: true });
      });
    }
    block.append(wrapper);
  }

  if (!placeholder || autoplay) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        if (autoplay) loadVideoEmbed(block, link, shouldPlayOnLoad(autoplay), true);
        else embedVideoWithApi(block, link, { autoplay: false });
      }
    });
    observer.observe(block);
  }
}
