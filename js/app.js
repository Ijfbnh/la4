// Небольшие интерфейсные функции и регистрация PWA Service Worker.
const menuButton = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');
if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const opened = nav.classList.toggle('nav--open');
    menuButton.setAttribute('aria-expanded', String(opened));
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(console.error));
}

let installPrompt = null;
const installBanner = document.getElementById('installBanner');
const installButton = document.getElementById('installButton');
const installClose = document.getElementById('installClose');

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  if (installBanner && !sessionStorage.getItem('pamyat-install-dismissed')) {
    installBanner.hidden = false;
  }
});
if (installButton) {
  installButton.addEventListener('click', async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    installBanner.hidden = true;
  });
}
if (installClose) {
  installClose.addEventListener('click', () => {
    installBanner.hidden = true;
    sessionStorage.setItem('pamyat-install-dismissed', '1');
  });
}

/* ===== Каталог, карточка товара и корзина ===== */
const PRODUCTS = {
  flowers: {
    title: 'Цветочная композиция «Тихая память»', short: 'Цветочные композиции', category: 'Цветочная композиция',
    price: 4900, priceText: 'от 4 900 ₽', image: 'assets/catalog-wreath.webp',
    text: 'Сдержанная композиция из белых роз, сезонных цветов и декоративной зелени. Состав может быть адаптирован с учётом ваших пожеланий.',
    points: ['Индивидуальный подбор цветов', 'Несколько вариантов оформления', 'Предварительное согласование стоимости']
  },
  supplies: {
    title: 'Ритуальные принадлежности', short: 'Ритуальные принадлежности', category: 'Товары',
    price: 2300, priceText: 'от 2 300 ₽',
    image: 'https://asset.kompas.com/crops/VI70QSZrZ0C2hSM-sitJhLXoVVc%3D/0x0%3A1500x1000/1200x800/data/photo/2023/08/21/64e315d5b7a13.jpeg',
    text: 'Поминальные свечи, ленты и другие необходимые принадлежности. Поможем подобрать всё нужное в одном месте.',
    points: ['Подбор по вашему списку', 'Консультация специалиста', 'Предварительное согласование стоимости']
  },
  ceremony: {
    title: 'Организация церемонии', short: 'Организация церемонии', category: 'Услуга',
    price: null, priceText: 'По запросу',
    image: 'https://www.kbpojistovna.cz/getoptimizedimage/fb1233a2-f2af-4ccb-a3af-4e7d26b0e3ea/IMG_2247?height=446&siteName=KP&width=713',
    text: 'Координация и сопровождение церемонии прощания: помощь с оформлением, порядком проведения и организационными вопросами.',
    points: ['Бережное сопровождение на каждом этапе', 'Помощь с оформлением зала', 'Стоимость уточняется у специалиста']
  },
  transport: {
    title: 'Транспортные услуги', short: 'Транспортные услуги', category: 'Услуга',
    price: null, priceText: 'По запросу',
    image: 'https://images.squarespace-cdn.com/content/v1/5a276db3ccc5c5bb84beb3e5/1601269293133-UTO4FYHS0Z4JP6ODGLQR/2019-SS-Coach-Company-Cadillac-Masterpiece-Hearse-10.jpg?format=1500w',
    text: 'Перевозка и сопровождение. Подберём транспорт и маршрут с учётом ваших пожеланий.',
    points: ['Круглосуточная подача', 'Сопровождение на всём пути', 'Стоимость уточняется у специалиста']
  }
};

const CART_KEY = 'pamyat-cart';
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => n.toLocaleString('ru-RU') + ' ₽';

function loadCart() {
  try {
    const data = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
    return data && typeof data === 'object' ? data : {};
  } catch (e) { return {}; }
}
function saveCart(cart) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { console.error(e); }
  updateBadge();
}
function cartCount() {
  return Object.values(loadCart()).reduce((sum, q) => sum + (Number(q) || 0), 0);
}
function addToCart(id) {
  if (!PRODUCTS[id]) return;
  const cart = loadCart();
  cart[id] = (Number(cart[id]) || 0) + 1;
  saveCart(cart);
}

// Ссылка «Корзина» со счётчиком в шапке на всех страницах
function updateBadge() {
  const badge = document.querySelector('.header__cart-count');
  if (!badge) return;
  const n = cartCount();
  badge.textContent = n;
  badge.hidden = n === 0;
}
(function initHeaderCart() {
  const inner = document.querySelector('.header__inner');
  if (!inner) return;
  const link = document.createElement('a');
  link.className = 'header__cart';
  link.href = 'cart.html';
  link.setAttribute('aria-label', 'Корзина');
  link.innerHTML = '<span aria-hidden="true">🛒</span><span class="header__cart-count" hidden>0</span>';
  const toggle = inner.querySelector('.nav-toggle');
  inner.insertBefore(link, toggle || null);
  updateBadge();
})();

// Всплывающее уведомление
function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
  }
  toast.innerHTML = esc(message) + ' <a href="cart.html">Открыть корзину</a>';
  toast.classList.add('toast--show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('toast--show'), 3500);
}

// Если внешняя картинка не загрузилась — показываем свою
const FALLBACK_IMAGE = 'assets/catalog-wreath.webp';
function imgFallback(img) {
  img.addEventListener('error', () => {
    if (!img.src.endsWith(FALLBACK_IMAGE)) img.src = FALLBACK_IMAGE;
  }, { once: true });
}
document.querySelectorAll('.product-card__image img').forEach(imgFallback);

// Страница товара
const productBox = document.getElementById('product');
if (productBox) {
  const id = new URLSearchParams(location.search).get('id') || 'flowers';
  const p = PRODUCTS[id];
  if (!p) {
    productBox.innerHTML = '<div class="empty-state"><h2>Товар не найден</h2><a class="button button--dark" href="catalog.html">Перейти в каталог</a></div>';
  } else {
    document.title = p.title + ' — Память';
    const h1 = document.querySelector('.page-hero h1');
    if (h1) h1.textContent = p.title;
    productBox.innerHTML =
      '<div class="detail-art detail-art--photo"><img src="' + esc(p.image) + '" alt="' + esc(p.title) + '"></div>' +
      '<div><p class="eyebrow">' + esc(p.category) + '</p><h2>' + esc(p.short) + '</h2>' +
      '<p class="detail-price">' + esc(p.priceText) + '</p><p>' + esc(p.text) + '</p>' +
      '<ul class="check-list">' + p.points.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul>' +
      '<button class="button button--dark" type="button" id="addToCart">Добавить в корзину</button> ' +
      '<a class="button button--outline-dark" href="cart.html">Перейти в корзину</a>' +
      '<p class="muted">Изображение и описание демонстрационные.</p></div>';
    imgFallback(productBox.querySelector('img'));
    document.getElementById('addToCart').addEventListener('click', () => {
      addToCart(id);
      showToast('«' + p.short + '» добавлен в корзину.');
      if (window.chibi) window.chibi.say('Добавил в корзину. Если нужно, подскажу, что выбрать дальше.', 'bow');
    });
  }
}

// Страница корзины
const cartBox = document.getElementById('cart');
function renderCart() {
  const cart = loadCart();
  const ids = Object.keys(cart).filter((id) => PRODUCTS[id] && cart[id] > 0);
  if (!ids.length) {
    cartBox.innerHTML = '<div class="empty-state"><div class="empty-state__icon">◇</div><h2>В корзине пока пусто</h2><p>Вы можете посмотреть каталог и добавить интересующие товары или услуги.</p><a class="button button--dark" href="catalog.html">Перейти в каталог</a></div>';
    return;
  }
  let total = 0, hasRequest = false;
  const rows = ids.map((id) => {
    const p = PRODUCTS[id], q = cart[id];
    if (p.price === null) hasRequest = true; else total += p.price * q;
    return '<div class="cart-item" data-id="' + id + '">' +
      '<a class="cart-item__img" href="product.html?id=' + id + '"><img src="' + esc(p.image) + '" alt="' + esc(p.title) + '"></a>' +
      '<div class="cart-item__info"><h3>' + esc(p.short) + '</h3><p class="muted">' + esc(p.priceText) + '</p></div>' +
      '<div class="qty"><button type="button" data-act="dec" aria-label="Меньше">−</button><span>' + q + '</span><button type="button" data-act="inc" aria-label="Больше">+</button></div>' +
      '<strong class="cart-item__sum">' + (p.price === null ? 'По запросу' : money(p.price * q)) + '</strong>' +
      '<button class="cart-item__remove" type="button" data-act="del" aria-label="Удалить">×</button></div>';
  }).join('');
  cartBox.innerHTML = '<div class="cart-list">' + rows + '</div>' +
    '<div class="cart-total"><div><span class="muted">Предварительная сумма' + (hasRequest ? ' (без услуг «по запросу»)' : '') + '</span>' +
    '<strong>' + (total ? 'от ' + money(total) : 'По запросу') + '</strong></div>' +
    '<div><button class="button button--outline-dark" type="button" data-act="clear">Очистить</button> ' +
    '<a class="button button--dark" href="checkout.html">Оформить заявку</a></div></div>';
  cartBox.querySelectorAll('img').forEach(imgFallback);
}
if (cartBox) {
  renderCart();
  cartBox.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const cart = loadCart();
    const row = btn.closest('.cart-item');
    const id = row && row.dataset.id;
    const act = btn.dataset.act;
    if (act === 'inc') cart[id] = (cart[id] || 0) + 1;
    if (act === 'dec') cart[id] = (cart[id] || 0) - 1;
    if (act === 'del') delete cart[id];
    if (act === 'clear') Object.keys(cart).forEach((k) => delete cart[k]);
    if (cart[id] <= 0) delete cart[id];
    saveCart(cart);
    renderCart();
  });
}
