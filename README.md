# Local Bookshelf

This repository captures the product and technical specification for the Local Bookshelf desktop application. The app will be built with Electron and SQLite, runs on macOS and Windows, and offers:

- A dashboard combining visual analytics with card-based collection management.
- Multi-path collection creation with automatic metadata enrichment (classification, ISBN, publication year, cover art).
- Rich browsing with search, tree-filtered classifications, pagination, and card/table layouts.
- A universal reader that previews common ebook formats, exports to PDF, and reveals the source file directly in Finder/Explorer.
- AI-assisted conversations grounded in the contents of each collection.

See [`docs/functional_spec.md`](docs/functional_spec.md) for the detailed functional specification.

## Development Setup / 开发环境准备

### 1. Install dependencies / 安装依赖

```bash
npm install
```

The install script will automatically rebuild the bundled `better-sqlite3` native module against the local Electron headers. If the rebuild is skipped (for example when using `--ignore-scripts`), run `npm run postinstall` manually before launching the app. 安装脚本会自动重新编译 `better-sqlite3`，如果因为参数跳过了脚本，请手动执行 `npm run postinstall`。

### 2. Start development mode / 启动开发模式

```bash
npm run dev
```

This command launches the Electron main process, loads the renderer bundle from `src/renderer`, and opens the application window locally with DevTools enabled. 在开发模式下运行 Electron 主进程，并在本地打开应用窗口（自动开启调试工具）。

If the window renders empty content, check the DevTools console for native module errors. The application now falls back to the built-in seed data so the dashboard still renders, but you should ensure the `better-sqlite3` module finished rebuilding to enable persistence features. 如果首页仍然空白，请打开 DevTools 检查是否有原生模块报错。应用已经支持回退到内置种子数据以保证仪表盘正常渲染，但仍建议确认 `better-sqlite3` 已正确编译以启用状态持久化。

### 3. Build static assets / 构建静态资源

```bash
npm run build
```

The script copies the renderer assets into the `dist/` directory. 该脚本会将前端静态资源复制到 `dist/` 目录，为后续打包做准备。

### 4. Optional: serve the renderer standalone / 可选：单独预览前端

```bash
npm run serve
```

This starts a lightweight static server on `http://localhost:4173` that serves the renderer bundle without launching Electron. 注意：在浏览器中打开时不会提供原生 API，仅供静态预览使用。

## Packaging for Release / 发布打包

The project uses the plain Electron runtime, so packaging relies on [`electron-packager`](https://github.com/electron/electron-packager). You can invoke it on-demand with `npx` without permanently adding a dependency. 项目默认使用 Electron 运行时，可以直接通过 `npx electron-packager` 进行跨平台打包。

Before packaging, ensure the static assets are up to date:

```bash
npm run build
```

Then run one of the following commands depending on your target platform. `--overwrite` ensures old artifacts are replaced, and `--out release` places the bundles inside the `release/` folder.

### macOS (Intel & Apple Silicon) / macOS（Intel 与 Apple Silicon）

```bash
npx electron-packager . "Local Bookshelf" \
  --platform=darwin \
  --arch=x64,arm64 \
  --out=release \
  --overwrite
```

### Windows

```bash
npx electron-packager . "Local Bookshelf" \
  --platform=win32 \
  --arch=ia32,x64 \
  --out=release \
  --overwrite
```

### Linux

```bash
npx electron-packager . "Local Bookshelf" \
  --platform=linux \
  --arch=x64,arm64 \
  --out=release \
  --overwrite
```

You can adjust the `--arch` values to match the required CPU architectures. 根据需要调整 `--arch` 参数即可生成目标架构的安装包。

## Deploying the packaged app / 部署

After packaging completes, the distributable artifacts live in the `release/` directory. macOS builds contain an `.app` bundle, Windows builds produce a folder with the executable, and Linux builds create platform-specific binaries. 生成好的安装包会放在 `release/` 目录下，可根据平台复制或压缩后分发。

For internal testing you can run the packaged binary directly from the output directory. For external distribution, sign the binaries according to the target platform (e.g., Apple notarisation, Windows code signing) before shipping. 在内部测试时可以直接运行输出目录中的可执行文件，正式发布前请按照对应平台的签名与公证流程处理。
