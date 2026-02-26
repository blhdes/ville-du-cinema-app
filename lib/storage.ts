import localforage from 'localforage'

export interface Storage {
  getItem<T>(key: string): Promise<T | null>
  setItem<T>(key: string, value: T): Promise<void>
  removeItem(key: string): Promise<void>
}

const storage: Storage = {
  getItem<T>(key: string): Promise<T | null> {
    return localforage.getItem<T>(key)
  },
  setItem<T>(key: string, value: T): Promise<void> {
    return localforage.setItem(key, value).then(() => undefined)
  },
  removeItem(key: string): Promise<void> {
    return localforage.removeItem(key)
  },
}

export default storage
