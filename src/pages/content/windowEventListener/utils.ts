/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */

import csrfTokenStorage from '@root/src/shared/storages/csrf-token-storage';
import fileDataStorage from '@root/src/shared/storages/fileStorage';
import isSchedulingStartStorage from '@root/src/shared/storages/isSchedulingStart';
import schedulingCounterStorage from '@root/src/shared/storages/schedulingCounterStorage';
import schedulingStorage from '@root/src/shared/storages/schedulingStorage';
import axios from 'axios';

const toCamelCase = (key: string) => {
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};
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
  await isSchedulingStartStorage.add(false, null);
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
// Helper function to convert Base64 back to an ArrayBuffer
const base64ToArrayBuffer = base64 => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// adding the attachments with post
const attachMedia = async (postId: string, headers: headersType, csrf: string, parsedFile: any[]) => {
  const responseArray = [];
  try {
    for (const file of parsedFile) {
      const arrayBuffer = base64ToArrayBuffer(file.data);

      const fileData = new File([arrayBuffer], file.name, { type: file.type });
      const payload = {
        data: {
          attributes: {
            file_name: file?.name,
            owner_id: postId,
            owner_relationship: file?.media_type === 'image_data' ? 'main' : 'attachment',
            owner_type: 'post',
            ...(file?.media_type === 'attachment_data' && { size_bytes: fileData?.size }),
            state: 'pending_upload',
          },
          type: 'media',
        },
      };

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `https://www.patreon.com/api/media?json-api-version=1.0&json-api-use-default-includes=false&include=%5B%5D`,
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

      //making the media api call
      const response = await axios.request(config);
      const responseData = response?.data;
      if (file?.media_type === 'image_data') {
        responseArray?.push(responseData);
      }

      //extracting the parameters from response
      const upload_parameters = responseData?.data?.attributes?.upload_parameters;
      const data = new FormData();
      data.append('X-Amz-Algorithm', upload_parameters?.['X-Amz-Algorithm']);
      data.append('X-Amz-Credential', upload_parameters?.['X-Amz-Credential']);
      data.append('X-Amz-Date', upload_parameters?.['X-Amz-Date']);
      data.append('X-Amz-Security-Token', upload_parameters?.['X-Amz-Security-Token']);
      data.append('X-Amz-Signature', upload_parameters['X-Amz-Signature']);
      data.append('acl', upload_parameters?.['acl']);
      data.append('bucket', 'patreon-media');
      data.append('key', upload_parameters?.['key']);
      data.append('policy', upload_parameters?.['policy']);

      if (file?.media_type === 'image_data') {
        const blob = new Blob([arrayBuffer], { type: file.type });
        data.append('file', blob, file?.name);
      } else {
        data.append('file', fileData, fileData?.name);
      }

      const config2 = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://patreon-media.s3-accelerate.amazonaws.com/',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        data: data,
      };
      await axios.request(config2);
    }
    return responseArray;
  } catch (error) {
    console.log(error);
  }
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
  const fileData = await fileDataStorage.get();
  const parsedFile = fileData?.data ? JSON.parse(fileData?.data) : [];
  console.log('parsed', { parsedFile });

  if (parsedFile?.length) {
    imageMediaResponse = await attachMedia(postId, headers, csrf ?? headers['X-CSRF-Signature'], parsedFile);
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
    parsedFile?.filter(item => item?.media_type === 'image_data')?.length
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
type headersType = {
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

  await isSchedulingStartStorage.add(true, endTime);
};
