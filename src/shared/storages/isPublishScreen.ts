/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import { BaseStorage, createStorage, StorageType } from '@src/shared/storages/base';

type PublishScreenStorage = BaseStorage<boolean> & {
  setScreen: (isPublish: boolean) => Promise<void>;
};

const storage = createStorage<boolean>('is-publish-screen-storage-key', false, {
  storageType: StorageType.Local,
  liveUpdate: true,
});

const isPublishScreenStorage: PublishScreenStorage = {
  ...storage,
  // TODO: extends your own methods
  setScreen: async isPublish => {
    await storage.set(isPublish);
  },
};

export default isPublishScreenStorage;
