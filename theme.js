(function () {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  const icon = toggle.querySelector('.material-icons');

  function updateIcon() {
    const isDark = document.documentElement.classList.contains('dark-mode');
    icon.textContent = isDark ? 'light_mode' : 'dark_mode';
    toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  toggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark-mode');
    localStorage.setItem(
      'theme',
      document.documentElement.classList.contains('dark-mode') ? 'dark' : 'light'
    );
    updateIcon();
  });

  updateIcon();
})();
