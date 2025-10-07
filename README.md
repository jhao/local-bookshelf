# Local Bookshelf

This repository captures the product and technical specification for the Local Bookshelf desktop application. The app will be built with Electron and SQLite, runs on macOS and Windows, and offers:

- A dashboard combining visual analytics with card-based collection management.
- Multi-path collection creation with automatic metadata enrichment (classification, ISBN, publication year, cover art).
- Rich browsing with search, tree-filtered classifications, pagination, and card/table layouts.
- A universal reader that previews common ebook formats, exports to PDF, and provides configurable text-to-speech.
- AI-assisted conversations grounded in the contents of each collection.

See [`docs/functional_spec.md`](docs/functional_spec.md) for the detailed functional specification.

## Development Setup / 开发环境准备

1. Install dependencies 安装依赖：
   ```bash
   npm install
   ```
2. Start the bilingual Electron + React workspace 启动中英文双语界面：
   ```bash
   npm run dev
   ```
   The command launches the Vite renderer dev server and boots Electron with hot-reloading TypeScript support.

3. Build production assets 构建生产资源：
   ```bash
   npm run build
   ```
