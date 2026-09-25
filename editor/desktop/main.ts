import { app, BrowserWindow, dialog, Menu, net, protocol, shell, utilityProcess } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { projectApi } from '../server/projectApi';

protocol.registerSchemesAsPrivileged([{ scheme: 'pixl', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);
let window: BrowserWindow | null = null;
let root = '';
let nextProject: string | null = null;
const origin = 'pixl://editor';
const validProject = (folder: string) => fs.existsSync(path.join(folder, 'convert-icons.js')) && fs.existsSync(path.join(folder, 'package.json'));
const preferences = () => path.join(app.getPath('userData'), 'project.json');

async function chooseProject() {
  const result = await dialog.showOpenDialog({ title: 'Open Indx Pixl project folder', properties: ['openDirectory'] });
  if (result.canceled) return null;
  const folder = result.filePaths[0];
  if (!validProject(folder)) {
    await dialog.showMessageBox({ type: 'error', message: 'Choose the indx-pixl project folder.', detail: 'The folder should contain package.json and convert-icons.js.' });
    return null;
  }
  return folder;
}
function remember(folder: string) {
  root = folder;
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(preferences(), JSON.stringify({ root }));
}

// Electron supplies Node, so Finder launches do not depend on a shell PATH.
function run(task: string): Promise<string> {
  const script = task === 'convert' ? path.join(root, 'convert-icons.js') : path.join(root, 'node_modules/typescript/bin/tsc');
  if (!fs.existsSync(script)) return Promise.reject(new Error('Project dependencies are missing. Run npm install in the project folder first.'));
  return new Promise((resolve, reject) => {
    const child = utilityProcess.fork(script, [], { cwd: root, stdio: 'pipe' });
    let output = '';
    child.stdout?.on('data', chunk => { output += chunk; });
    child.stderr?.on('data', chunk => { output += chunk; });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve(output) : reject(new Error(output || `${task} exited with code ${code}`)));
  });
}
function createWindow() {
  window = new BrowserWindow({
    title: 'Indx Pixl', width: 1440, height: 960, minWidth: 800, minHeight: 550,
    backgroundColor: '#181818', show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, url) => { if (url !== origin + '/') event.preventDefault(); });
  window.once('ready-to-show', () => window?.show());
  window.on('closed', () => {
    window = null;
    if (nextProject) { const folder = nextProject; nextProject = null; remember(folder); createWindow(); }
  });
  void window.loadURL(origin + '/');
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (window?.isMinimized()) window.restore(); window?.focus(); });
  app.whenReady().then(async () => {
    const besideApp = app.isPackaged ? path.resolve(app.getPath('exe'), '../../../..') : path.resolve(__dirname, '../..');
    let remembered = '';
    try { remembered = JSON.parse(fs.readFileSync(preferences(), 'utf8')).root; } catch { /* first launch */ }
    const selected = validProject(besideApp) ? besideApp : remembered && validProject(remembered) ? remembered : await chooseProject();
    if (!selected) { app.quit(); return; }
    remember(selected);
    const assets = path.join(__dirname, 'web');
    protocol.handle('pixl', async request => {
      const url = new URL(request.url);
      if (url.host !== 'editor') return new Response('Not found', { status: 404 });
      if (url.pathname.startsWith('/api/')) return projectApi(root, run)(request);
      const file = path.resolve(assets, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
      if (!file.startsWith(assets + path.sep)) return new Response('Forbidden', { status: 403 });
      return net.fetch(pathToFileURL(file).href);
    });
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      { role: 'appMenu' },
      { label: 'File', submenu: [
        { label: 'Open Project Folder…', accelerator: 'CmdOrCtrl+O', click: async () => {
          const folder = await chooseProject();
          if (!folder || folder === root) return;
          // Closing uses the renderer's unsaved-change guard before switching roots.
          nextProject = folder;
          if (window) window.close();
          else { nextProject = null; remember(folder); createWindow(); }
        } },
        { label: 'Show Project in Finder', click: () => { void shell.openPath(root); } },
        { type: 'separator' }, { role: 'close' },
      ] },
      { role: 'editMenu' },
      { label: 'View', submenu: [{ role: 'togglefullscreen' }, { role: 'toggleDevTools' }] },
      { role: 'windowMenu' },
    ]));
    createWindow();
    app.on('activate', () => { if (!window) createWindow(); });
  }).catch(error => { dialog.showErrorBox('Indx Pixl could not start', String(error)); app.quit(); });
}
