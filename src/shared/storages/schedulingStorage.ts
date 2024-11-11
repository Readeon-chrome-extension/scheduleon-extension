/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import { selectedDataType } from '@root/src/pages/content/ui/overlay/overlay';
import { BaseStorage, createStorage, StorageType } from '@src/shared/storages/base';

type schedulingDataStorageType = BaseStorage<selectedDataType[]> & {
  add: (data: selectedDataType[]) => Promise<void>;
};

const storage = createStorage<selectedDataType[]>('scheduling-data-storage-key', null, {
  storageType: StorageType.Local,
  liveUpdate: true,
});

const schedulingStorage: schedulingDataStorageType = {
  ...storage,
  add: async (scheduling: selectedDataType[]) => {
    await storage.set(scheduling);
  },
};

export default schedulingStorage;
