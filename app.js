/**
 * Main application JavaScript
 * Improved and cleaned-up version
 */

document.addEventListener('DOMContentLoaded', function () {
  initTabs();
  initRoulette();
  initAnimations();
  checkUrlHash();

  window.addEventListener('hashchange', checkUrlHash);
});

/** ===================== Tabs ===================== **/

function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  if (!tabButtons.length || !tabContents.length) {
    console.warn('Tab elements not found');
    return;
  }

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      if (!tabId) return;

      history.pushState(null, null, `#${tabId}`);
      switchTab(tabId);
    });
  });
}

function switchTab(tabId) {
  const contents = document.querySelectorAll('.tab-content');
  const buttons = document.querySelectorAll('.tab-button');
  const target = document.getElementById(tabId);

  if (!target) {
    console.warn(`Tab "${tabId}" not found`);
    return;
  }

  contents.forEach(c => c.classList.remove('active'));
  buttons.forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });

  target.classList.add('active');
  const activeButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
  if (activeButton) {
    activeButton.classList.add('active');
    activeButton.setAttribute('aria-selected', 'true');
  }
}

function checkUrlHash() {
  const hash = window.location.hash.substring(1);
  if (hash && document.getElementById(hash)) {
    switchTab(hash);
  }
}

/** ===================== Sound ===================== **/

const Sound = {
  context: new (window.AudioContext || window.webkitAudioContext)(),

  playOscillator(frequencies = [], duration = 0.5) {
    try {
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();
      oscillator.type = 'sine';

      let time = this.context.currentTime;
      frequencies.forEach(f => {
        oscillator.frequency.setValueAtTime(f.value, time);
        time += f.duration;
      });

      gainNode.gain.setValueAtTime(0.1, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(this.context.destination);

      oscillator.start();
      oscillator.stop(this.context.currentTime + duration);
    } catch (e) {
      console.warn('AudioContext not supported', e);
    }
  },

  spinSound() {
    this.playOscillator([{ value: 800, duration: 0.25 }, { value: 200, duration: 0.25 }], 0.5);
  },

  winSound() {
    this.playOscillator([
      { value: 300, duration: 0.1 },
      { value: 600, duration: 0.1 },
      { value: 900, duration: 0.1 }
    ], 0.3);
  }
};

/** ===================== Music ===================== **/

const backgroundMusic = new Audio('background.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.3;

window.addEventListener('load', () => {
  backgroundMusic.play().catch(() => {
    document.addEventListener('click', () => {
      backgroundMusic.play();
    }, { once: true });
  });
});

/** ===================== Roulette ===================== **/

function initRoulette() {
  const wheel = document.getElementById('wheel');
  const spinBtn = document.getElementById('spin-btn');
  const result = document.getElementById('result');
  const prizeLabels = document.getElementById('prize-labels');
  const prizesList = document.getElementById('prizes-list');

  if (!wheel || !spinBtn || !result || !prizeLabels || !prizesList) {
    console.warn('Roulette elements not found');
    return;
  }

  const prizes = [
    "сабка на день в сносере",
    "деф на месяц",
    "деф на неделю",
    "ничего",
    "15 звёзд",
    "Одноразовый деф",
    "1 снос на человека по причине",
    "деф на 3 месяца"
  ];

  const SEGMENT_COUNT = prizes.length;
  const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;

  createPrizeLabels(prizeLabels, prizes);
  populatePrizesList(prizesList, prizes);

  let spinning = false;

  spinBtn.addEventListener('click', () => {
    if (spinning) return;
    spinning = true;
    spinBtn.disabled = true;

    result.textContent = "Крутим...";
    result.setAttribute('aria-live', 'polite');
    Sound.spinSound();

    const randomIndex = Math.floor(Math.random() * SEGMENT_COUNT);
    const extraRotations = 5 + Math.floor(Math.random() * 3); // 5-7
    const stopAngle = randomIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const finalDegrees = extraRotations * 360 + stopAngle;

    wheel.style.transition = 'none';
    wheel.style.transform = 'rotate(0deg)';
    void wheel.offsetWidth;

    wheel.style.transition = 'transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)';
    wheel.style.transform = `rotate(${finalDegrees}deg)`;

    setTimeout(() => {
      Sound.winSound();

      result.style.transform = 'scale(0.8)';
      result.style.opacity = '0.5';

      setTimeout(() => {
        const actualAngle = finalDegrees % 360;
        const prizeIndex = (SEGMENT_COUNT - Math.floor(actualAngle / SEGMENT_ANGLE)) % SEGMENT_COUNT;

        spinning = false;
        spinBtn.disabled = false;
      }, 200);
    }, 4000);
  });
}

/** ===================== Labels and Prizes ===================== **/

function createPrizeLabels(container, prizes) {
  container.innerHTML = '';
  const radius = 125;

  prizes.forEach((prize, index) => {
    const label = document.createElement('div');
    label.className = 'prize-label';

    const text = prize.length > 12 ? prize.slice(0, 10) + '...' : prize;
    label.textContent = text;

    const angle = index * 45 + 22.5;
    const radians = (angle - 90) * (Math.PI / 180);
    const x = Math.cos(radians) * radius;
    const y = Math.sin(radians) * radius;

    label.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
    container.appendChild(label);
  });
}

function populatePrizesList(container, prizes) {
  container.innerHTML = '';
  prizes.forEach(prize => {
    const li = document.createElement('li');
    li.textContent = prize;
    container.appendChild(li);
  });
}

/** ===================== Animations ===================== **/

function initAnimations() {
  const items = document.querySelectorAll('.price-item');
  items.forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
    });
  });

  const result = document.getElementById('result');
  if (result) {
    result.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
  }
}
