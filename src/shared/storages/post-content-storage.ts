/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import { BaseStorage, createStorage, StorageType } from '@src/shared/storages/base';

interface postContentTypes {
  body: any;
  headers: {
    'Content-Type': string;
    baggage: string;
    'sentry-trace': string;
  };
  url: string;
}
type postContentStorageType = BaseStorage<postContentTypes> & {
  setPostContent: (postContent: postContentTypes) => Promise<void>;
};

const storage = createStorage<postContentTypes>('post-content-storage-key', null, {
  storageType: StorageType.Local,
  liveUpdate: true,
});

const postContentStorage: postContentStorageType = {
  ...storage,
  setPostContent: async (postContent: postContentTypes) => {
    await storage.set(postContent);
  },
};

export default postContentStorage;
