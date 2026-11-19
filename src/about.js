import './styles/main.css';

if (window.location.hash) {
  const target = document.querySelector(window.location.hash);
  if (target) {
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}
