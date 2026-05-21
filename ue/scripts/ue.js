// Loaded only inside Universal Editor (*.ue.da.live)
// Prevents block decoration from interfering with UE instrumentation

document.addEventListener('editor-update', () => {
  document.querySelectorAll('.hero-homepage img[loading="lazy"]').forEach((img) => {
    img.loading = 'eager';
  });
});
