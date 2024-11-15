/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import { BaseStorage, createStorage, StorageType } from '@src/shared/storages/base';

type isWarningShow = BaseStorage<boolean> & {
  add: (isShow: boolean) => Promise<void>;
};

const storage = createStorage<boolean>('scheduleon-is-warning-file-show-storage-key', false, {
  storageType: StorageType.Local,
  liveUpdate: true,
});

const isWarningShowStorage: isWarningShow = {
  ...storage,
  add: async isShow => {
    await storage.set(isShow);
  },
};

export default isWarningShowStorage;
