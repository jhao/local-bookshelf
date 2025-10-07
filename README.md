# Local Bookshelf

This repository captures the product and technical specification for the Local Bookshelf desktop application. The app will be built with Electron and SQLite, runs on macOS and Windows, and offers:

- A dashboard combining visual analytics with card-based collection management.
- Multi-path collection creation with automatic metadata enrichment (classification, ISBN, publication year, cover art).
- Rich browsing with search, tree-filtered classifications, pagination, and card/table layouts.
- A universal reader that previews common ebook formats, exports to PDF, and provides configurable text-to-speech.
- AI-assisted conversations grounded in the contents of each collection.

See [`docs/functional_spec.md`](docs/functional_spec.md) for the detailed functional specification.

## Development Setup / 开发环境准备

### 1. Install dependencies / 安装依赖

```bash
npm install
```

This installs Electron and the local build scripts used throughout development.

### 2. Run the Electron app in development / 启动开发模式的 Electron 应用

```bash
npm run dev
```

This command launches the Electron main process, loads the renderer bundle from `src/renderer`, and opens the application window locally. 在开发模式下运行 Electron 主进程，并从 `src/renderer` 加载前端界面。

### 3. Build static assets / 构建静态资源

```bash
npm run build
```

The script copies the renderer assets into the `dist/` directory. 该脚本会将前端静态资源复制到 `dist/` 目录，为后续打包做准备。

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
