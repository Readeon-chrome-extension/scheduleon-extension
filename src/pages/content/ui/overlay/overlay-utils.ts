/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import config from '@root/src/config';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import fileDataStorage from '@root/src/shared/storages/fileStorage';
import isPublishScreenStorage from '@root/src/shared/storages/isPublishScreen';

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
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
async function convertFilesToBuffers(fileList, media_type: string) {
  const fileBuffers = [];
  for (const file of fileList) {
    const buffer = await file.arrayBuffer();
    fileBuffers.push({
      name: file.name,
      type: file.type,
      media_type: media_type,
      data: arrayBufferToBase64(buffer),
    });
  }
  return fileBuffers;
}
const getExistingFiles = async () => {
  const existingFile = await fileDataStorage.get();
  const parsedFiles = existingFile?.data ? JSON.parse(existingFile?.data) : [];
  return parsedFiles;
};
export const imageFileHandler = async (files: any) => {
  const fileBuffers = await convertFilesToBuffers(files, 'image_data');
  const existingFile = await getExistingFiles();
  if (fileBuffers?.length) {
    console.log('added images');

    await fileDataStorage.setFileData([...existingFile, ...fileBuffers]);
  }
};
export const attachmentsInput = () => {
  const fileInput: HTMLInputElement = document.querySelector(config.pages.attachmentsInput);

  const imageFileInput: HTMLInputElement = document.querySelector(config.pages.imageInputField);

  fileInput?.addEventListener('change', async () => {
    const files = fileInput?.files;

    const fileBuffers = await convertFilesToBuffers(files, 'attachment_data');

    if (fileBuffers?.length) {
      const existingFile = await getExistingFiles();
      await fileDataStorage.setFileData([...existingFile, ...fileBuffers]);
    }
  });

  imageFileInput?.addEventListener('change', async (event: any) => {
    const files = event?.target?.files;

    imageFileHandler(files);
  });
};
