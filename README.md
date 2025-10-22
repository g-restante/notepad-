# Notepad Pro

A modern cross-platform text editor built with Electron, React, TypeScript and Monaco Editor.

## Features

### 🎨 Modern Interface
- Clean and appealing design
- Light and dark themes
- Responsive layout
- Intuitive VS Code-like interface

### ⚡ Performance and Speed
- Based on Monaco Editor (same as VS Code)
- Fast rendering even for large files
- Quick application startup
- Efficient memory management

### 🔧 Advanced Features
- **Syntax highlighting** for multiple languages (JavaScript, TypeScript, HTML, CSS, Python, Java, C++, etc.)
- **Intelligent autocompletion**
- **Advanced search and replace** with regex support
- **Multiple tabs** management
- **Code minimap**
- **Code folding** (collapse/expand blocks)
- **Optional line numbering**
- **Configurable word wrap**
- **Dynamic text zoom**

### 💾 File Management
- Multiple file opening
- Auto-save
- Session management
- Support for all text formats

### ⚙️ Customization
- Configurable font sizes
- Tab settings (spaces vs tabs)
- Customizable themes
- Keyboard shortcuts

## Cross-Platform

✅ **Windows** (7, 8, 10, 11)  
✅ **macOS** (10.12+)  
✅ **Linux** (Ubuntu, Debian, Fedora, etc.)

## Installation

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Development
```bash
# Clone the repository
git clone https://github.com/your-username/notepad-pro.git
cd notepad-pro

# Install dependencies
npm install

# Start in development mode
npm run dev
```

### Production Build
```bash
# Build for all platforms
npm run build:all

# Platform-specific builds
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## Usage

### Keyboard Shortcuts

#### File
- `Ctrl/Cmd + N` - New file
- `Ctrl/Cmd + O` - Open file
- `Ctrl/Cmd + S` - Save
- `Ctrl/Cmd + Shift + S` - Save as

#### Editing
- `Ctrl/Cmd + F` - Find
- `Ctrl/Cmd + H` - Replace
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Y` - Redo
- `Ctrl/Cmd + A` - Select all

#### View
- `Ctrl/Cmd + +` - Zoom in
- `Ctrl/Cmd + -` - Zoom out
- `Ctrl/Cmd + 0` - Reset zoom

### Context Menu

The editor supports a rich context menu with options for:
- Copy, cut, paste
- Code formatting
- Go to definition
- Find references

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Editor**: Monaco Editor
- **UI Library**: Ant Design
- **State Management**: Zustand
- **Desktop**: Electron
- **Build**: Webpack + Electron Builder

## Architecture

```
src/
├── main/           # Electron main process
│   ├── main.ts     # Electron entry point
│   └── preload.ts  # Secure preload script
├── renderer/       # React renderer process
│   ├── components/ # React UI components
│   ├── store/      # Zustand state management
│   ├── types/      # TypeScript definitions
│   └── App.tsx     # Main component
└── assets/         # Static resources
```

## Configuration

The app supports customizable configurations through:
- Built-in UI settings
- Local configuration file
- Environment variables for development

### Environment Variables

```bash
NODE_ENV=development  # Development mode
ELECTRON_IS_DEV=1    # Electron debug
```

## Security

- Context isolation enabled
- Node integration disabled in renderer
- Secure preload script for IPC communication
- Sandboxing for additional security

## Contributing

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Roadmap

### v1.1
- [ ] Plugin system
- [ ] Custom syntax highlighting
- [ ] Multiple workspace support

### v1.2
- [ ] Git integration
- [ ] Integrated terminal
- [ ] Extensions marketplace

### v1.3
- [ ] Collaborative editing
- [ ] Cloud sync
- [ ] Mobile companion app

## 📦 Build and Distribution

### Local Build

To build and package the application locally:

```bash
# Build for current platform
npm run package

# Build for all platforms
npm run package:all

# Platform-specific builds
npm run package:mac     # macOS only
npm run package:win     # Windows only  
npm run package:linux   # Linux only
```

### Automated Releases with GitHub Actions

The project includes an automated CI/CD pipeline that:

1. **Builds on every push** to main branch
2. **Creates releases** when you push a version tag
3. **Supports all platforms**: macOS, Windows, Linux

#### To create a release:

1. Update version in `package.json`:
```json
{
  "version": "1.1.0"
}
```

2. Commit and push changes:
```bash
git add package.json
git commit -m "chore: bump version to v1.1.0"
git push origin main
```

3. Create and push a version tag:
```bash
git tag v1.1.0
git push origin v1.1.0
```

4. GitHub Actions will automatically:
   - Build the app for all platforms
   - Create installation packages (DMG for macOS, NSIS for Windows, AppImage/DEB for Linux)
   - Create a GitHub release with all artifacts

### Distribution Formats

- **macOS**: DMG installer + ZIP archive (Intel + Apple Silicon)
- **Windows**: NSIS installer + Portable executable (x64 + x86)
- **Linux**: AppImage + DEB package (x64)

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: support@notepad-pro.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/notepad-pro/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-username/notepad-pro/discussions)

## Credits

Created with ❤️ by Giuseppe Restante

- Monaco Editor by Microsoft
- Ant Design by Ant Group
- React by Meta
- Electron by GitHub