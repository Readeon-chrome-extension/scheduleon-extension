/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import { BaseStorage, createStorage, StorageType } from '@src/shared/storages/base';

type fileDataStorageType = BaseStorage<boolean> & {
  toggleFileAdd: () => Promise<void>;
};

const storage = createStorage<boolean>('file-data-toggle-storage-key', null, {
  storageType: StorageType.Local,
  liveUpdate: true,
});

const fileDataStorage: fileDataStorageType = {
  ...storage,
  toggleFileAdd: async () => {
    await storage.set(prev => !prev);
  },
};

export default fileDataStorage;
