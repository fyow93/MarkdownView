# Markdown Viewer - Next.js Edition

A modern Markdown document viewer built with Next.js and shadcn/ui.

## 🌍 Languages

- [中文](README.md)
- [English](README.en.md)

## 🚀 Key Features

- **🎨 Modern UI**: Beautiful interface design based on shadcn/ui component library with gradient backgrounds and animations
- **📱 Responsive Design**: Perfect adaptation for desktop and mobile devices with smooth user experience
- **🗂️ Smart Table of Contents**: Auto-generated document TOC with quick navigation and current position highlighting
- **🌳 File Tree Navigation**: Left panel showing project file structure with expand/collapse support
- **📝 Markdown Rendering**: Support for GitHub Flavored Markdown including tables, task lists, etc.
- **💻 Code Highlighting**: Multi-language syntax highlighting using Prism.js with language labels
- **📊 Mermaid Charts**: Support for flowcharts, sequence diagrams, architecture diagrams, and more
- **🔧 Adjustable Layout**: Desktop support for drag-and-drop panel resizing
- **⚡ Real-time Monitoring**: Automatic file change detection and refresh (polling mode)
- **💾 Position Memory**: Auto-save and restore user's browsing position across sessions
- **🌙 Dark/Light Theme**: Toggle between dark and light themes with system preference support
- **🌐 Internationalization**: Support for Chinese and English languages

## 🛠️ Tech Stack

- **Frontend Framework**: Next.js 15 with App Router
- **UI Component Library**: shadcn/ui
- **Styling**: Tailwind CSS v4
- **Markdown Rendering**: react-markdown + remark-gfm
- **Code Highlighting**: react-syntax-highlighter
- **Charts**: Mermaid
- **Icons**: Lucide React
- **Internationalization**: next-intl
- **Theme**: next-themes

## 📁 Project Structure

```
MarkdownView/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── api/
│   │   │   │   ├── filetree/
│   │   │   │   │   └── route.ts        # File tree API
│   │   │   │   └── file/
│   │   │   │       └── [...filename]/
│   │   │   │           └── route.ts    # File content API
│   │   │   ├── layout.tsx              # Locale layout
│   │   │   └── page.tsx                # Main page
│   │   ├── globals.css                 # Global styles
│   │   ├── layout.tsx                  # Root layout
│   │   └── page.tsx                    # Root redirect
│   ├── components/
│   │   ├── FileTree.tsx                # File tree component
│   │   ├── DropdownFileTree.tsx        # Dropdown file tree
│   │   ├── MarkdownViewer.tsx          # Markdown viewer component
│   │   ├── ThemeProvider.tsx           # Theme provider
│   │   ├── ThemeToggle.tsx             # Theme toggle
│   │   ├── LanguageToggle.tsx          # Language toggle
│   │   └── ui/                         # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── resizable.tsx
│   │       ├── scroll-area.tsx
│   │       └── separator.tsx
│   ├── i18n/
│   │   ├── request.ts                  # Internationalization request config
│   │   └── routing.ts                  # Routing config
│   └── middleware.ts                   # Internationalization middleware
├── messages/
│   ├── en.json                         # English translations
│   └── zh.json                         # Chinese translations
├── example.md                          # Feature demo document
├── config.js                           # Application config
├── components.json                     # shadcn/ui config
├── start.sh                            # Startup script
├── check-status.sh                     # Status check script
└── package.json
```

## 🚀 Quick Start

### 1. Start the Application

Using the startup script:

```bash
# Development mode
./start.sh

# Production mode
./start.sh prod

# Build only
./start.sh build
```

Or use npm commands directly:

```bash
# Development mode
npm run dev

# Build and start production server
npm run build && npm start
```

### 2. Access the Application

Open your browser and visit [http://localhost:3000](http://localhost:3000)

### 3. Configure Project Root Directory

The application supports flexible project path configuration through multiple methods:

#### Method 1: Environment Variables (Recommended)
```bash
# Set project root path
export MARKDOWN_PROJECT_ROOT=/path/to/your/markdown/project

# Optional: Set other configurations
export PORT=3000
export HOST=localhost
export POLL_INTERVAL=3000

# Then start the application
./start.sh
```

#### Method 2: Create .env File
```bash
# Copy environment variable example file
cp env.example .env

# Edit .env file to set your project path
nano .env
```

#### Method 3: Modify Config File
Directly edit the default path in the `config.js` file.

**Default Path**: If no environment variables are set, the application will use `~/project-wiki`

**Example Mode**: If the configured project directory doesn't exist, the application will automatically display the feature demo document `example.md`, showcasing all supported Markdown features.

## 📱 Feature Description

### Desktop
- **New Layout Design**: Left TOC navigation + main content area + resizable file tree in top-left corner
- **Smart TOC**: Left panel showing document TOC with quick navigation support
- **Resizable File Tree**: Floating file tree in top-left corner with minimize/maximize support

### Mobile
- **Slide Menu**: Tap the menu button in top-left corner to open file tree
- **Auto Collapse**: Automatically close sidebar after file selection
- **Touch Friendly**: Optimized touch interaction experience

### File Tree Navigation
- 📁 **Folders**: Support expand/collapse, showing directory structure
- 📄 **Markdown Files**: Click to view content
- 🎯 **Current File**: Highlight the currently viewed file
- 💾 **Memory Function**: Remember the last selected file

### Smart Table of Contents
- 📋 **Auto Generation**: Scan document headings to auto-generate TOC, properly handling HTML tags
- 🎯 **Quick Navigation**: Click TOC items to quickly locate corresponding sections with smooth scrolling
- 📍 **Current Position**: Highlight current reading position
- 🔢 **Hierarchical Display**: Support multi-level heading hierarchy and indentation
- 👁️ **Display Control**: Show/hide TOC panel
- 🧹 **Text Cleaning**: Auto-remove HTML tags and Markdown format symbols

### Markdown Rendering
- **Standard Syntax**: Support complete Markdown syntax
- **GitHub Extensions**: Support tables, task lists, strikethrough, etc.
- **Syntax Highlighting**: Multi-language code highlighting
- **Chart Rendering**: Real-time Mermaid chart rendering

### Real-time Monitoring
- 📡 Automatically detect file changes and refresh content in real-time (polling mode)
- 🔌 Real-time monitoring connection status display
- ⚡ Manually enable/disable real-time monitoring
- 🔄 Maintain current scroll position when files change
- ⏱️ Check for file changes every 3 seconds

### Position Memory
- 📍 Auto-save scroll position for each file
- 🔄 Auto-restore to last browsing position after file refresh
- 💾 Remember last selected file after page refresh
- 🗑️ Support clearing position records for individual files
- 🎯 Smart debounced saving to avoid frequent writes

### Theme Support
- 🌙 **Dark Mode**: Elegant dark theme
- ☀️ **Light Mode**: Clean light theme
- 🖥️ **System Theme**: Follow system preference
- 🔄 **Smooth Transition**: Seamless theme switching

### Internationalization
- 🌐 **Multi-language**: Support Chinese and English
- 🔄 **Dynamic Switching**: Switch languages without page reload
- 📱 **Responsive**: Language toggle works on all devices
- 🎯 **Context Aware**: Proper translation for all UI elements

## 🔧 Custom Configuration

### Adding New shadcn/ui Components

```bash
npx shadcn@latest add [component-name]
```

### Modifying Theme

Edit CSS variables in `src/app/globals.css` to customize theme colors.

### Adding New Markdown Plugins

Add new plugins to the `remarkPlugins` or `rehypePlugins` arrays in `src/components/MarkdownViewer.tsx`.

### Adding New Languages

1. Add the new locale to `src/i18n/routing.ts`
2. Create a new translation file in `messages/[locale].json`
3. Update the language toggle component if needed

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

MIT License 