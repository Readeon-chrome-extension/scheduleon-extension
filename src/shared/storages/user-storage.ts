/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import { BaseStorage, createStorage, StorageType } from '@src/shared/storages/base';

export interface UserDataTypes {
  isLoggedIn: boolean;
}
type UserDataStorage = BaseStorage<UserDataTypes> & {
  add: (value: UserDataTypes) => Promise<void>;
};

const storage = createStorage<UserDataTypes | null>('scheduleon-user-data-storage-view-key', null, {
  storageType: StorageType.Local,
  liveUpdate: true,
});

const userDataStorage: UserDataStorage = {
  ...storage,
  add: async value => {
    await storage.set(value);
  },
};

export default userDataStorage;
