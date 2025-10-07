import { translations } from './data.js';

const root = document.getElementById('root');
let currentLocale = 'en';

function createElement(tag, options = {}) {
  const element = document.createElement(tag);
  if (options.className) {
    element.className = options.className;
  }
  if (options.text) {
    element.textContent = options.text;
  }
  if (options.html) {
    element.innerHTML = options.html;
  }
  if (options.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }
  if (options.children) {
    options.children.forEach((child) => {
      element.appendChild(child);
    });
  }
  return element;
}

function renderTopBar(pack) {
  const titleGroup = createElement('div');
  titleGroup.appendChild(createElement('h1', { text: pack.heroTitle }));
  titleGroup.appendChild(createElement('p', { text: pack.heroSubtitle }));

  const toggle = createElement('div', {
    className: 'language-toggle',
    attributes: { role: 'group', 'aria-label': pack.localeLabel }
  });
  toggle.appendChild(createElement('span', { text: pack.localeLabel }));

  const englishButton = createElement('button', {
    text: 'English',
    className: currentLocale === 'en' ? 'active' : ''
  });
  englishButton.type = 'button';
  englishButton.addEventListener('click', () => switchLocale('en'));

  const chineseButton = createElement('button', {
    text: '中文',
    className: currentLocale === 'zh' ? 'active' : ''
  });
  chineseButton.type = 'button';
  chineseButton.addEventListener('click', () => switchLocale('zh'));

  toggle.appendChild(englishButton);
  toggle.appendChild(chineseButton);

  return createElement('header', {
    className: 'top-bar',
    children: [titleGroup, toggle]
  });
}

function renderStats(pack) {
  const statsGrid = createElement('section', {
    className: 'dashboard-grid',
    attributes: { 'aria-label': 'dashboard' }
  });

  pack.stats.forEach((stat) => {
    const card = createElement('article', { className: 'dashboard-card' });
    card.appendChild(createElement('h3', { text: stat.label }));
    card.appendChild(createElement('strong', { text: stat.value }));
    card.appendChild(createElement('p', { text: stat.helper }));
    statsGrid.appendChild(card);
  });

  return statsGrid;
}

function renderCollections(pack) {
  const section = createElement('section', { className: 'collection-section' });
  const header = createElement('div', { className: 'section-header' });
  header.appendChild(createElement('h2', { text: pack.collectionsTitle }));
  header.appendChild(createElement('p', { text: pack.collectionsSubtitle }));

  const grid = createElement('div', { className: 'collection-grid' });

  pack.collections.forEach((collection) => {
    const isNew = collection.id === 'new-collection';
    const card = createElement('div', {
      className: `collection-card${isNew ? ' new-collection-card' : ''}`
    });

    card.appendChild(createElement('h4', { text: collection.title }));
    card.appendChild(createElement('p', { text: collection.description }));
    card.appendChild(createElement('p', { text: collection.stats }));

    const actionRow = createElement('div', { className: 'collection-actions' });
    collection.actions.forEach((action) => {
      const button = createElement('button', { text: action });
      button.type = 'button';
      actionRow.appendChild(button);
    });
    card.appendChild(actionRow);

    grid.appendChild(card);
  });

  section.appendChild(header);
  section.appendChild(grid);
  return section;
}

function renderRoadmap(pack) {
  const section = createElement('section', { className: 'collection-section' });
  section.appendChild(
    createElement('div', {
      className: 'section-header',
      children: [createElement('h2', { text: pack.roadmapTitle })]
    })
  );

  const grid = createElement('div', { className: 'dashboard-grid multi-column' });
  pack.roadmapItems.forEach((item) => {
    const card = createElement('article', { className: 'dashboard-card' });
    card.appendChild(createElement('p', { text: item }));
    grid.appendChild(card);
  });

  section.appendChild(grid);
  return section;
}

function renderApp() {
  const pack = translations[currentLocale];
  root.innerHTML = '';
  const appShell = createElement('div', { className: 'app-shell' });
  appShell.appendChild(renderTopBar(pack));
  appShell.appendChild(renderStats(pack));
  appShell.appendChild(renderCollections(pack));
  appShell.appendChild(renderRoadmap(pack));
  root.appendChild(appShell);
}

function switchLocale(locale) {
  if (locale === currentLocale) {
    return;
  }
  if (!translations[locale]) {
    console.warn(`Locale ${locale} is not available.`);
    return;
  }
  currentLocale = locale;
  renderApp();
}

document.addEventListener('DOMContentLoaded', renderApp);
