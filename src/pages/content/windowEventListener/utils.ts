/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */

import csrfTokenStorage from '@root/src/shared/storages/csrf-token-storage';

import isSchedulingStartStorage from '@root/src/shared/storages/isSchedulingStart';
import schedulingCounterStorage from '@root/src/shared/storages/schedulingCounterStorage';
import schedulingStorage from '@root/src/shared/storages/schedulingStorage';
import { FileData, getAllFiles } from '@root/src/shared/utils/indexDb';
import axios from 'axios';

const toCamelCase = (key: string) => {
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};
type UploadParameters = Record<string, string>;
function transformKeys(obj: any) {
  if (Array.isArray(obj)) {
    return obj.map(transformKeys);
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const newKey = toCamelCase(key);
      acc[newKey] = transformKeys(value);
      return acc;
    }, {});
  }
  return obj;
}
export const createPayloadObj = payloadObj => {
  const transformedPayload = transformKeys(payloadObj?.data?.attributes);

  return {
    ...transformedPayload,
    id: payloadObj?.data?.id,
    type: 'media',
    closedCaptions: [],
    closedCaptionsEnabled: true,
    _ref: {
      data: {
        id: payloadObj?.data?.id,
        type: 'media',
      },
    },
  };
};

export const schedulingStart = async (body: any, headers: headersType, url: string) => {
  const schedulingData = await schedulingStorage.get();
  console.log('schedulingData', { schedulingData });

  if (!schedulingData?.length) return;

  const csrf = await csrfTokenStorage.get();
  hideDefaultPopUp();
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (const details of schedulingData) {
    try {
      const postId = await makeCreatePostCall(
        headers,
        headers['X-CSRF-Signature'] ?? csrf,
        body?.data?.attributes?.post_type,
      );
      await makePatchCall(
        postId,
        headers,
        headers['X-CSRF-Signature'] ?? csrf,
        details?.date_time,
        details?.access_rule_id,
        body,
        url,
      );

      await delay(5000);
    } catch (error) {
      console.log('error', { error });
    }
  }

  await isSchedulingStartStorage.add(false, null, 'Complete');
};

//creating the new post
const makeCreatePostCall = async (headers: headersType, csrf: string, postType: string) => {
  const payload = {
    data: {
      type: 'post',
      attributes: {
        post_type: postType,
      },
    },
  };
  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://www.patreon.com/api/posts?fields\\[post\\]=post_type%2Cpost_metadata&include=drop&json-api-version=1.0&json-api-use-default-includes=false',
    headers: {
      baggage: headers?.baggage,
      'content-type': 'application/vnd.api+json',
      'sentry-trace': headers['sentry-trace'],
      'x-csrf-signature': csrf,
    },
    data: JSON.stringify(payload),
    withCredentials: true, // This enables automatic cookie handling
  };

  const response = await axios.request(config);
  const createdPost = response.data;
  return createdPost?.data?.id as string;
};

// adding the attachments with post
const attachMedia = async (postId: string, headers: headersType, csrf: string, parsedFiles: FileData[]) => {
  const responseArray = [];
  await Promise.all(
    parsedFiles.map(async file => {
      const fileData = new File([file.data], file.name, { type: file.type });
      const payload = {
        data: {
          attributes: {
            file_name: file.name,
            owner_id: postId,
            owner_relationship: file.media_type === 'image_data' ? 'main' : 'attachment',
            owner_type: 'post',
            ...(file.media_type === 'attachment_data' && { size_bytes: fileData.size }),
            state: 'pending_upload',
          },
          type: 'media',
        },
      };

      // Media API Call
      const mediaConfig = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `https://www.patreon.com/api/media?json-api-version=1.0&json-api-use-default-includes=false&include=%5B%5D`,
        headers: {
          baggage: headers.baggage,
          'content-type': 'application/vnd.api+json',
          'sentry-trace': headers['sentry-trace'],
          'x-csrf-signature': csrf,
          referrerPolicy: 'no-referrer',
        },
        data: JSON.stringify(payload),
        withCredentials: true,
      };

      const response = await axios.request(mediaConfig);
      const responseData = response.data;

      if (file.media_type === 'image_data') {
        responseArray.push(responseData);
      }

      // Extract Upload Parameters
      const uploadParameters: UploadParameters = responseData.data.attributes.upload_parameters;
      const formData = new FormData();
      Object.entries(uploadParameters).forEach(([key, value]) => {
        if (key && value) {
          formData.append(key, value);
        }
      });

      // Append File
      const fileToUpload = file.media_type === 'image_data' ? new Blob([file?.data], { type: file.type }) : fileData;
      formData.append('file', fileToUpload, file.name);

      // Upload to S3
      const uploadConfig = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://patreon-media.s3-accelerate.amazonaws.com/',
        headers: { 'Content-Type': 'multipart/form-data' },
        data: formData,
      };

      await axios.request(uploadConfig);
    }),
  );

  return responseArray;
};

//updating the post
const makePatchCall = async (
  postId: string,
  headers: headersType,
  csrf: string,
  date_time: string,
  access_rule_id: string,
  body: any,
  url: string,
) => {
  const params = url?.split('?')[1];
  const payload = { ...body };
  const postType = payload?.data?.attributes?.post_type;
  const accessRules = {
    type: 'access-rule',
    id: access_rule_id,
  };
  let imageMediaResponse;

  const allFiles = await getAllFiles();
  if (allFiles?.length) {
    imageMediaResponse = await attachMedia(postId, headers, csrf ?? headers['X-CSRF-Signature'], allFiles);
  }

  //sending the updated payload
  payload.data.attributes.scheduled_for = date_time;
  payload.data.attributes.tags.publish = false;

  //adding the image ids with post
  payload.data.attributes.post_metadata.image_order =
    postType === 'image_file' ? imageMediaResponse?.map((item: any) => item.data?.id) ?? [] : [];

  payload.data.relationships['access-rule'].data = accessRules;
  payload.data.relationships['access_rules'].data = [accessRules];
  const filterData = payload.included?.filter(item => item.type !== 'access-rule');
  filterData.push({ ...accessRules, attributes: {} });
  payload.included = filterData;

  const config = {
    method: 'patch',
    maxBodyLength: Infinity,
    url: `https://www.patreon.com/api/posts/${postId}?${params}`,
    headers: {
      baggage: headers?.baggage,
      'content-type': 'application/vnd.api+json',
      'sentry-trace': headers['sentry-trace'],
      'x-csrf-signature': csrf,
      referrerPolicy: 'no-referrer',
    },
    data: JSON.stringify(payload),
    withCredentials: true, // This enables automatic cookie handling
  };

  await axios.request(config);

  if (
    payload?.data?.attributes.post_type === 'image_file' &&
    allFiles?.filter(item => item?.media_type === 'image_data')?.length
  ) {
    const finalPayload = {
      data: [],
    };
    for (const imageMedia of imageMediaResponse) {
      const imageRelationRes = await getRelationShipPayload(imageMedia?.data?.id, headers, csrf);

      const imageRelationPayload = createPayloadObj(imageRelationRes);

      finalPayload.data.push(imageRelationPayload);
    }

    const imageRelationConfig = {
      method: 'patch',
      maxBodyLength: Infinity,
      url: `https://www.patreon.com/api/posts/${postId}/relationships/images?json-api-version=1.0&json-api-use-default-includes=false&include=%5B%5D`,
      headers: {
        baggage: headers?.baggage,
        'content-type': 'application/vnd.api+json',
        'sentry-trace': headers['sentry-trace'],
        'x-csrf-signature': csrf,
        referrerPolicy: 'no-referrer',
      },
      data: JSON.stringify(finalPayload),
      withCredentials: true, // This enables automatic cookie handling
    };
    await axios.request(imageRelationConfig);
  }
};

const getRelationShipPayload = async (postId: string, headers: headersType, csrf: string) => {
  const imageRelationConfig = {
    method: 'get',
    maxBodyLength: Infinity,
    url: `https://www.patreon.com/api/media/${postId}?json-api-version=1.0&json-api-use-default-includes=false&include=[]`,
    headers: {
      baggage: headers?.baggage,
      'content-type': 'application/vnd.api+json',
      'sentry-trace': headers['sentry-trace'],
      'x-csrf-signature': csrf,
      referrerPolicy: 'no-referrer',
    },
    withCredentials: true, // This enables automatic cookie handling
  };
  const response = await axios.request(imageRelationConfig);
  return response?.data;
};
export type headersType = {
  'Content-Type': string;
  baggage: string;
  'sentry-trace': string;
};

const hideDefaultPopUp = async (startTime: number = Date.now()) => {
  const popUpEle = document.querySelector('#edit-post-confirm-scheduling-alert');

  if (Date.now() - startTime > 5000) {
    return;
  }

  if (!popUpEle) {
    setTimeout(() => hideDefaultPopUp(startTime), 300);
    return;
  }

  const schedulingData = await schedulingStorage.get();
  // Set end time dynamically to 10 seconds from now for demonstration
  const durationForEach = schedulingData?.length * 8;
  const endTime = Date.now() + durationForEach * 1000;
  popUpEle.setAttribute('style', 'display:none;');
  const counter = await schedulingCounterStorage.get();
  const countValue = counter.usedCounter + 1;

  if (!counter.hasAnswered) await schedulingCounterStorage.add(false, countValue, false);

  await isSchedulingStartStorage.add(true, endTime, 'Pending');
};
