import '@fontsource-variable/instrument-sans/wght.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
import './styles.css';

// Avatar GitHub asli (jika bisa dimuat). Jika gagal/offline, placeholder logo RLC tetap tampil.
const box = document.getElementById('avatar');
if (box) {
  const img = new Image();
  img.alt = '';
  img.width = 96;
  img.height = 96;
  img.decoding = 'async';
  img.referrerPolicy = 'no-referrer';
  img.onload = () => {
    box.replaceChildren(img);
    box.classList.add('has-photo');
  };
  img.src = 'https://github.com/r1dzzz.png?size=192';
}
