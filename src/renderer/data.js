export const translations = {
  en: {
    localeLabel: 'Language',
    heroTitle: 'Local Library Management',
    heroSubtitle: '',
    actionBar: {
      openSettings: 'Settings',
      toggleMonitor: 'Background Jobs'
    },
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
        stats: 'Wizard · Folder Picker · Auto Scan',
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
        actions: ['Preview Library', 'Edit']
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
    ],
    wizard: {
      title: 'New Collection Wizard',
      steps: [
        { title: 'Choose Folders', helper: 'Pick directories for the collection using the folder picker.' },
        { title: 'Describe Collection', helper: 'Add a name and optional description for quick discovery.' },
        { title: 'Select Cover', helper: 'Upload a PNG, JPG, or WebP image that represents the shelf.' }
      ],
      browseForPath: 'Choose folders…',
      emptyPathHelper: 'No folders selected yet. Start with a handbook archive, downloads folder, or NAS share.',
      selectedTitle: 'Selected folders',
      editPath: 'Change…',
      removePath: 'Remove',
      duplicatePath: 'This folder has already been added.',
      nameLabel: 'Collection Name',
      descriptionLabel: 'Description',
      coverLabel: 'Cover Image',
      browseLabel: 'Browse…',
      dropHint: 'Use a 1280×720 image for best quality.',
      next: 'Next',
      back: 'Back',
      cancel: 'Cancel',
      finish: 'Create Collection',
      validations: {
        missingName: 'Please provide a collection name.',
        duplicateName: 'A collection with the same name already exists.',
        missingPaths: 'Select at least one accessible directory.',
        invalidCover: 'Only PNG, JPG, and WebP formats are supported.'
      },
      successTitle: 'Scan Started',
      successBody:
        'We are scanning your folders in the background. Progress appears in the job monitor and collection dashboard.'
    },
    scanOverlay: {
      title: 'Scanning {name}',
      subtitle: 'We are indexing your selected folders. Progress updates in real time.',
      progressLabel: 'Progress',
      statusLabel: 'Status',
      status: {
        queued: 'Waiting to start',
        running: 'Scanning folders…',
        completed: 'Scan complete'
      },
      pathsTitle: 'Folders being indexed',
      logTitle: 'Activity log',
      logs: {
        empty: 'Waiting for the scanner to begin…',
        queued: 'Job queued and pending worker availability.',
        start: 'Started scanning {path}.',
        discovery: 'Discovering folder structure and counting documents…',
        metadata: 'Extracting metadata from supported formats…',
        embeddings: 'Generating embeddings for AI answers…',
        completed: 'Scan completed successfully.',
        fallbackPath: 'selected folders'
      },
      buttons: {
        home: 'Return home',
        openCollection: 'Open collection'
      },
      fallbackName: 'collection'
    },
    monitor: {
      title: 'Background Jobs',
      tableHeaders: ['Job', 'Collection', 'Progress', 'Status', 'Updated'],
      empty: 'No active jobs. Launch a rescan or metadata refresh to see updates.',
      statuses: {
        queued: 'Queued',
        running: 'Scanning',
        completed: 'Completed',
        failed: 'Failed'
      }
    },
    collectionDetail: {
      titlePrefix: 'Collection',
      subtitle: 'Search, filter, and manage every title inside this shelf.',
      lastScanLabel: 'Last scan',
      searchPlaceholder: 'Search title, author, notes…',
      filtersToggle: 'Show filters',
      activeFilters: 'Active filters',
      directories: 'Included directories',
      directoryEmpty: 'No directories have been configured yet.',
      editDirectories: 'Edit directories',
      directorySaved: 'Directories updated',
      rescanCompleted: 'Scan completed',
      metadataUpdated: 'Metadata refreshed',
      filters: {
        classification: 'Classification',
        format: 'Format',
        publication: 'Publication year',
        from: 'From',
        to: 'To',
        reset: 'Reset'
      },
      directoryEditor: {
        placeholder: 'One directory per line…',
        rescan: 'Rescan after saving',
        save: 'Save changes',
        cancel: 'Cancel'
      },
      layoutToggle: {
        cards: 'Card view',
        table: 'Table view'
      },
      pagination: {
        label: 'Items per page',
        previous: 'Previous',
        next: 'Next'
      },
      bulkActions: {
        title: 'Bulk actions',
        refreshMetadata: 'Refresh metadata',
        selectAll: 'Select all',
        clear: 'Clear selection'
      },
      cardActions: {
        preview: 'Preview',
        export: 'Export',
        chat: 'AI Chat'
      },
      tableHeaders: ['Title', 'Author', 'Classification', 'Year', 'Format', 'Size', 'Date Added', 'Enrichment', 'Actions'],
      noResults: 'No books match your current filters.',
      resumeReading: 'Resume last session',
      rescan: 'Rescan folders',
      refresh: 'Refresh metadata',
      openChat: 'Open AI chat'
    },
    previewPanel: {
      title: 'Reader Preview',
      currentPage: 'Page',
      of: 'of',
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
      fitWidth: 'Fit width',
      fitPage: 'Fit page',
      previousPage: 'Previous page',
      nextPage: 'Next page',
      addBookmark: 'Add bookmark',
      removeBookmark: 'Remove bookmark',
      savedBookmark: 'Bookmark saved',
      removedBookmark: 'Bookmark removed',
      back: 'Back to collection',
      export: 'Export selection',
      metadataTitle: 'Book details',
      formatLabel: 'Format',
      sizeLabel: 'Size',
      pagesLabel: 'Pages',
      updatedLabel: 'Metadata updated'
    },
    ttsPanel: {
      title: 'Text-to-Speech',
      play: 'Play',
      pause: 'Pause',
      resume: 'Resume',
      stop: 'Stop',
      voice: 'Voice',
      speed: 'Speed',
      highlight: 'Highlight narration',
      male: 'Male',
      female: 'Female',
      neutral: 'Neutral'
    },
    exportDialog: {
      title: 'Export selection',
      subtitle: 'Choose a destination for the generated files.',
      count: '{count} books ready to export',
      destination: 'Destination folder',
      metadata: 'Include metadata cover page',
      start: 'Start export',
      cancel: 'Cancel',
      close: 'Close',
      idle: 'Ready to export',
      running: 'Exporting… {progress}%',
      completed: 'Export completed'
    },
    aiPanel: {
      title: 'AI Research Assistant',
      placeholder: 'Ask about themes, chapters, or request summaries…',
      send: 'Send',
      citationLabel: 'Source',
      newChat: 'New session',
      groundingNotice: 'Responses are grounded in locally indexed embeddings.'
    },
    settings: {
      title: 'Preferences',
      tabs: ['Metadata', 'Storage', 'Reader'],
      metadataSources: 'Metadata sources',
      apiKey: 'API key',
      rateLimit: 'Rate limit (req/min)',
      proxy: 'Proxy URL',
      cachePath: 'Cache directory',
      previewPath: 'Preview artifacts',
      embeddingsPath: 'Embeddings database',
      paginationDefault: 'Default pagination',
      theme: 'Theme',
      analytics: 'Usage analytics',
      offline: 'Offline mode',
      save: 'Save preferences',
      saved: 'Preferences saved'
    }
  },
  zh: {
    localeLabel: '语言',
    heroTitle: '本地图书管理',
    heroSubtitle: '',
    actionBar: {
      openSettings: '系统设置',
      toggleMonitor: '后台任务'
    },
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
        stats: '向导 · 文件夹选择 · 自动扫描',
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
        actions: ['预览文库', '编辑']
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
    ],
    wizard: {
      title: '新建收藏集向导',
      steps: [
        { title: '选择文件夹', helper: '通过文件夹选择器挑选需要扫描的目录。' },
        { title: '填写信息', helper: '添加名称与可选描述，便于快速识别。' },
        { title: '设置封面', helper: '上传 PNG、JPG 或 WebP 图片作为封面。' }
      ],
      browseForPath: '选择文件夹…',
      emptyPathHelper: '尚未选择文件夹，可以从手册档案、下载目录或 NAS 开始。',
      selectedTitle: '已选择的文件夹',
      editPath: '更改…',
      removePath: '删除',
      duplicatePath: '该文件夹已添加。',
      nameLabel: '收藏集名称',
      descriptionLabel: '简介',
      coverLabel: '封面图片',
      browseLabel: '浏览…',
      dropHint: '建议使用 1280×720 图片以获得最佳效果。',
      next: '下一步',
      back: '上一步',
      cancel: '取消',
      finish: '创建收藏集',
      validations: {
        missingName: '请填写收藏集名称。',
        duplicateName: '已存在同名收藏集。',
        missingPaths: '至少选择一个可访问的目录。',
        invalidCover: '仅支持 PNG、JPG、WebP 格式。'
      },
      successTitle: '扫描已启动',
      successBody: '我们正在后台扫描您的文件夹，进度会显示在任务监视器与收藏集面板。'
    },
    scanOverlay: {
      title: '正在扫描 {name}',
      subtitle: '系统正在索引所选文件夹，进度信息实时更新。',
      progressLabel: '进度',
      statusLabel: '状态',
      status: {
        queued: '等待开始',
        running: '扫描进行中…',
        completed: '扫描完成'
      },
      pathsTitle: '扫描中的文件夹',
      logTitle: '活动日志',
      logs: {
        empty: '正在等待扫描任务启动…',
        queued: '任务已排队，等待可用的扫描资源。',
        start: '开始扫描 {path}。',
        discovery: '正在识别目录结构并统计文档数量…',
        metadata: '正在解析文档元数据…',
        embeddings: '正在生成 AI 所需的向量数据…',
        completed: '扫描成功完成。',
        fallbackPath: '所选文件夹'
      },
      buttons: {
        home: '返回首页',
        openCollection: '进入该收藏集'
      },
      fallbackName: '收藏集'
    },
    monitor: {
      title: '后台任务',
      tableHeaders: ['任务', '收藏集', '进度', '状态', '更新时间'],
      empty: '暂无任务，可发起重新扫描或元数据刷新以查看动态。',
      statuses: {
        queued: '排队中',
        running: '扫描中',
        completed: '已完成',
        failed: '失败'
      }
    },
    collectionDetail: {
      titlePrefix: '收藏集',
      subtitle: '在此检索、过滤并管理书架中的每一本书。',
      lastScanLabel: '最近扫描',
      searchPlaceholder: '搜索标题、作者或笔记…',
      filtersToggle: '显示筛选',
      activeFilters: '已选条件',
      directories: '覆盖目录',
      directoryEmpty: '尚未配置目录。',
      editDirectories: '编辑目录',
      directorySaved: '目录已更新',
      rescanCompleted: '扫描完成',
      metadataUpdated: '元数据已刷新',
      filters: {
        classification: '分类',
        format: '格式',
        publication: '出版年份',
        from: '起始',
        to: '结束',
        reset: '重置'
      },
      directoryEditor: {
        placeholder: '每行一个目录…',
        rescan: '保存后重新扫描',
        save: '保存修改',
        cancel: '取消'
      },
      layoutToggle: {
        cards: '卡片视图',
        table: '表格视图'
      },
      pagination: {
        label: '每页数量',
        previous: '上一页',
        next: '下一页'
      },
      bulkActions: {
        title: '批量操作',
        refreshMetadata: '刷新元数据',
        selectAll: '全选',
        clear: '清除'
      },
      cardActions: {
        preview: '预览',
        export: '导出',
        chat: 'AI 对话'
      },
      tableHeaders: ['标题', '作者', '分类', '年份', '格式', '大小', '添加时间', '完善状态', '操作'],
      noResults: '没有符合当前筛选条件的图书。',
      resumeReading: '继续上次阅读',
      rescan: '重新扫描目录',
      refresh: '刷新元数据',
      openChat: '打开 AI 对话'
    },
    previewPanel: {
      title: '阅读器预览',
      currentPage: '第',
      of: '页，共',
      zoomIn: '放大',
      zoomOut: '缩小',
      fitWidth: '适应宽度',
      fitPage: '适应页面',
      previousPage: '上一页',
      nextPage: '下一页',
      addBookmark: '添加书签',
      removeBookmark: '移除书签',
      savedBookmark: '书签已保存',
      removedBookmark: '书签已移除',
      back: '返回收藏集',
      export: '导出所选',
      metadataTitle: '图书信息',
      formatLabel: '格式',
      sizeLabel: '大小',
      pagesLabel: '页数',
      updatedLabel: '元数据更新时间'
    },
    ttsPanel: {
      title: '文本转语音',
      play: '播放',
      pause: '暂停',
      resume: '继续',
      stop: '停止',
      voice: '声音',
      speed: '语速',
      highlight: '高亮朗读文本',
      male: '男声',
      female: '女声',
      neutral: '中性'
    },
    exportDialog: {
      title: '导出选中图书',
      subtitle: '请选择导出文件的保存位置。',
      count: '共选中 {count} 本图书',
      destination: '目标文件夹',
      metadata: '附带元数据封面页',
      start: '开始导出',
      cancel: '取消',
      close: '关闭',
      idle: '等待导出',
      running: '正在导出… {progress}%',
      completed: '导出完成'
    },
    aiPanel: {
      title: 'AI 研究助手',
      placeholder: '询问主题、章节或请求摘要…',
      send: '发送',
      citationLabel: '引用来源',
      newChat: '新会话',
      groundingNotice: '回答基于本地嵌入索引并附带引用。'
    },
    settings: {
      title: '偏好设置',
      tabs: ['元数据', '存储', '阅读器'],
      metadataSources: '元数据来源',
      apiKey: 'API 密钥',
      rateLimit: '速率限制（次/分钟）',
      proxy: '代理地址',
      cachePath: '封面缓存路径',
      previewPath: '预览文件存储',
      embeddingsPath: '向量数据库',
      paginationDefault: '默认分页数量',
      theme: '主题',
      analytics: '使用分析',
      offline: '离线模式',
      save: '保存设置',
      saved: '设置已保存'
    }
  }
};
