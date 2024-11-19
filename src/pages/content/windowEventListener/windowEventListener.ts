/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import csrfTokenStorage from '@root/src/shared/storages/csrf-token-storage';
import fileDataStorage from '@root/src/shared/storages/fileStorage';

import postContentStorage from '@root/src/shared/storages/post-content-storage';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';
import { schedulingStart } from './utils';

refreshOnUpdate('pages/content/windowEventListener/index');
(() => {
  let pendingAttachmentUpdates = []; // Temporary queue for updates
  let pendingImagesUpdates = []; // Temporary queue for updates

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
      console.log('media file response', { responseData });

      fileDataUpdateId(responseData).then();
    }
    if (event.data.type === 'post-update-response') {
      const data = event.data?.postData;
      updateDeleteImageFiles(data);
    }
    if (event.data.type === 'delete-attachments') {
      const id = event.data?.id;
      deleteAttachment(id);
    }
  });

  const fileDataUpdateId = async (responseData: any) => {
    try {
      // Add the current update to the pending queue
      pendingAttachmentUpdates.push(responseData);

      // Debounce logic to batch updates
      clearTimeout(fileDataUpdateId.debounceTimer);
      fileDataUpdateId.debounceTimer = setTimeout(async () => {
        const files = await fileDataStorage.get();
        const parsedFiles = files?.data ? JSON.parse(files?.data) : [];

        // Apply all pending updates
        const updates = [...pendingAttachmentUpdates];
        pendingAttachmentUpdates = []; // Clear queue after processing

        const updatedFiles = parsedFiles.map(file => {
          const update = updates.find(u => u?.data?.attributes?.file_name === file?.name);
          return update ? { ...file, id: update.data.id } : file;
        });
        // Save the final result back to storage
        await fileDataStorage.setFileData(updatedFiles);
      }, 400); // Debounce time (adjust as needed)
    } catch (error) {
      console.error('Error updating file data:', error);
    }
  };

  // Define the debounceTimer as a static property
  fileDataUpdateId.debounceTimer = null as NodeJS.Timeout | null;
  const deleteAttachment = async (id: string) => {
    const files = await fileDataStorage.get();
    const parsedFiles = files?.data ? JSON.parse(files?.data) : [];
    const updatedFiles = parsedFiles?.filter(file => file?.id !== id);

    await fileDataStorage.setFileData(updatedFiles);
  };
  const updateDeleteImageFiles = async (data: any) => {
    const files = await fileDataStorage.get();
    const parsedFiles = files?.data ? JSON.parse(files?.data) : [];
    const attachmentMedia = parsedFiles?.filter(item => item?.media_type === 'attachment_data');
    const image_order = data?.data?.attributes?.post_metadata?.image_order;
    const isValid = image_order?.every(value => value !== null && value !== undefined);
    if (isValid) {
      const filteredImages = parsedFiles?.filter(file => image_order?.includes(file?.id));

      await fileDataStorage.setFileData([...filteredImages, ...attachmentMedia]);
    }
  };
})();
