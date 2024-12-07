/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import { BaseStorage, createStorage, StorageType } from '@src/shared/storages/base';

interface postContentTypes {
  attributes: {
    post_type: string;
    scheduled_for: string | null | undefined;
  };
}
type PostContentStorageType = BaseStorage<postContentTypes> & {
  setPostContent: (postContent: postContentTypes) => Promise<void>;
};

const storage = createStorage<postContentTypes>('scheduleon-post-content-storage-key', null, {
  storageType: StorageType.Local,
  liveUpdate: true,
});

const postContentStorage: PostContentStorageType = {
  ...storage,
  setPostContent: async (postContent: postContentTypes) => {
    await storage.set(postContent);
  },
};

export default postContentStorage;
