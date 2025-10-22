import { app, BrowserWindow, Menu, dialog, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

class NotePadProApp {
  private mainWindow: BrowserWindow | null = null;
  private isDevelopment = process.env.NODE_ENV !== 'production';

  constructor() {
    this.setupApp();
  }

  private setupApp(): void {
    // Handle app ready
    app.whenReady().then(() => {
      this.createMainWindow();
      this.setupMenu();
      this.setupIpcHandlers();

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createMainWindow();
        }
      });
    });

    // Handle all windows closed
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // Security: Prevent new window creation
    app.on('web-contents-created', (event, contents) => {
      contents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
      });
    });
  }

  private createMainWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      title: 'notepad#',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
      titleBarStyle: process.platform === 'darwin' ? 'default' : 'default',
      show: false, // Show when ready
    });

    // Load the app
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      // In development, try to connect to webpack dev server
      this.mainWindow.loadURL('http://localhost:3000');
    } else {
      // In production, load the built HTML file
      const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
      console.log('Loading app from:', indexPath);
      this.mainWindow.loadFile(indexPath);
    }

    // Show when ready to prevent visual flash
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    // Open DevTools in development
    if (this.isDevelopment) {
      this.mainWindow.webContents.openDevTools();
    }

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private setupMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New File',
            accelerator: 'CmdOrCtrl+N',
            click: () => this.handleNewFile(),
          },
          {
            label: 'Open File',
            accelerator: 'CmdOrCtrl+O',
            click: () => this.handleOpenFile(),
          },
          { type: 'separator' },
          {
            label: 'Save',
            accelerator: 'CmdOrCtrl+S',
            click: () => this.handleSave(),
          },
          {
            label: 'Save As',
            accelerator: 'CmdOrCtrl+Shift+S',
            click: () => this.handleSaveAs(),
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => app.quit(),
          },
        ],
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' },
          { type: 'separator' },
          {
            label: 'Find',
            accelerator: 'CmdOrCtrl+F',
            click: () => this.sendToRenderer('menu-find'),
          },
          {
            label: 'Replace',
            accelerator: 'CmdOrCtrl+H',
            click: () => this.sendToRenderer('menu-replace'),
          },
        ],
      },
      {
        label: 'Language',
        submenu: [
          {
            label: 'Plain Text',
            click: () => this.sendToRenderer('menu-language-plaintext'),
          },
          {
            label: 'JavaScript',
            click: () => this.sendToRenderer('menu-language-javascript'),
          },
          {
            label: 'TypeScript',
            click: () => this.sendToRenderer('menu-language-typescript'),
          },
          {
            label: 'HTML',
            click: () => this.sendToRenderer('menu-language-html'),
          },
          {
            label: 'CSS',
            click: () => this.sendToRenderer('menu-language-css'),
          },
          {
            label: 'JSON',
            click: () => this.sendToRenderer('menu-language-json'),
          },
          {
            label: 'Python',
            click: () => this.sendToRenderer('menu-language-python'),
          },
          {
            label: 'Java',
            click: () => this.sendToRenderer('menu-language-java'),
          },
        ],
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          {
            label: 'Theme',
            submenu: [
              {
                label: 'Auto (Follow System)',
                click: () => this.sendToRenderer('menu-theme-auto'),
              },
              { type: 'separator' },
              {
                label: 'Light',
                click: () => this.sendToRenderer('menu-theme-light'),
              },
              {
                label: 'Dark',
                click: () => this.sendToRenderer('menu-theme-dark'),
              },
              {
                label: 'High Contrast',
                click: () => this.sendToRenderer('menu-theme-highcontrast'),
              },
              { type: 'separator' },
              {
                label: 'Cycle Themes',
                accelerator: 'CmdOrCtrl+T',
                click: () => this.sendToRenderer('menu-toggle-theme'),
              },
            ],
          },
          { type: 'separator' },
          {
            label: 'Toggle Minimap',
            accelerator: 'CmdOrCtrl+M',
            click: () => this.sendToRenderer('menu-toggle-minimap'),
          },
          {
            label: 'Toggle Word Wrap',
            accelerator: 'Alt+Z',
            click: () => this.sendToRenderer('menu-toggle-wordwrap'),
          },
          { type: 'separator' },
          {
            label: 'Settings...',
            accelerator: 'CmdOrCtrl+,',
            click: () => this.sendToRenderer('menu-open-settings'),
          },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' },
        ],
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' },
        ],
      },
    ];

    // macOS specific menu adjustments
    if (process.platform === 'darwin') {
      template.unshift({
        label: app.getName(),
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' },
        ],
      });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private setupIpcHandlers(): void {
    // File operations
    ipcMain.handle('show-open-dialog', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ['openFile'],
        filters: [
          { name: 'All Files', extensions: ['*'] },
          { name: 'JavaScript', extensions: ['js', 'jsx'] },
          { name: 'TypeScript', extensions: ['ts', 'tsx'] },
          { name: 'Web Files', extensions: ['html', 'htm', 'css', 'scss', 'sass'] },
          { name: 'JSON', extensions: ['json'] },
          { name: 'Python', extensions: ['py', 'pyw'] },
          { name: 'Java', extensions: ['java'] },
          { name: 'C/C++', extensions: ['c', 'cpp', 'h', 'hpp'] },
          { name: 'Text Files', extensions: ['txt', 'md', 'log'] },
        ],
      });
      return result;
    });

    ipcMain.handle('show-save-dialog', async () => {
      const result = await dialog.showSaveDialog(this.mainWindow!, {
        filters: [
          { name: 'All Files', extensions: ['*'] },
          { name: 'JavaScript', extensions: ['js', 'jsx'] },
          { name: 'TypeScript', extensions: ['ts', 'tsx'] },
          { name: 'Web Files', extensions: ['html', 'htm', 'css', 'scss', 'sass'] },
          { name: 'JSON', extensions: ['json'] },
          { name: 'Python', extensions: ['py', 'pyw'] },
          { name: 'Java', extensions: ['java'] },
          { name: 'C/C++', extensions: ['c', 'cpp', 'h', 'hpp'] },
          { name: 'Text Files', extensions: ['txt', 'md', 'log'] },
        ],
      });
      return result;
    });

    ipcMain.handle('read-file', async (event, filePath: string) => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        return { success: true, content };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('write-file', async (event, filePath: string, content: string) => {
      try {
        fs.writeFileSync(filePath, content, 'utf8');
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });
  }

  private handleNewFile(): void {
    this.sendToRenderer('menu-new-file');
  }

  private handleOpenFile(): void {
    this.sendToRenderer('menu-open-file');
  }

  private handleSave(): void {
    this.sendToRenderer('menu-save');
  }

  private handleSaveAs(): void {
    this.sendToRenderer('menu-save-as');
  }

  private sendToRenderer(channel: string, ...args: any[]): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send(channel, ...args);
    }
  }
}

// Create app instance
new NotePadProApp();