/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import csrfTokenStorage from '@root/src/shared/storages/csrf-token-storage';
import fileDataStorage from '@root/src/shared/storages/fileStorage';

import isSchedulingStartStorage from '@root/src/shared/storages/isSchedulingStart';
import postContentStorage from '@root/src/shared/storages/post-content-storage';
import schedulingCounterStorage from '@root/src/shared/storages/schedulingCounterStorage';
import schedulingStorage from '@root/src/shared/storages/schedulingStorage';
import axios from 'axios';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';
import { createPayloadObj, schedulingStart } from './utils';

refreshOnUpdate('pages/content/windowEventListener/index');
(() => {
  window?.addEventListener('message', event => {
    if (event?.data?.type === 'x-csrf-token') {
      csrfTokenStorage.setCsrfToken(event?.data?.csrfToken);
    }
    if (event.data.type === 'post-content') {
      postContentStorage.setPostContent(event?.data?.postContent);
    }
    if (event.data.type === 'scheduling-start') {
      const parsedBody = JSON.parse(event.data.postContent?.body);
      schedulingStart(parsedBody, event.data.postContent?.headers, event.data.postContent?.url);
    }
    if (event.data.type === 'media-file-response') {
      const responseData = event.data?.mediaResponse;
      fileDataUpdateId(responseData);
    }
    if (event.data.type === 'post-update-response') {
      const data = event.data?.postData;
      console.log('post-update-response', { data });
      updateImageFiles(data);
    }
    if (event.data.type === 'delete-attachments') {
      const id = event.data?.id;
      deleteAttachment(id);
    }
  });
})();
const fileDataUpdateId = async (responseData: any) => {
  const files = await fileDataStorage.get();
  const parsedFiles = files?.data ? JSON.parse(files?.data) : [];
  const updatedFiles = parsedFiles?.map(file => {
    if (file?.name === responseData?.data?.attributes?.file_name) {
      return {
        ...file,
        id: responseData?.data?.id,
      };
    }
    return file;
  });
  console.log('file id attach', { updatedFiles });

  fileDataStorage.setFileData(updatedFiles);
};
const deleteAttachment = async (id: string) => {
  const files = await fileDataStorage.get();
  const parsedFiles = files?.data ? JSON.parse(files?.data) : [];
  const updatedFiles = parsedFiles?.filter(file => file?.id !== id);
  console.log('deleted files data', updatedFiles);

  fileDataStorage.setFileData(updatedFiles);
};
const updateImageFiles = async (data: any) => {
  const files = await fileDataStorage.get();
  const parsedFiles = files?.data ? JSON.parse(files?.data) : [];
  const attachmentMedia = parsedFiles?.filter(item => item?.media_type === 'attachment_data');
  const image_order = data?.data?.attributes?.post_metadata?.image_order;
  const filteredImages = parsedFiles?.filter(file => image_order?.includes(file?.id));
  console.log('attachmentMedia', { attachmentMedia, filteredImages });

  fileDataStorage.setFileData([...filteredImages, ...attachmentMedia]);
};
