# Local Bookshelf

This repository captures the product and technical specification for the Local Bookshelf desktop application. The app will be built with Electron and SQLite, runs on macOS and Windows, and offers:

- A dashboard combining visual analytics with card-based collection management.
- Multi-path collection creation with automatic metadata enrichment (classification, ISBN, publication year, cover art).
- Rich browsing with search, tree-filtered classifications, pagination, and card/table layouts.
- A universal reader that previews common ebook formats, exports to PDF, and provides configurable text-to-speech.
- AI-assisted conversations grounded in the contents of each collection.

See [`docs/functional_spec.md`](docs/functional_spec.md) for the detailed functional specification.

## Development Setup / 开发环境准备

The UI blueprint now ships as a static bundle with no external npm dependencies so it can be explored completely offline.

1. Install dependencies 安装依赖（离线环境无需下载任何包）：
   ```bash
   npm install
   ```
2. Start the bilingual preview server 启动中英文预览服务：
   ```bash
   npm run dev
   ```
   The command launches a lightweight Node.js static server on [http://localhost:4173](http://localhost:4173).

3. Build static assets 构建静态资源：
   ```bash
   npm run build
   ```
   The compiled files are copied into the `dist/` folder for sharing or packaging.
