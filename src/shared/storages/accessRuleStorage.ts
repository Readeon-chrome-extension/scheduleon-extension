/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import { AccessRulesData } from '@root/src/pages/content/ui/overlay/overlay';
import { BaseStorage, createStorage, StorageType } from '@src/shared/storages/base';

type AccessRulesStorage = BaseStorage<AccessRulesData[]> & {
  add: (data: AccessRulesData[]) => Promise<void>;
};

const storage = createStorage<AccessRulesData[]>('access-rules-data-storage-key', [], {
  storageType: StorageType.Local,
  liveUpdate: true,
});

const accessRulesStorage: AccessRulesStorage = {
  ...storage,
  add: async data => {
    await storage.set(data);
  },
};

export default accessRulesStorage;
