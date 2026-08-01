const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const { createLocalStore } = require('./localStore.cjs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  } else {
    mainWindow.loadURL('http://127.0.0.1:5173');
  }
}

app.whenReady().then(() => {
  const store = createLocalStore(path.join(app.getPath('userData'), 'test-creator-demo.sqlite'));
  store.seedDemoData();
  ipcMain.handle('problems:list', (_event, query) => store.listProblems(query));
  ipcMain.handle('problems:save', (_event, problem) => store.saveProblem(problem));
  ipcMain.handle('problems:delete', (_event, id) => store.deleteProblem(id));
  ipcMain.handle('tests:list', (_event, query) => store.listTests(query));
  ipcMain.handle('tests:save', (_event, test) => store.saveTest(test));
  ipcMain.handle('tests:delete', (_event, id) => store.deleteTest(id));

  ipcMain.handle('app:print', () => new Promise((resolve, reject) => {
    mainWindow.webContents.print({ silent: false, printBackground: true }, (success, reason) => {
      if (success) resolve(true);
      else reject(new Error(reason || '印刷ダイアログを開けませんでした。'));
    });
  }));
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
