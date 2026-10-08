// Executed in the browser by the responsive and media regression checks.
export function measureHeroComposition(video) {
  const hero = video.closest('.hero');
  const frame = video.getBoundingClientRect();
  const section = hero.getBoundingClientRect();
  const heading = hero.querySelector('.hero__heading').getBoundingClientRect();
  const control = hero.querySelector('.hero__video-control').getBoundingClientRect();
  const style = getComputedStyle(video);
  const scale = Math.max(frame.width / video.videoWidth, frame.height / video.videoHeight);
  const sourceWidth = video.videoWidth * scale;
  const sourceHeight = video.videoHeight * scale;
  const [positionX, positionY] = style.objectPosition.split(' ').map(value => Number.parseFloat(value) / 100);
  const sourceLeft = frame.left + (frame.width - sourceWidth) * positionX;
  const sourceTop = frame.top + (frame.height - sourceHeight) * positionY;
  // Protected gaze in the original 720 × 1280 film, projected through cover.
  const eye = {
    left: sourceLeft + sourceWidth * 0.34,
    right: sourceLeft + sourceWidth * 0.9,
    top: sourceTop + sourceHeight * 0.38,
    bottom: sourceTop + sourceHeight * 0.68,
  };
  return {
    fullBleed: Math.abs(frame.left - section.left) < 1 && Math.abs(frame.top - section.top) < 1 && Math.abs(frame.width - section.width) < 1 && Math.abs(frame.height - section.height) < 1,
    fillsScreen: frame.width >= innerWidth - 1 && frame.height >= innerHeight - 1,
    naturalCover: style.objectFit === 'cover' && style.filter === 'none' && style.transform === 'none',
    titleAboveEye: heading.bottom <= eye.top,
    titleBesideEye: heading.right <= eye.left,
    controlClear: control.right <= eye.left || control.left >= eye.right || control.bottom <= eye.top || control.top >= eye.bottom,
  };
}
