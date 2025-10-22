# Notepad Pro

Un moderno editor di testo cross-platform costruito con Electron, React, TypeScript e Monaco Editor.

## Caratteristiche

### 🎨 Interfaccia Moderna
- Design pulito e accattivante
- Tema chiaro e scuro
- Layout responsivo
- Interfaccia intuitiva simile a VS Code

### ⚡ Performance e Velocità
- Basato su Monaco Editor (lo stesso di VS Code)
- Rendering veloce anche per file grandi
- Avvio rapido dell'applicazione
- Gestione efficiente della memoria

### 🔧 Funzionalità Avanzate
- **Evidenziazione sintassi** per linguaggi multipli (JavaScript, TypeScript, HTML, CSS, Python, Java, C++, etc.)
- **Autocompletamento** intelligente
- **Ricerca e sostituzione** avanzata con supporto regex
- **Gestione tabs** multipli
- **Minimap** del codice
- **Folding del codice** (collassa/espandi blocchi)
- **Numerazione righe** opzionale
- **Word wrap** configurabile
- **Zoom** dinamico del testo

### 💾 Gestione File
- Apertura file multipli
- Salvataggio automatico
- Gestione sessioni
- Supporto per tutti i formati di testo

### ⚙️ Personalizzazione
- Dimensioni font configurabili
- Impostazioni tab (spazi vs tabs)
- Temi personalizzabili
- Scorciatoie da tastiera

## Cross-Platform

✅ **Windows** (7, 8, 10, 11)  
✅ **macOS** (10.12+)  
✅ **Linux** (Ubuntu, Debian, Fedora, etc.)

## Installazione

### Prerequisiti
- Node.js 18 o superiore
- npm o yarn

### Sviluppo
```bash
# Clone del repository
git clone https://github.com/your-username/notepad-pro.git
cd notepad-pro

# Installa dipendenze
npm install

# Avvia in modalità sviluppo
npm run dev
```

### Build per Produzione
```bash
# Build per tutte le piattaforme
npm run build:all

# Build specifiche per piattaforma
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## Utilizzo

### Scorciatoie da Tastiera

#### File
- `Ctrl/Cmd + N` - Nuovo file
- `Ctrl/Cmd + O` - Apri file
- `Ctrl/Cmd + S` - Salva
- `Ctrl/Cmd + Shift + S` - Salva con nome

#### Editing
- `Ctrl/Cmd + F` - Trova
- `Ctrl/Cmd + H` - Sostituisci
- `Ctrl/Cmd + Z` - Annulla
- `Ctrl/Cmd + Y` - Ripristina
- `Ctrl/Cmd + A` - Seleziona tutto

#### Visualizzazione
- `Ctrl/Cmd + +` - Aumenta zoom
- `Ctrl/Cmd + -` - Diminuisci zoom
- `Ctrl/Cmd + 0` - Reset zoom

### Menu Contestuale

L'editor supporta un ricco menu contestuale con opzioni per:
- Copia, taglia, incolla
- Formattazione codice
- Vai alla definizione
- Trova riferimenti

## Stack Tecnologico

- **Frontend**: React 18 + TypeScript
- **Editor**: Monaco Editor
- **UI Library**: Ant Design
- **State Management**: Zustand
- **Desktop**: Electron
- **Build**: Webpack + Electron Builder

## Architettura

```
src/
├── main/           # Processo principale Electron
│   ├── main.ts     # Entry point Electron
│   └── preload.ts  # Script preload sicuro
├── renderer/       # Processo renderer React
│   ├── components/ # Componenti UI React
│   ├── store/      # Gestione stato Zustand
│   ├── types/      # Definizioni TypeScript
│   └── App.tsx     # Componente principale
└── assets/         # Risorse statiche
```

## Configurazione

L'app supporta configurazioni personalizzabili tramite:
- Impostazioni integrate nell'UI
- File di configurazione locale
- Variabili d'ambiente per sviluppo

### Variabili d'Ambiente

```bash
NODE_ENV=development  # Modalità sviluppo
ELECTRON_IS_DEV=1    # Debug Electron
```

## Sicurezza

- Context isolation attivato
- Node integration disabilitato nel renderer
- Preload script sicuro per comunicazione IPC
- Sandboxing per sicurezza aggiuntiva

## Contribuire

1. Fork del progetto
2. Crea feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri Pull Request

## Roadmap

### v1.1
- [ ] Plugin system
- [ ] Syntax highlighting personalizzato
- [ ] Supporto per workspace multipli

### v1.2
- [ ] Git integration
- [ ] Terminal integrato
- [ ] Estensioni marketplace

### v1.3
- [ ] Collaborative editing
- [ ] Cloud sync
- [ ] Mobile companion app

## Licenza

MIT License - vedi il file [LICENSE](LICENSE) per i dettagli.

## Supporto

- 📧 Email: support@notepad-pro.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/notepad-pro/issues)
- 💬 Discussioni: [GitHub Discussions](https://github.com/your-username/notepad-pro/discussions)

## Credits

Creato con ❤️ da Giuseppe Restante

- Monaco Editor by Microsoft
- Ant Design by Ant Group
- React by Meta
- Electron by GitHub