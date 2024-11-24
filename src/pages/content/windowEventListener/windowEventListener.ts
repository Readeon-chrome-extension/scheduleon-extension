/* 
  Copyright (C) [2024] [Scheduleon]
  This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
*/

import csrfTokenStorage from '@root/src/shared/storages/csrf-token-storage';
import postContentStorage from '@root/src/shared/storages/post-content-storage';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';
import { schedulingStart } from './utils';
import { getAllFiles, handleFileRemoval, updateFileId } from '@root/src/shared/utils/indexDb';

refreshOnUpdate('pages/content/windowEventListener/index');

(() => {
  let pendingAttachmentUpdates = []; // Temporary queue for updates

  chrome.runtime.onMessage.addListener(message => {
    if (message.type === 'fields-reward-request') {
      // Handle GET requests with 'fields[reward]'
      console.log("Received 'fields-reward-request' message:", message.url);
    }
  });

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
      console.log('responseData', { responseData });
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
        // Apply all pending updates
        const updates = [...pendingAttachmentUpdates];
        pendingAttachmentUpdates = []; // Clear queue after processing

        updates.forEach(async res => {
          await updateFileId(res?.data?.attributes?.file_name, res?.data.id);
        });
      }, 400); // Debounce time (adjust as needed)
    } catch (error) {
      console.error('Error updating file data:', error);
    }
  };

  // Define the debounceTimer as a static property
  fileDataUpdateId.debounceTimer = null as NodeJS.Timeout | null;
  const deleteAttachment = async (id: string) => {
    if (id) {
      await handleFileRemoval(id);
    }
  };
  const updateDeleteImageFiles = async (data: any) => {
    const image_order = data?.data?.attributes?.post_metadata?.image_order;
    const files = await getAllFiles();
    const removeIds = files?.filter(file => file.media_type === 'image_data' && !image_order.includes(file?.id));

    removeIds?.forEach(async file => {
      await handleFileRemoval(file?.id);
    });
  };
})();
