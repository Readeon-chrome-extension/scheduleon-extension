import { BaseStorage, createStorage, StorageType } from '@src/shared/storages/base';

type PatreonThemeStorage = BaseStorage<string> & {
  setTheme: (theme: string) => Promise<void>;
  getTheme: () => Promise<string>;
};

const storage = createStorage<string>('global-theme-patreon-storage-key', 'light', {
  storageType: StorageType.Local,
  liveUpdate: true,
});

const patreonThemeStorage: PatreonThemeStorage = {
  ...storage,
  setTheme: async (theme: string) => {
    await storage.set(() => theme);
  },
  getTheme: async () => {
    return await storage.get();
  },
};

export default patreonThemeStorage;
