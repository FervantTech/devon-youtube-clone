(function () {
  const HOVER_DELAY = 200;
  const SEEK_THROTTLE = 150;
  const ACCENT_ALPHA = 0.18;

  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!canHover) return;

  let ytApiLoaded = false;
  let ytApiReady = false;
  const ytReadyQueue = [];
  const colorCache = new Map();

  function loadYouTubeAPI() {
    if (ytApiLoaded) return;
    ytApiLoaded = true;

    window.onYouTubeIframeAPIReady = function () {
      ytApiReady = true;
      ytReadyQueue.splice(0).forEach((cb) => cb());
    };

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  }

  function whenYouTubeReady(callback) {
    if (ytApiReady) {
      callback();
    } else {
      ytReadyQueue.push(callback);
    }
  }

  function extractDominantColor(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = 32;

    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(img, 0, 0, size, size);

    const { data } = ctx.getImageData(0, 0, size, size);
    let r = 0;
    let g = 0;
    let b = 0;
    let weightSum = 0;

    for (let i = 0; i < data.length; i += 4) {
      const pr = data[i];
      const pg = data[i + 1];
      const pb = data[i + 2];
      const pa = data[i + 3];

      if (pa < 128) continue;

      const max = Math.max(pr, pg, pb);
      const min = Math.min(pr, pg, pb);
      const saturation = max === 0 ? 0 : (max - min) / max;
      const luminance = (0.299 * pr + 0.587 * pg + 0.114 * pb) / 255;

      if (luminance < 0.12 || luminance > 0.9 || saturation < 0.08) continue;

      const weight = saturation * (1 - Math.abs(luminance - 0.45));
      r += pr * weight;
      g += pg * weight;
      b += pb * weight;
      weightSum += weight;
    }

    if (weightSum === 0) {
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue;
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        weightSum += 1;
      }
    }

    if (weightSum === 0) return null;

    return {
      r: Math.round(r / weightSum),
      g: Math.round(g / weightSum),
      b: Math.round(b / weightSum),
    };
  }

  function getDominantColor(imageUrl) {
    if (colorCache.has(imageUrl)) {
      return Promise.resolve(colorCache.get(imageUrl));
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const color = extractDominantColor(img);
          colorCache.set(imageUrl, color);
          resolve(color);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = imageUrl;
    });
  }

  function applyAccentColor(videoEl, color) {
    if (!color) return;
    videoEl.style.backgroundColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${ACCENT_ALPHA})`;
  }

  function clearAccentColor(videoEl) {
    videoEl.style.backgroundColor = '';
  }

  document.querySelectorAll('.video').forEach((videoEl, index) => {
    const thumbnail = videoEl.querySelector('.thumbnail');
    const img = videoEl.querySelector('.thumbnail img');
    if (!thumbnail || !img) return;

    const match = img.src.match(/\/vi\/([^/]+)\//);
    if (!match) return;

    const videoId = match[1];
    const playerId = `preview-player-${index}`;

    let hoverTimeout = null;
    let previewActive = false;
    let player = null;
    let duration = 0;
    let lastSeekTime = 0;
    let pendingScrubX = null;

    const preview = document.createElement('div');
    preview.className = 'preview-player';
    preview.innerHTML =
      `<div id="${playerId}" class="preview-frame"></div>` +
      '<div class="preview-scrub-bar"><div class="preview-scrub-progress"></div></div>';
    thumbnail.appendChild(preview);

    const scrubProgress = preview.querySelector('.preview-scrub-progress');
    let playerHost = preview.querySelector('.preview-frame');

    function resetPlayerHost() {
      const scrubBar = preview.querySelector('.preview-scrub-bar');
      playerHost.remove();
      playerHost = document.createElement('div');
      playerHost.id = playerId;
      playerHost.className = 'preview-frame';
      preview.insertBefore(playerHost, scrubBar);
    }

    function setScrubPosition(x) {
      const clamped = Math.max(0, Math.min(1, x));
      scrubProgress.style.width = `${clamped * 100}%`;
      pendingScrubX = clamped;

      if (!player || !duration) return;

      const now = Date.now();
      if (now - lastSeekTime < SEEK_THROTTLE) return;

      lastSeekTime = now;
      player.seekTo(duration * clamped, true);
    }

    function createPlayer() {
      if (player) return;

      player = new YT.Player(playerId, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          fs: 0,
          disablekb: 1,
          iv_load_policy: 3,
        },
        events: {
          onReady: (event) => {
            duration = event.target.getDuration() || 0;
            preview.classList.add('active');
            img.classList.add('preview-hidden');

            if (pendingScrubX !== null && duration) {
              event.target.seekTo(duration * pendingScrubX, true);
            }
          },
        },
      });
    }

    function showPreview() {
      previewActive = true;
      loadYouTubeAPI();
      whenYouTubeReady(createPlayer);
    }

    function stopPreview() {
      previewActive = false;
      clearTimeout(hoverTimeout);
      preview.classList.remove('active');
      img.classList.remove('preview-hidden');
      scrubProgress.style.width = '0%';
      pendingScrubX = null;
      duration = 0;
      lastSeekTime = 0;

      if (player) {
        player.destroy();
        player = null;
      }
      resetPlayerHost();
    }

    videoEl.addEventListener('mouseenter', () => {
      getDominantColor(img.src).then((color) => applyAccentColor(videoEl, color));
    });

    videoEl.addEventListener('mouseleave', () => {
      stopPreview();
      clearAccentColor(videoEl);
    });

    thumbnail.addEventListener('mouseenter', () => {
      hoverTimeout = setTimeout(showPreview, HOVER_DELAY);
    });

    thumbnail.addEventListener('mouseleave', stopPreview);

    thumbnail.addEventListener('mousemove', (e) => {
      const rect = thumbnail.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;

      if (!previewActive) {
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(showPreview, HOVER_DELAY);
      }

      setScrubPosition(x);
    });
  });
})();
