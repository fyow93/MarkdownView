# Markdown Viewer - Next.js Edition

A modern Markdown document viewer built with Next.js and shadcn/ui.

## 🌍 Languages

- [中文](README.md)
- [English](README.en.md)

## 🚀 Key Features

- **🎨 Modern UI**: Beautiful interface design based on shadcn/ui component library with gradient backgrounds and animations
- **📱 Responsive Design**: Perfect adaptation for desktop and mobile devices with smooth user experience
- **📁 Smart Directory Selection**: One-click project directory selection through UI interface, supporting both browsing and manual input methods
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
│   │   ├── [locale]/                   # Internationalized routes
│   │   │   ├── api/
│   │   │   │   ├── config/
│   │   │   │   │   └── project-root/
│   │   │   │   │       └── route.ts    # Project root configuration API
│   │   │   │   ├── directories/
│   │   │   │   │   └── route.ts        # Directory browsing API
│   │   │   │   ├── filetree/
│   │   │   │   │   └── route.ts        # File tree API
│   │   │   │   └── file/
│   │   │   │       └── [...filename]/
│   │   │   │           └── route.ts    # File content API
│   │   │   ├── layout.tsx              # Internationalized layout
│   │   │   └── page.tsx                # Internationalized main page
│   │   ├── api/                        # Compatible API routes
│   │   │   ├── filetree/
│   │   │   │   └── route.ts            # File tree API
│   │   │   └── file/
│   │   │       └── [...filename]/
│   │   │           └── route.ts        # File content API
│   │   ├── globals.css                 # Global styles
│   │   ├── layout.tsx                  # Root layout
│   │   └── page.tsx                    # Root redirect
│   ├── components/
│   │   ├── FileTree.tsx                # File tree component
│   │   ├── DropdownFileTree.tsx        # Dropdown file tree component (with directory selector)
│   │   ├── MarkdownViewer.tsx          # Markdown viewer component
│   │   ├── GitHubStar.tsx              # GitHub star component
│   │   ├── ThemeProvider.tsx           # Theme provider
│   │   ├── ThemeToggle.tsx             # Theme toggle component
│   │   ├── LanguageToggle.tsx          # Language toggle component
│   │   └── ui/                         # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── badge.tsx
│   │       ├── resizable.tsx
│   │       ├── scroll-area.tsx
│   │       └── separator.tsx
│   ├── i18n/                           # Internationalization config
│   │   ├── request.ts                  # Internationalization request config
│   │   └── routing.ts                  # Routing config
│   ├── lib/
│   │   └── utils.ts                    # Utility functions
│   └── middleware.ts                   # Internationalization middleware
├── messages/                           # Internationalization translation files
│   ├── en.json                         # English translations
│   └── zh.json                         # Chinese translations
├── example.md                          # Feature demo document
├── config.js                           # Application config
├── components.json                     # shadcn/ui config
├── env.example                         # Optional environment variables example
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

### 3. Select Project Directory

**🎯 One-Click Configuration - No Environment Variables Required!**

1. **After starting the application**, click the **"File Tree"** button at the top
2. **Click "Change Directory"** to open the directory selector
3. **Two selection methods**:
   - **📁 Browse Mode**: Navigate through directories using the interface
   - **⌨️ Manual Input**: Directly enter directory path (e.g., `/home/user/my-docs`)
4. **Click "Apply"** to save settings

**Default Directory**: The application defaults to `~/Documents` directory on first startup

**Example Mode**: If the selected directory is empty or doesn't exist, the application will display the feature demo document `example.md`, showcasing all supported Markdown features.

**✨ Features**:
- 🚀 **Instant Effect**: File tree updates immediately after directory selection
- 💾 **Auto Memory**: Application remembers your selected directory
- 🔒 **Security Restrictions**: Only allows access to user home directory and subdirectories for system security

## 📱 Feature Description

### Desktop
- **New Layout Design**: Left TOC navigation + main content area + resizable file tree in top-left corner
- **Smart TOC**: Left panel showing document TOC with quick navigation support
- **Resizable File Tree**: Floating file tree in top-left corner with minimize/maximize support

### Mobile
- **Slide Menu**: Tap the menu button in top-left corner to open file tree
- **Auto Collapse**: Automatically close sidebar after file selection
- **Touch Friendly**: Optimized touch interaction experience

### Smart Directory Selector
- 🎯 **One-Click Configuration**: Click "Change Directory" to select project directory
- 📁 **Browse Mode**: Navigate through directories using the interface with breadcrumb navigation
- ⌨️ **Manual Input**: Directly enter directory path for advanced users
- 🔒 **Security Restrictions**: Only allows access to user home directory and subdirectories for system security
- 💾 **Auto Memory**: Application remembers selected directory and automatically restores on next startup

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

### Optional Environment Variables
If needed, you can create a `.env` file for optional configurations:
```bash
# Copy example file
cp env.example .env

# Edit optional configurations (port, polling interval, etc.)
nano .env
```

**Note**: Project directory configuration is now fully managed through the UI interface, no environment variables required.

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