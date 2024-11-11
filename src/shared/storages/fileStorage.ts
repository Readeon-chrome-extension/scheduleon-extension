/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import { BaseStorage, createStorage, StorageType } from '@src/shared/storages/base';
interface FilesDataTypes {
  data: string;
}

type fileDataStorageType = BaseStorage<FilesDataTypes> & {
  setFileData: (data: any) => Promise<void>;
};

const storage = createStorage<FilesDataTypes>('file-data-payload-storage-key', null, {
  storageType: StorageType.Local,
  liveUpdate: true,
});

const fileDataStorage: fileDataStorageType = {
  ...storage,
  setFileData: async (data: any) => {
    await storage.set(prev => {
      if (prev?.data) {
        return { data: JSON.stringify([...JSON.parse(prev.data), ...data]) };
      } else {
        return { data: JSON.stringify([...data]) };
      }
    });
  },
};

export default fileDataStorage;
