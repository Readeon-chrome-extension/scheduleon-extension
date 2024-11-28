/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import config from '@root/src/config';
import fileDataStorage from '@root/src/shared/storages/fileStorage';
import isPublishScreenStorage from '@root/src/shared/storages/isPublishScreen';
import isWarningShowStorage from '@root/src/shared/storages/isWarningShowStorage';
import schedulingStorage from '@root/src/shared/storages/schedulingStorage';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { toast } from 'sonner';

import { feedbackScheduleonError, submitFeedback } from '@root/src/shared/utils/common';
import { addOrUpdateFile, clearFileData, FileData } from '@root/src/shared/utils/indexDb';
import { TriangleAlert, X } from 'lucide-react';
import isCreatePostReloadStorage from '@root/src/shared/storages/isCreatePostReload';

dayjs.extend(utc);
dayjs.extend(timezone);

export const backButtonHandler = () => {
  const continueWithAuthoreon = document.querySelector(config.pages.continueWithAuthoreon);
  const overlayViewBtn = document.querySelector(config.pages.overlayViewBtnContainer);
  const nextButton: HTMLButtonElement = document.querySelector(config.pages.continueWithAuthoreonBtnInjectSelector);

  nextButton?.setAttribute('style', 'display:none;');
  overlayViewBtn?.remove();
  continueWithAuthoreon.setAttribute('style', 'display:block;');
  isPublishScreenStorage.setScreen(false);
  setTimeout(attachmentsInput, 800);
};

export const nextButtonHandler = () => {
  const nextButton: HTMLButtonElement = document.querySelector(config.pages.continueWithAuthoreonBtnInjectSelector);
  nextButton?.addEventListener('click', () => {
    const continueWithAuthoreon = document.querySelector(config.pages.continueWithAuthoreon);
    //hiding the continue with authoreon
    continueWithAuthoreon.setAttribute('style', 'display:none;');
  });
};
export const customStyles = {
  overlay: {
    zIndex: '1299',
    backgroundColor: '#141414bf',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  content: {
    background: 'var(--global-bg-elevated-default)',
    position: 'fixed',
    maxWidth: '840px',
    boxShadow: 'var(--global-boxShadow-high)',
    borderRadius: 'var(--global-radius-lg)',
    border: 'none',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    height: 'fit-content',
  },
} as any;

// Helper function to combine date and time into ISO format
export const combineDateTime = (date: string, time: string) => {
  if (!date?.length) return '';

  const userSelectedTime = `${date}T${time}:00`;

  // Get the user's timezone dynamically
  const userTimeZone = dayjs.tz.guess();
  // Parse the time in the user's local timezone
  const localTime = dayjs.tz(userSelectedTime, userTimeZone);
  // Convert to UTC and format in `YYYY-MM-DDTHH:mm:ss` format
  const utcFormatted = localTime.utc().format('YYYY-MM-DDTHH:mm:ss');

  return utcFormatted;
};

// Function to process and compress files

export const imageFileHandler = async (files: FileList) => {
  const fileData = Array.from(files);
  const isWarningShow = await isWarningShowStorage.get();
  if (fileData?.length) {
    if (!isWarningShow) {
      toast.warning('Scheduleon Warning: Attaching multiple files or large files may lead to performance issues', {
        closeButton: true,
      });
      isWarningShowStorage.add(true);
    }
    // Store the file buffers in IndexedDB
    await Promise.all(
      fileData.map(async file => {
        const arrayBuffer = await convertFileToArrayBuffer(file);

        const fileData: FileData = {
          id: file.name, // Use file name as ID or generate unique ID
          name: file.name,
          type: file.type,
          data: arrayBuffer,
          idMediaType: `${file.name}_image_data`,
          media_type: 'image_data', // or 'image_data' depending on the file type
        };

        await addOrUpdateFile(fileData); // Save file to IndexedDB
        console.log(`File ${file.name} added to IndexedDB`);
      }),
    );
    fileDataStorage.toggleFileAdd();
  }
};
// Convert file to ArrayBuffer
const convertFileToArrayBuffer = async (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as ArrayBuffer);
    };

    reader.onerror = () => {
      reject('Error reading file');
    };

    reader.readAsArrayBuffer(file); // Read the file as ArrayBuffer
  });
};
export const attachmentsInput = () => {
  const fileInput: HTMLInputElement = document.querySelector(config.pages.attachmentsInput);

  const imageFileInput: HTMLInputElement = document.querySelector(config.pages.imageInputField);
  console.log('fileInput', { fileInput });

  fileInput?.addEventListener('change', async () => {
    const files = fileInput?.files;

    const filesData: File[] = Array.from(files || []);
    const isWarningShow = await isWarningShowStorage.get();

    if (filesData?.length) {
      if (!isWarningShow) {
        toast.warning('Scheduleon Warning: Attaching multiple files or large files may lead to performance issues', {
          closeButton: true,
        });
        isWarningShowStorage.add(true);
      }

      // Store the file buffers in IndexedDB
      await Promise.all(
        filesData.map(async file => {
          const arrayBuffer = await convertFileToArrayBuffer(file);
          const fileData: FileData = {
            id: file.name, // Use file name as ID or generate unique ID
            name: file.name,
            type: file.type,
            data: arrayBuffer,
            idMediaType: `${file.name}_attachment_data`,
            media_type: 'attachment_data', // or 'image_data' depending on the file type
          };

          await addOrUpdateFile(fileData); // Save file to IndexedDB
          console.log(`File ${file.name} added to IndexedDB`);
        }),
      );
      fileDataStorage.toggleFileAdd();
    }
  });

  imageFileInput?.addEventListener('change', async (event: any) => {
    const files = event?.target?.files;

    imageFileHandler(files);
  });
};

const getDialogContainer = () => {
  const containerOuter = document.querySelector('#post-creation-dailog');

  // cleanup the local storage when user start scheduling post
  const containerInner = containerOuter?.querySelector('[data-tag="dialog-container"]');
  containerInner?.addEventListener('click', async () => {
    localStorage.removeItem('scheduling-data');
    await isWarningShowStorage.add(false);
    await isCreatePostReloadStorage.add(false);
    await schedulingStorage.add([]);
    await clearFileData();
    await fileDataStorage.set(null);
    await isPublishScreenStorage.setScreen(false);
  });
};
export const createPostBtnListener = () => {
  setTimeout(getDialogContainer, 900);
};

export const scheduleBtnClick = async () => {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  // waiting for 2 second if the scheduleon confirmation pop up showing or not
  await delay(3000);
  const popUpEle = document.querySelector('.scheduleon-confirmation-pop-up');
  const schedulingData = await schedulingStorage.get();

  if (!popUpEle && schedulingData?.length) {
    toast.custom(
      t => (
        <div style={{ justifyContent: 'center', alignItems: 'center', height: '100vh', display: 'flex' }}>
          <div
            style={{
              background: 'hsl(49, 100%, 97%)',
              borderRadius: '8px',
              padding: '12px',
              width: '430px',
              height: 'fit-content',
              border: '1px solid hsl(49, 91%, 91%)',
              color: 'hsl(31, 92%, 45%)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <span style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer' }}>
              <X size={25} onClick={() => toast.dismiss(t)} />
            </span>
            <TriangleAlert size={25} />
            <h3 style={{ margin: '10px' }}>Scheduleon Error</h3>
            <p>
              An error occurred while trying to use Scheduleon. Underneath this pop-up you will notice your post was
              scheduled at a random time and date. Please modify or delete the post accordingly.{' '}
            </p>
            <br />
            <p>
              To continue using this extension, try to create another post and, if the error still occurs, then try
              deleting and re-installing the extension.
            </p>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        style: { top: '-10px', left: '-50px' },
        position: 'top-center',
      },
    );
    await submitFeedback(feedbackScheduleonError);
  }
};
