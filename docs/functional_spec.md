# Functional Specification: Local Bookshelf

## Overview
Local Bookshelf is a cross-platform desktop application built with Electron and SQLite. It manages personal digital book collections, providing metadata enrichment, powerful browsing tools, and an AI-assisted reading experience across macOS and Windows.

## Personas and Goals
- **Digital Librarian** – wants to curate themed collections from folders on disk, add covers, and maintain consistent metadata.
- **Researcher** – needs to rapidly search, filter, and preview books across formats, and export excerpts or entire books as PDF.
- **Casual Reader** – prefers visually rich browsing, listening to books read aloud, and conversing with an AI about their library.

## User Stories
1. As a Librarian, I can create a new collection from one or more filesystem paths, name it, and select a cover image.
2. As a Librarian, I can scan selected paths to populate the collection with detected book files and automatically enrich their metadata.
3. As a Librarian, I can re-run scans to discover new books or refresh metadata.
4. As a Researcher, I can browse collections via a dashboard that combines statistics and card-based shortcuts.
5. As a Researcher, I can search by keyword, book title, classification, or publication year, and switch between card or table layouts with pagination.
6. As a Reader, I can preview any supported book format, adjust zoom, toggle fullscreen, and reveal the source file on disk.
7. As a Reader, I can export any supported book to PDF.
8. As a Reader, I can continue reading where I left off in a collection.
9. As a Reader, I can start an AI chat about the contents of the books in a collection.

## Functional Requirements
### Application Shell
- Built on Electron 27+ for macOS (Apple Silicon & Intel) and Windows (x64, ARM64 optional).
- Bundled with SQLite database for persistent storage.
- Packaged using Electron Forge or Electron Builder, producing platform-specific installers.

### Home Dashboard
- **Layout**: Split vertically into
  - **Upper pane** – visualization widgets showing total books, books per collection, format distribution, and reading progress.
  - **Lower pane** – card grid of collections, with the first card reserved for "New Collection".
- **Collection cards** show cover image, title, total books, last accessed timestamp.
- **Hover actions** per card: Edit collection (name, cover, paths), Resume last reading session, Open AI chat for that collection.

### Collection Creation & Editing
- Multi-step modal or wizard:
  1. Select one or more source directories (drag-and-drop or file picker). Persist the path list for subsequent rescans.
  2. Enter collection name (required) and optional description.
  3. Upload or choose a cover image (accepts PNG/JPEG/WebP).
- Validation for duplicate names and inaccessible directories.
- On save, trigger a background scan job.

### File Scanning & Metadata Enrichment
- Recursively scan configured directories for supported file extensions: `pdf, mobi, txt, azw3, azw, doc, docx, epub, umd, chm`.
- For each file:
  - Extract base metadata: filename, size, modified date, detected format.
  - Detect ISBN using embedded metadata or regex heuristics.
  - Determine preliminary classification via on-device NLP model or rules based on title keywords.
  - If ISBN missing, query online sources (Douban API or alternative public book APIs) using title and author keywords.
  - Retrieve publication year and cover image from the same online sources when available.
- Store metadata and enrichment status in SQLite. Cache downloaded covers locally.
- Expose a job monitor that reports progress, successes, failures, and rate limits.

### Collection Detail View
- Toggle between **Card view** and **Table view**.
- Shared controls: search bar (full-text across title, description, notes), filter by classification (tree dropdown), filter by publication year range, and format filter.
- Pagination options: 10, 20, 50, 100, 200 items per page. Remember last selection per collection.
- Cards display cover, title, classification, year, and quick actions (preview, export, AI chat).
- Table includes sortable columns for title, author, classification, year, format, file size, date added, enrichment status.
- Provide bulk actions (select multiple books) for metadata refresh or export.

### Book Preview
- Built-in viewers for all supported formats:
  - Use PDF.js for PDF rendering.
  - Integrate Calibre-based tools or third-party libraries (e.g., epub.js, mobi-pocket conversion) with converters to HTML for preview.
  - Fallback conversion pipeline (e.g., Calibre command line) to generate temporary PDFs for unsupported direct preview.
- Features: zoom in/out, fit-to-width, fit-to-page, fullscreen toggle, page navigation, and bookmark management.
- Persist reading position per book per collection.

### Text-to-Speech (TTS)
- Provide male/female voices using platform-native TTS engines (macOS `NSSpeechSynthesizer`, Windows SAPI) or bundled cross-platform TTS service.
- Playback controls: play/pause, seek, adjust speed (0.5×, 1×, 1.25×, 1.5×, 2×, 3×).
- Highlight spoken text in the preview when available.

### Export to PDF
- Allow exporting any supported format to PDF via Calibre or similar conversion tool.
- Let users choose export destination and optionally include metadata page.
- Handle conversion progress and failures gracefully.

### AI Chat Integration
- Per-collection knowledge base: index full text of books using embeddings (e.g., local vector store like `llama-index` with SQLite or `chromadb`).
- Provide chat interface with context retrieval from the selected collection. Display source citations (book + page).
- Respect privacy: ensure online APIs are optional and configurable.

### Settings & Preferences
- Configure metadata sources, API keys, rate limits, and proxy.
- Manage storage paths for cached covers, previews, and embeddings.
- Set default pagination size, theme (light/dark), and analytics opt-in.

## Non-Functional Requirements
- **Performance**: handle collections of 10k books with responsive UI (<200ms interactions for search/filter).
- **Offline Mode**: allow basic browsing and preview without internet; metadata enrichment deferred when offline.
- **Security**: sandbox filesystem access to configured directories; store API tokens encrypted.
- **Accessibility**: keyboard navigation, screen reader labels, adjustable font sizes.
- **Internationalization**: support Chinese and English UI.

## Data Model (SQLite)
- `collections`: id, name, description, cover_path, created_at, updated_at, last_opened_at.
- `collection_paths`: id, collection_id, path.
- `books`: id, collection_id, title, original_filename, file_path, format, isbn, classification, publication_year, author, page_count, cover_path, summary, created_at, updated_at.
- `book_metadata_status`: id, book_id, enrichment_state, last_enriched_at, error_message.
- `reading_progress`: id, book_id, last_position, last_opened_at.
- `ai_sessions`: id, collection_id, created_at, updated_at, last_prompt, last_response.
- `ai_citations`: id, ai_session_id, book_id, location_ref.

## Key Technology Choices
- Electron + React + TypeScript frontend.
- Node.js backend within Electron for filesystem access and metadata extraction.
- SQLite via `better-sqlite3` for synchronous desktop-friendly access.
- Background jobs handled with Node worker threads or `bullmq`-style queue using SQLite.
- Preview pipeline leveraging existing open-source renderers (PDF.js, epub.js) and optional bundled Calibre command-line tools.
- AI chat powered by configurable LLM (local or cloud) with embeddings stored locally.

## Open Questions
- Which public APIs are permissible for ISBN lookup (Douban rate limits)?
- Should Calibre binaries be bundled or required as external dependency?
- How to handle DRM-protected formats (likely unsupported)?
- What caching strategy ensures cover/artwork stays fresh without excessive downloads?

## Milestones
1. **MVP** – Collection creation, scanning, card/table browsing, PDF preview.
2. **Enhanced Metadata** – External lookup, classification model, cover caching.
3. **Reader Experience** – Full-format preview support, TTS, export to PDF.
4. **AI Assistant** – Embedding pipeline, chat UI, citations.
5. **Packaging & Release** – Offline installers, auto-update channel, documentation.

