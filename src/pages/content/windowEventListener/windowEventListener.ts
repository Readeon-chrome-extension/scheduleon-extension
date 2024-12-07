/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import csrfTokenStorage from '@root/src/shared/storages/csrf-token-storage';

import postContentStorage from '@root/src/shared/storages/postContentStorage';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';
import { headersType, schedulingStart } from './utils';
import { getAllFiles, handleFileRemoval, updateFileId } from '@root/src/shared/utils/indexDb';

refreshOnUpdate('pages/content/windowEventListener/index');
(() => {
  let pendingAttachmentUpdates = []; // Temporary queue for updates

  window?.addEventListener('message', event => {
    if (event?.data?.type === 'x-csrf-token') {
      csrfTokenStorage.setCsrfToken(event?.data?.csrfToken);
    }
    if (event.data.type === 'post-content') {
      postContentStorage.setPostContent(event?.data?.postContent);
    }
    if (event.data.type === 'scheduling-start') {
      const parsedBody = JSON.parse(event.data.postContent?.body);
      handleSchedulingStart(parsedBody, event.data.postContent?.headers, event.data.postContent?.url);
    }
    if (event.data.type === 'media-file-response') {
      const responseData = event.data?.mediaResponse;
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
  let schedulingStartDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  let fileDataUpdateIdDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  const handleSchedulingStart = (body: any, headers: headersType, url: string) => {
    // Clear any existing debounce timer
    if (schedulingStartDebounceTimer) {
      clearTimeout(schedulingStartDebounceTimer);
    }

    // Set a new debounce timer
    schedulingStartDebounceTimer = setTimeout(() => {
      console.log('Debounce executed, calling schedulingStart.');
      schedulingStart(body, headers, url);

      // Reset the timer after execution
      schedulingStartDebounceTimer = null;
    }, 700); // Adjust debounce time as necessary
  };
  const fileDataUpdateId = async (responseData: any) => {
    try {
      // Clear any existing debounce timer
      if (fileDataUpdateIdDebounceTimer) {
        clearTimeout(fileDataUpdateIdDebounceTimer);
        // pendingAttachmentUpdates = [];
      }
      // Add the current update to the pending queue
      pendingAttachmentUpdates.push(responseData);

      fileDataUpdateIdDebounceTimer = setTimeout(async () => {
        // Apply all pending updates
        const uniqueUpdates = Array.from(new Map(pendingAttachmentUpdates.map(item => [item.data.id, item])).values());
        const updates = [...uniqueUpdates];
        // Clear queue after processing
        pendingAttachmentUpdates = [];

        updates.forEach(async res => {
          await updateFileId(res?.data?.attributes?.file_name, res?.data?.attributes?.owner_relationship, res?.data.id);
        });
        fileDataUpdateIdDebounceTimer = null;
      }, 400); // Debounce time (adjust as needed)
    } catch (error) {
      console.error('Error updating file data:', error);
    }
  };

  const deleteAttachment = async (id: string) => {
    if (id) {
      await handleFileRemoval(id);
    }
  };
  const updateDeleteImageFiles = async (data: any) => {
    const image_order: string[] = data?.data?.attributes?.post_metadata?.image_order;
    const isValidArray = image_order?.every(item => item !== null && item !== undefined);
    const files = await getAllFiles();
    if (isValidArray) {
      const removeIds = files?.filter(file => file.media_type === 'image_data' && !image_order.includes(file?.id));
      removeIds?.forEach(async file => {
        await handleFileRemoval(file?.id);
      });
    }
  };
})();
