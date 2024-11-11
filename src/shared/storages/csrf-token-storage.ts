/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import { BaseStorage, createStorage, StorageType } from '@src/shared/storages/base';

type CsrfTokenStorage = BaseStorage<string> & {
  setCsrfToken: (theme: string) => Promise<void>;
};

const storage = createStorage<string>('x-csrf-token-storage-key', null, {
  storageType: StorageType.Local,
  liveUpdate: true,
});

const csrfTokenStorage: CsrfTokenStorage = {
  ...storage,
  setCsrfToken: async (theme: string) => {
    await storage.set(() => theme);
  },
};

export default csrfTokenStorage;
