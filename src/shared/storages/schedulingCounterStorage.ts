/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import { BaseStorage, createStorage, StorageType } from '@src/shared/storages/base';

type schedulingCounter = {
  usedCounter: number;
  isViewed: boolean;
  hasAnswered: boolean;
};
type SchedulingUsedStorage = BaseStorage<schedulingCounter> & {
  add: (isViewed: boolean, usedCounter: number, hasAnswered: boolean) => Promise<void>;
};

const storage = createStorage<schedulingCounter>(
  'scheduling-used-counter-storage-key',
  { usedCounter: 0, isViewed: false, hasAnswered: false },
  {
    storageType: StorageType.Local,
    liveUpdate: true,
  },
);

const schedulingCounterStorage: SchedulingUsedStorage = {
  ...storage,
  add: async (isViewed: boolean, usedCounter: number, hasAnswered: boolean) => {
    await storage.set({ isViewed, usedCounter, hasAnswered });
  },
};

export default schedulingCounterStorage;
