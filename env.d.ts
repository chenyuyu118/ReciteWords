/// <reference types="vite/client" />
export interface IElectronAPI {
  closeWindow: () => void,
  setTitle: (title: string) => void
}

declare global {
  interface Window {
    electronAPI: IElectronAPI
  }
}

declare module 'nedb'