/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import { BaseStorage, createStorage, StorageType } from '@src/shared/storages/base';

type ExtEnableStorage = BaseStorage<boolean> & {
  toggle: () => Promise<void>;
};

const storage = createStorage<boolean>('scheduleon-extension-enable-storage-key', true, {
  storageType: StorageType.Local,
  liveUpdate: true,
});

const extEnableStorage: ExtEnableStorage = {
  ...storage,
  toggle: async () => {
    await storage.set(isEnable => {
      return !isEnable;
    });
  },
};

export default extEnableStorage;
