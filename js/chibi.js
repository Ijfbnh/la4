// Маскот «Асмодей»: парит, покачивается, поворачивается к курсору,
// здоровается, подсказывает по страницам и реагирует на добавление в корзину.
(function () {
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };
  if (store.get('pamyat-chibi-off')) return;

  const page = (location.pathname.split('/').pop() || 'index.html').replace('.html', '') || 'index';
  const HINTS = {
    index: 'Приветствую вас. Меня зовут Асмодей. Я помогу осмотреться, а специалисты на связи круглосуточно.',
    catalog: 'Здесь собраны услуги и товары. Откройте любую карточку, чтобы узнать подробнее.',
    product: 'Если вам подходит — добавьте в корзину. Стоимость мы всё равно согласуем заранее.',
    cart: 'Здесь всё, что вы выбрали. Количество можно изменить.',
    checkout: 'Оставьте имя и телефон — специалист свяжется с вами в удобное время.',
    contacts: 'Позвоните или напишите нам. Мы всегда рядом.',
    team: 'Это наша команда. Каждый из них поможет бережно и без спешки.'
  };
  const IDLE = [
    'Я рядом, если понадобится помощь.',
    'Не торопитесь. Время у нас есть.',
    'Круглосуточная консультация: 8 800 555-35-35.',
    'Выбирайте спокойно — всё согласуем заранее.'
  ];

  const root = document.createElement('div');
  root.className = 'chibi';
  root.innerHTML =
    '<div class="chibi__bubble" role="status" aria-live="polite"></div>' +
    '<button class="chibi__btn" type="button" aria-label="Помощник Асмодей" title="Асмодей">' +
      '<span class="chibi__glow"></span>' +
      '<span class="chibi__shadow"></span>' +
      '<span class="chibi__bob"><span class="chibi__look">' +
        '<img class="chibi__img" src="assets/asmodey.webp" alt="Асмодей — помощник сайта" width="300" height="524" draggable="false">' +
      '</span></span>' +
    '</button>' +
    '<button class="chibi__close" type="button" aria-label="Скрыть помощника" title="Скрыть">×</button>';
  document.body.appendChild(root);

  const bubble = root.querySelector('.chibi__bubble');
  let bubbleTimer, actionTimer, talkTimer;

  function act(name, ms) {
    root.classList.remove('chibi--greet', 'chibi--jump', 'chibi--bow');
    void root.offsetWidth; // перезапуск анимации
    root.classList.add('chibi--' + name);
    clearTimeout(actionTimer);
    actionTimer = setTimeout(() => root.classList.remove('chibi--' + name), ms);
  }

  function say(text, action) {
    if (text) {
      bubble.textContent = text;
      bubble.classList.add('chibi__bubble--show');
      root.classList.add('chibi--talk');
      clearTimeout(talkTimer);
      talkTimer = setTimeout(() => root.classList.remove('chibi--talk'), 900);
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(() => bubble.classList.remove('chibi__bubble--show'), 6500);
    }
    if (action === 'greet' || action === 'wave') act('greet', 1600);
    if (action === 'jump') act('jump', 650);
    if (action === 'bow') act('bow', 1000);
  }
  window.chibi = { say };

  // Клик — случайная фраза и подпрыгивание
  let idleIndex = 0;
  root.querySelector('.chibi__btn').addEventListener('click', () => {
    say(IDLE[idleIndex++ % IDLE.length], 'jump');
  });
  root.querySelector('.chibi__close').addEventListener('click', () => {
    store.set('pamyat-chibi-off', '1');
    root.remove();
  });

  // Поворот к курсору
  let frame = 0;
  window.addEventListener('pointermove', (e) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const kx = Math.max(-1, Math.min(1, (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2)));
      root.style.setProperty('--look-x', (kx * 4).toFixed(1) + 'px');
      root.style.setProperty('--look-rot', (kx * 2.2).toFixed(1) + 'deg');
    });
  }, { passive: true });

  // Приветствие: подсказка один раз за сессию на каждой странице
  const seenKey = 'pamyat-chibi-seen-' + page;
  setTimeout(() => {
    if (!store.get(seenKey) && HINTS[page]) {
      store.set(seenKey, '1');
      say(HINTS[page], 'greet');
    } else {
      act('greet', 1600);
    }
  }, 900);

  // Иногда здоровается сам
  setInterval(() => { if (!document.hidden) act('greet', 1600); }, 30000);
})();
