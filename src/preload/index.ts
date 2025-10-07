import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('localBookshelf', {
  version: '0.1.0'
});
