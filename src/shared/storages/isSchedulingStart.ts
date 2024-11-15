/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import { BaseStorage, createStorage, StorageType } from '@src/shared/storages/base';
type TypeSchedulingState = 'Pending' | 'Complete';
interface schedulingStartTime {
  start: boolean;
  endTime: number;
  schedulingState: TypeSchedulingState;
}
type schedulingStartTypes = BaseStorage<schedulingStartTime> & {
  add: (start: boolean, endTime: number, state: TypeSchedulingState) => Promise<void>;
};

const storage = createStorage<schedulingStartTime>('is-scheduling-start-storage-key', null, {
  storageType: StorageType.Local,
  liveUpdate: true,
});

const isSchedulingStartStorage: schedulingStartTypes = {
  ...storage,
  add: async (start: boolean, endTime: number, state) => {
    await storage.set({ start, endTime, schedulingState: state });
  },
};

export default isSchedulingStartStorage;
