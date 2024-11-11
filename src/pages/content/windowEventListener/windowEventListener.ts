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
import { createPayloadObj } from './utils';

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
  });

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

  const schedulingStart = async (body: any, headers: headersType, url: string) => {
    const schedulingData = await schedulingStorage.get();

    if (!schedulingData?.length) return;

    const csrf = await csrfTokenStorage.get();
    hideDefaultPopUp();
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (const details of schedulingData) {
      try {
        const postId = await makeCreatePostCall(
          headers,
          csrf ?? headers['X-CSRF-Signature'],
          body?.data?.attributes?.post_type,
        );
        await makePatchCall(
          postId,
          headers,
          csrf ?? headers['X-CSRF-Signature'],
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
              owner_relationship: file?.type?.includes('image') ? 'main' : 'attachment',
              owner_type: 'post',
              ...(file?.type?.includes('image') && { size_bytes: fileData?.size }),
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
        if (file?.type?.includes('image')) {
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

        if (file?.type?.includes('image')) {
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

    if (payload?.data?.attributes.post_type === 'image_file' && parsedFile?.length) {
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
})();
