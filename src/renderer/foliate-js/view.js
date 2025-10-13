const FOLIATE_MESSAGES = {
  en: {
    loading: 'Loading book…',
    error: 'Unable to open book',
    empty: 'No book loaded',
    previous: 'Previous section',
    next: 'Next section',
    position: (index, total) => `Section ${index} of ${total}`
  },
  zh: {
    loading: '正在加载图书…',
    error: '无法打开图书',
    empty: '尚未加载图书',
    previous: '上一章节',
    next: '下一章节',
    position: (index, total) => `章节 ${index} / ${total}`
  }
};

function pickMessage(locale, key, ...args) {
  const normalized = locale && typeof locale === 'string' ? locale.toLowerCase() : 'en';
  const dictionary = FOLIATE_MESSAGES[normalized] || FOLIATE_MESSAGES.en;
  const value = dictionary[key];
  if (typeof value === 'function') {
    return value(...args);
  }
  if (typeof value === 'string') {
    return value;
  }
  return FOLIATE_MESSAGES.en[key] || '';
}

function arrayBufferToBase64(buffer) {
  if (!(buffer instanceof ArrayBuffer)) {
    return '';
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      color: #0f172a;
      font-family: 'Inter', 'PingFang SC', system-ui, sans-serif;
      background: #f8fafc;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(15, 23, 42, 0.08);
    }
    .foliate-shell {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
    }
    .foliate-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 16px;
      background: #e2e8f0;
      border-bottom: 1px solid rgba(15, 23, 42, 0.08);
    }
    .foliate-metadata {
      display: flex;
      flex-direction: column;
      min-width: 0;
      gap: 2px;
    }
    .foliate-title {
      font-weight: 600;
      font-size: 14px;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .foliate-author {
      font-size: 12px;
      color: rgba(15, 23, 42, 0.72);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .foliate-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .foliate-button {
      border: none;
      background: #0f172a;
      color: #f8fafc;
      border-radius: 999px;
      padding: 6px 12px;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    .foliate-button[disabled] {
      background: rgba(15, 23, 42, 0.2);
      cursor: not-allowed;
    }
    .foliate-button:not([disabled]):hover {
      background: #1e293b;
    }
    .foliate-position {
      font-size: 12px;
      color: rgba(15, 23, 42, 0.8);
      min-width: 72px;
      text-align: center;
    }
    .foliate-status {
      padding: 12px 16px;
      font-size: 14px;
      color: rgba(15, 23, 42, 0.72);
      background: rgba(15, 23, 42, 0.04);
      border-bottom: 1px solid rgba(15, 23, 42, 0.08);
    }
    .foliate-status[hidden] {
      display: none;
    }
    .foliate-content {
      flex: 1;
      overflow: auto;
      padding: 24px 32px;
      background: #fff;
      font-size: 16px;
      line-height: 1.7;
      color: #0f172a;
    }
    .foliate-page {
      max-width: 720px;
      margin: 0 auto;
    }
    .foliate-page h1,
    .foliate-page h2,
    .foliate-page h3,
    .foliate-page h4 {
      color: #0f172a;
      margin-top: 1.75em;
    }
    .foliate-page p {
      margin: 0 0 1em;
    }
    .foliate-page img,
    .foliate-page video,
    .foliate-page iframe {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
    }
    .foliate-image-placeholder {
      margin: 1em auto;
      padding: 12px;
      max-width: 520px;
      text-align: center;
      font-size: 13px;
      color: rgba(15, 23, 42, 0.6);
      background: rgba(148, 163, 184, 0.24);
      border-radius: 10px;
    }
    .foliate-empty {
      margin: 0;
      font-size: 15px;
      color: rgba(15, 23, 42, 0.6);
      text-align: center;
      padding: 48px 0;
    }
  </style>
  <div class="foliate-shell" part="shell">
    <div class="foliate-toolbar" part="toolbar">
      <div class="foliate-metadata">
        <span class="foliate-title" part="title"></span>
        <span class="foliate-author" part="creator"></span>
      </div>
      <div class="foliate-controls" part="controls">
        <button class="foliate-button foliate-prev" type="button"></button>
        <span class="foliate-position" part="position"></span>
        <button class="foliate-button foliate-next" type="button"></button>
      </div>
    </div>
    <div class="foliate-status" part="status" hidden></div>
    <section class="foliate-content" part="content">
      <article class="foliate-page" part="page"></article>
    </section>
  </div>
`;

class FoliateView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this._state = {
      loading: false,
      error: null,
      book: null,
      index: 0,
      locale: 'en'
    };

    this._toolbar = this.shadowRoot.querySelector('.foliate-toolbar');
    this._title = this.shadowRoot.querySelector('.foliate-title');
    this._author = this.shadowRoot.querySelector('.foliate-author');
    this._position = this.shadowRoot.querySelector('.foliate-position');
    this._status = this.shadowRoot.querySelector('.foliate-status');
    this._content = this.shadowRoot.querySelector('.foliate-content');
    this._page = this.shadowRoot.querySelector('.foliate-page');
    this._prev = this.shadowRoot.querySelector('.foliate-prev');
    this._next = this.shadowRoot.querySelector('.foliate-next');

    this._prev.addEventListener('click', () => this.previous());
    this._next.addEventListener('click', () => this.next());
    this.updateControls();
  }

  get locale() {
    return this._state.locale;
  }

  set locale(value) {
    if (!value || typeof value !== 'string') {
      return;
    }
    this._state.locale = value;
    this.updateControls();
  }

  connectedCallback() {
    this.render();
  }

  async open(source) {
    this._state.loading = true;
    this._state.error = null;
    this.render();
    try {
      const payload = await this.loadBook(source);
      this._state.book = payload.book || { metadata: {}, spine: [], styles: [] };
      this._state.book.metadata = this._state.book.metadata || {};
      if (source && typeof source === 'object' && source.metadata) {
        const fallback = source.metadata || {};
        this._state.book.metadata = {
          ...(payload.book?.metadata || {}),
          title: fallback.title || payload.book?.metadata?.title || '',
          creator: fallback.creator || payload.book?.metadata?.creator || ''
        };
      }
      if (source && typeof source === 'object' && source.locale) {
        this._state.locale = source.locale;
      } else if (payload.book?.metadata?.language) {
        this._state.locale = payload.book.metadata.language;
      }
      this._state.index = 0;
      this._state.loading = false;
      this.applyBookStyles(payload.book?.styles || []);
      this.render();
      this.dispatchRelocate();
    } catch (error) {
      console.warn('Foliate view failed to open book', error);
      this._state.loading = false;
      this._state.error = error?.message || pickMessage(this._state.locale, 'error');
      this.render();
      throw error;
    }
  }

  async loadBook(source) {
    if (source && source.book) {
      return { success: true, book: source.book };
    }
    let request = source;
    if (typeof source === 'string') {
      request = { objectUrl: source };
    }
    const base64 = await this.resolveBase64(request);
    if (!window.api?.openFoliate) {
      throw new Error('Foliate bridge unavailable');
    }
    const response = await window.api.openFoliate({ data: base64 });
    if (!response?.success || !response.book) {
      throw new Error(response?.error || pickMessage(this._state.locale, 'error'));
    }
    return response;
  }

  async resolveBase64(source = {}) {
    if (source.base64) {
      return source.base64;
    }
    if (source.data) {
      return source.data;
    }
    if (source.blob instanceof Blob) {
      const buffer = await source.blob.arrayBuffer();
      return arrayBufferToBase64(buffer);
    }
    if (source.objectUrl) {
      const response = await fetch(source.objectUrl);
      const buffer = await response.arrayBuffer();
      return arrayBufferToBase64(buffer);
    }
    throw new Error('Missing book data');
  }

  next() {
    if (!this._state.book) {
      return;
    }
    const nextIndex = Math.min(this._state.index + 1, this._state.book.spine.length - 1);
    if (nextIndex !== this._state.index) {
      this._state.index = nextIndex;
      this.render();
      this.dispatchRelocate();
    }
  }

  previous() {
    if (!this._state.book) {
      return;
    }
    const prevIndex = Math.max(this._state.index - 1, 0);
    if (prevIndex !== this._state.index) {
      this._state.index = prevIndex;
      this.render();
      this.dispatchRelocate();
    }
  }

  goTo(target) {
    if (!this._state.book) {
      return;
    }
    let index = null;
    if (typeof target === 'number' && Number.isFinite(target)) {
      index = Math.min(Math.max(Math.floor(target), 0), this._state.book.spine.length - 1);
    } else if (typeof target === 'string') {
      index = this._state.book.spine.findIndex((entry) => entry.href === target || entry.id === target);
    } else if (target && typeof target === 'object') {
      if (typeof target.index === 'number') {
        index = Math.min(Math.max(Math.floor(target.index), 0), this._state.book.spine.length - 1);
      } else if (target.href) {
        index = this._state.book.spine.findIndex((entry) => entry.href === target.href);
      } else if (target.id) {
        index = this._state.book.spine.findIndex((entry) => entry.id === target.id);
      }
    }
    if (index !== null && index >= 0 && index < this._state.book.spine.length) {
      this._state.index = index;
      this.render();
      this.dispatchRelocate();
    }
  }

  render() {
    this.updateControls();
    if (this._state.loading) {
      this.showStatus(pickMessage(this._state.locale, 'loading'));
      this._page.innerHTML = '';
      return;
    }
    if (this._state.error) {
      this.showStatus(this._state.error);
      this._page.innerHTML = `<p class="foliate-empty">${this._state.error}</p>`;
      return;
    }
    if (!this._state.book) {
      this.showStatus(pickMessage(this._state.locale, 'empty'));
      this._page.innerHTML = `<p class="foliate-empty">${pickMessage(this._state.locale, 'empty')}</p>`;
      return;
    }
    this.hideStatus();
    const entry = this._state.book.spine[this._state.index];
    const total = this._state.book.spine.length;
    const positionLabel = pickMessage(this._state.locale, 'position', this._state.index + 1, total);
    this._position.textContent = `${this._state.index + 1} / ${total}`;
    this._position.setAttribute('aria-label', positionLabel);
    this._title.textContent = this._state.book.metadata?.title || '';
    this._author.textContent = this._state.book.metadata?.creator || '';
    this._page.innerHTML = entry?.content || '';
  }

  updateControls() {
    const locale = this._state.locale || 'en';
    this._prev.textContent = '‹';
    this._next.textContent = '›';
    this._prev.setAttribute('aria-label', pickMessage(locale, 'previous'));
    this._next.setAttribute('aria-label', pickMessage(locale, 'next'));
    const total = this._state.book?.spine?.length || 0;
    this._prev.disabled = !this._state.book || this._state.index <= 0;
    this._next.disabled = !this._state.book || this._state.index >= total - 1;
  }

  showStatus(message) {
    this._status.textContent = message;
    this._status.hidden = false;
  }

  hideStatus() {
    this._status.hidden = true;
    this._status.textContent = '';
  }

  applyBookStyles(styles) {
    const existing = this.shadowRoot.querySelectorAll('style[data-foliate-style="dynamic"]');
    existing.forEach((element) => element.remove());
    if (!Array.isArray(styles) || !styles.length) {
      return;
    }
    styles.forEach((content) => {
      if (!content) {
        return;
      }
      const styleElement = document.createElement('style');
      styleElement.setAttribute('data-foliate-style', 'dynamic');
      styleElement.textContent = content;
      const shell = this.shadowRoot.querySelector('.foliate-shell');
      if (shell) {
        this.shadowRoot.insertBefore(styleElement, shell);
      } else {
        this.shadowRoot.appendChild(styleElement);
      }
    });
  }

  dispatchRelocate() {
    if (!this._state.book) {
      return;
    }
    const entry = this._state.book.spine[this._state.index];
    this.dispatchEvent(
      new CustomEvent('relocate', {
        detail: {
          index: this._state.index,
          total: this._state.book.spine.length,
          id: entry?.id || null,
          href: entry?.href || null
        }
      })
    );
  }
}

if (!customElements.get('foliate-view')) {
  customElements.define('foliate-view', FoliateView);
}
