const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  print: () => ipcRenderer.invoke('app:print'),
  problems: {
    list: (query) => ipcRenderer.invoke('problems:list', query),
    save: (problem) => ipcRenderer.invoke('problems:save', problem),
    delete: (id) => ipcRenderer.invoke('problems:delete', id),
  },
  tests: {
    list: (query) => ipcRenderer.invoke('tests:list', query),
    save: (test) => ipcRenderer.invoke('tests:save', test),
    delete: (id) => ipcRenderer.invoke('tests:delete', id),
  },
});
