(function () {
  const topicsBar = document.querySelector('.topics-bar');
  const topicsContainer = document.querySelector('.selection-topics');
  const scrollForwardBtn = document.querySelector('.topics-scroll-forward');
  const scrollBackBtn = document.querySelector('.topics-scroll-back');

  if (!topicsBar || !topicsContainer || !scrollForwardBtn || !scrollBackBtn) return;

  function updateScrollButtons() {
    const canScroll = topicsContainer.scrollWidth > topicsContainer.clientWidth + 1;
    const atStart = topicsContainer.scrollLeft <= 1;
    const atEnd =
      topicsContainer.scrollLeft + topicsContainer.clientWidth >=
      topicsContainer.scrollWidth - 1;

    const showForward = canScroll && !atEnd;
    const showBack = canScroll && !atStart;

    scrollForwardBtn.classList.toggle('hidden', !showForward);
    scrollBackBtn.classList.toggle('hidden', !showBack);
    topicsBar.classList.toggle('can-scroll-forward', showForward);
    topicsBar.classList.toggle('can-scroll-back', showBack);
  }

  topicsContainer.addEventListener('click', (event) => {
    const topic = event.target.closest('.topic');
    if (!topic) return;

    topicsContainer.querySelectorAll('.topic').forEach((btn) => {
      btn.classList.remove('active');
    });
    topic.classList.add('active');
  });

  scrollForwardBtn.addEventListener('click', () => {
    topicsContainer.scrollBy({
      left: topicsContainer.clientWidth * 0.75,
      behavior: 'smooth',
    });
  });

  scrollBackBtn.addEventListener('click', () => {
    topicsContainer.scrollBy({
      left: -topicsContainer.clientWidth * 0.75,
      behavior: 'smooth',
    });
  });

  topicsContainer.addEventListener('scroll', updateScrollButtons, { passive: true });
  window.addEventListener('resize', updateScrollButtons);

  updateScrollButtons();
})();
