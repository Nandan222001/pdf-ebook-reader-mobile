# 📖 PDF eBook Reader — Mobile

A beautiful, production-ready cross-platform **mobile** PDF e-book reader with a book-like UI/UX, powerful local annotations, and SQLite persistence.

> Built with **React Native + Expo + TypeScript + NativeWind (Tailwind) + SQLite**

![React Native](https://img.shields.io/badge/React%20Native-0.74-cyan) ![Expo](https://img.shields.io/badge/Expo-51-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue) ![SQLite](https://img.shields.io/badge/SQLite-expo--sqlite-green)

## ✨ Features

### 📚 Library
- **Grid view** of all books with gradient covers and progress bars
- **PDF import** via system document picker (multi-file support)
- **Search** by title or author
- **Filters**: All books, Recently Read, Favorites
- **Long-press** context menu: toggle favorite, delete
- **Pull-to-refresh** to reload library

### 📖 Reading Mode
- **Full-screen PDF viewer** with tap-to-toggle toolbar
- **Page navigation**: first/prev/next/last buttons + page counter
- **Zoom controls** (50%–300%)
- **3 themes**: Dark, Light, Sepia
- **Auto-save** reading progress
- **Bottom progress bar** with percentage

### 📑 Annotations
- **Bookmarks**: Add/remove per page, jump to any bookmark
- **Highlights**: 5 color options, persistent across sessions
- **Notes**: Page-specific typed notes
- **Export**: Share annotations as Markdown via system share sheet

### 📊 Statistics
- Total books, pages read, time spent
- **Reading streaks** (current and longest)
- **Daily activity chart** (last 30 days)
- Top books by progress

### ⚙️ Settings
- User profile (name, email)
- Theme selection with preview
- Reading preferences (page numbers, sound)
- Export annotations

### 🔒 Privacy & Offline
- **100% offline** — all data stored locally in SQLite
- No cloud, no telemetry, no accounts

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your device (or an emulator)

### Installation

```bash
# Clone the repository
git clone https://github.com/Nandan222001/pdf-ebook-reader-mobile.git
cd pdf-ebook-reader-mobile

# Install dependencies
npm install

# Start the development server
npx expo start
```

Then scan the QR code with Expo Go (Android) or the Camera app (iOS), or press:
- `a` to run on Android emulator
- `i` to run on iOS simulator

### Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas login
eas build:configure

# Build for Android (APK)
eas build -p android --profile preview

# Build for iOS
eas build -p ios --profile preview

# Production build
eas build --profile production
```

## 🏗️ Architecture

### Project Structure
```
pdf-ebook-reader-mobile/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout (DB init, navigation)
│   ├── reader.tsx                # PDF reader screen
│   └── (tabs)/                   # Bottom tab navigation
│       ├── _layout.tsx           # Tab bar configuration
│       ├── index.tsx             # Library screen
│       ├── stats.tsx             # Statistics screen
│       └── settings.tsx          # Settings screen
├── src/
│   ├── components/
│   │   ├── BookCard.tsx          # Library book card with gradient cover
│   │   ├── ReaderSidebar.tsx     # Annotation sidebar (bookmarks/highlights/notes)
│   │   └── HighlightPopup.tsx    # Color picker for highlights
│   ├── db/
│   │   ├── schema.ts             # SQLite schema definition
│   │   ├── database.ts           # Database connection management
│   │   └── repositories.ts       # CRUD operations for all entities
│   ├── lib/
│   │   └── utils.ts              # Utilities (formatters, theme colors, export)
│   ├── store/
│   │   └── useStore.ts           # Zustand global state
│   ├── shared/
│   │   └── types.ts              # Shared TypeScript types
│   └── global.css                # NativeWind Tailwind directives
├── app.json                      # Expo configuration
├── eas.json                      # EAS Build configuration
├── tailwind.config.js            # Tailwind/NativeWind config
├── metro.config.js               # Metro bundler config
├── babel.config.js               # Babel config with NativeWind
├── tsconfig.json
└── package.json
```

### Database Schema

| Table | Purpose |
|-------|---------|
| `user_profile` | User name, email, preferences (JSON) |
| `books` | Library of PDFs with metadata, progress, favorites |
| `bookmarks` | Page-level bookmarks with title and note |
| `highlights` | Text highlights with color and optional note |
| `annotations` | Page-specific notes |
| `reading_sessions` | Individual reading session tracking |
| `reading_streaks` | Daily reading streak data |

### Tech Stack

| Technology | Purpose |
|-----------|---------|
| React Native 0.74 | Cross-platform mobile framework |
| Expo 51 | Managed development & build |
| TypeScript 5.3 | Type safety |
| NativeWind (Tailwind) | Styling |
| expo-sqlite | Local SQLite database |
| react-native-pdf | PDF rendering |
| expo-document-picker | PDF file import |
| expo-file-system | File operations |
| expo-router | File-based navigation |
| Zustand | State management |
| lucide-react-native | Icons |
| expo-linear-gradient | Book cover gradients |

## 📱 Platform Support

- **Android**: API 24+ (Android 7.0+)
- **iOS**: iOS 15.1+
- **Tablet**: Supported (adaptive grid layout)

## 📝 License

MIT © Nandan222001
