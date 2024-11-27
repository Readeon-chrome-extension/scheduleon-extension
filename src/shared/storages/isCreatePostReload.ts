/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import { BaseStorage, createStorage, StorageType } from '@src/shared/storages/base';

type IsCreatePostReloadStorage = BaseStorage<boolean> & {
  add: (isReload: boolean) => Promise<void>;
};

const storage = createStorage<boolean>('is-create-post-reload-storage-key', false, {
  storageType: StorageType.Local,
  liveUpdate: true,
});

const isCreatePostReloadStorage: IsCreatePostReloadStorage = {
  ...storage,
  // TODO: extends your own methods
  add: async isReload => {
    await storage.set(isReload);
  },
};

export default isCreatePostReloadStorage;
