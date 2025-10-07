import { useMemo, useState } from 'react';

interface DashboardStat {
  id: string;
  label: string;
  value: string;
  helper: string;
}

interface CollectionPreview {
  id: string;
  title: string;
  description: string;
  stats: string;
  actions: string[];
}

interface TranslationPack {
  localeLabel: string;
  heroTitle: string;
  heroSubtitle: string;
  stats: DashboardStat[];
  collectionsTitle: string;
  collectionsSubtitle: string;
  collections: CollectionPreview[];
  newCollectionLabel: string;
  roadmapTitle: string;
  roadmapItems: string[];
}

const translations: Record<'en' | 'zh', TranslationPack> = {
  en: {
    localeLabel: 'Language',
    heroTitle: 'Local Bookshelf Experience Blueprint',
    heroSubtitle:
      'A bilingual reference UI that maps the Functional Specification into a tangible Electron + React layout skeleton.',
    stats: [
      { id: 'collections', label: 'Collections', value: '6', helper: 'Tracked across themed libraries' },
      { id: 'books', label: 'Books Indexed', value: '2,438', helper: 'All supported formats combined' },
      { id: 'enrichment', label: 'Metadata Enrichment', value: '87%', helper: 'Completed enrichment coverage' },
      { id: 'reading', label: 'Active Readers', value: '3', helper: 'Continue reading where you left off' }
    ],
    collectionsTitle: 'Collections',
    collectionsSubtitle: 'Hover actions lead to editing, reading, and AI conversations for each curated shelf.',
    collections: [
      {
        id: 'new-collection',
        title: 'New Collection',
        description: 'Launch the creation wizard to add folders, metadata, and a custom cover.',
        stats: 'Wizard · Drag & Drop Paths · Auto Scan',
        actions: ['Start Wizard']
      },
      {
        id: 'climate',
        title: 'Climate Futures Research',
        description: 'Deep dive into scientific reports, policy briefs, and open data handbooks.',
        stats: '412 books · Last opened 2 days ago',
        actions: ['Resume Reading', 'Open AI Chat', 'Edit']
      },
      {
        id: 'design',
        title: 'Design Systems',
        description: 'Pattern libraries, accessibility guidelines, and design tokens references.',
        stats: '198 books · Metadata 95% complete',
        actions: ['Preview Library', 'Export PDF Set', 'Edit']
      },
      {
        id: 'literature',
        title: 'Modern Chinese Literature',
        description: 'Digitised novels, essays, and poetry with bilingual commentary notes.',
        stats: '867 books · AI summaries enabled',
        actions: ['Continue Listening', 'Open AI Chat', 'Edit']
      }
    ],
    newCollectionLabel: 'Start Wizard',
    roadmapTitle: 'Key Experience Pillars',
    roadmapItems: [
      'Dashboard analytics combine collection health, format distribution, and last activity at a glance.',
      'Collection detail pages support card and table layouts with full-text search, filters, and pagination presets.',
      'Reader pipeline covers PDF, EPUB, MOBI, DOCX, TXT, and more with persistent bookmarks and TTS controls.',
      'AI assistant grounds every response in local embeddings, returning citations per answer turn.'
    ]
  },
  zh: {
    localeLabel: '语言',
    heroTitle: '本地书架体验蓝图',
    heroSubtitle: '基于功能规格的双语界面雏形，展示 Electron + React 架构的核心布局。',
    stats: [
      { id: 'collections', label: '收藏集', value: '6', helper: '按主题管理的数字书库' },
      { id: 'books', label: '已索引图书', value: '2,438', helper: '涵盖全部支持的格式' },
      { id: 'enrichment', label: '元数据完善率', value: '87%', helper: '自动补全的覆盖情况' },
      { id: 'reading', label: '活跃阅读者', value: '3', helper: '从上次进度无缝续读' }
    ],
    collectionsTitle: '收藏集',
    collectionsSubtitle: '悬停操作包括编辑、阅读与 AI 对话，快速进入任意策展书架。',
    collections: [
      {
        id: 'new-collection',
        title: '创建新收藏集',
        description: '打开多步骤向导，添加文件夹、元数据与封面。',
        stats: '向导 · 拖放路径 · 自动扫描',
        actions: ['启动向导']
      },
      {
        id: 'climate',
        title: '气候未来研究',
        description: '深入科学报告、政策文件与开放数据手册。',
        stats: '412 本 · 2 天前访问',
        actions: ['继续阅读', '开启 AI 对话', '编辑']
      },
      {
        id: 'design',
        title: '设计系统文库',
        description: '包含模式库、无障碍指南与设计令牌参考。',
        stats: '198 本 · 元数据完善率 95%',
        actions: ['预览文库', '批量导出 PDF', '编辑']
      },
      {
        id: 'literature',
        title: '现代中文文学',
        description: '小说、散文与诗歌，附中英双语注释。',
        stats: '867 本 · 已启用 AI 摘要',
        actions: ['继续听书', '开启 AI 对话', '编辑']
      }
    ],
    newCollectionLabel: '启动向导',
    roadmapTitle: '关键体验支柱',
    roadmapItems: [
      '仪表盘总览收藏健康、格式分布与最近活动，一屏掌握核心数据。',
      '收藏详情页提供卡片与表格双视图，支持全文搜索、分类过滤与分页记忆。',
      '阅读器覆盖 PDF、EPUB、MOBI、DOCX、TXT 等格式，并保存书签及朗读控制。',
      'AI 助手基于本地向量索引返回答案，并在每轮对话中附带引用。'
    ]
  }
};

export default function App() {
  const [locale, setLocale] = useState<'en' | 'zh'>('en');
  const pack = translations[locale];

  const renderCollections = useMemo(() => {
    return pack.collections.map((collection) => {
      const isNew = collection.id === 'new-collection';
      return (
        <div
          key={collection.id}
          className={`collection-card ${isNew ? 'new-collection-card' : ''}`}
        >
          <h4>{collection.title}</h4>
          <p>{collection.description}</p>
          <p>{collection.stats}</p>
          <div className="collection-actions">
            {collection.actions.map((action) => (
              <button key={action}>{action}</button>
            ))}
          </div>
        </div>
      );
    });
  }, [pack.collections]);

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div>
          <h1>{pack.heroTitle}</h1>
          <p>{pack.heroSubtitle}</p>
        </div>
        <div className="language-toggle" role="group" aria-label={pack.localeLabel}>
          <span>{pack.localeLabel}</span>
          <button
            type="button"
            className={locale === 'en' ? 'active' : ''}
            onClick={() => setLocale('en')}
          >
            English
          </button>
          <button
            type="button"
            className={locale === 'zh' ? 'active' : ''}
            onClick={() => setLocale('zh')}
          >
            中文
          </button>
        </div>
      </header>

      <section className="dashboard-grid" aria-label="dashboard">
        {pack.stats.map((stat) => (
          <article className="dashboard-card" key={stat.id}>
            <h3>{stat.label}</h3>
            <strong>{stat.value}</strong>
            <p>{stat.helper}</p>
          </article>
        ))}
      </section>

      <section className="collection-section">
        <div className="section-header">
          <h2>{pack.collectionsTitle}</h2>
          <p>{pack.collectionsSubtitle}</p>
        </div>
        <div className="collection-grid">{renderCollections}</div>
      </section>

      <section className="collection-section">
        <div className="section-header">
          <h2>{pack.roadmapTitle}</h2>
        </div>
        <div className="dashboard-grid multi-column">
          {pack.roadmapItems.map((item, index) => (
            <article key={index} className="dashboard-card">
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
