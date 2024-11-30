/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
(() => {
  const getIntercepts = async () => {
    const { fetch: originFetch } = window;
    try {
      window.fetch = async (...args) => {
        const [resource, config] = args;

        const response = await originFetch(resource, config);
        const url = response?.url;
        const query = url?.split('?')[1];
        const params = new URLSearchParams(query);
        if (url.startsWith('https://www.patreon.com/api/auth')) {
          const authResponse = await response?.clone()?.json();
          if (authResponse?.data?.attributes?.logged_in_csrf_token?.length) {
            window.parent.postMessage({
              type: 'x-csrf-token',
              csrfToken: authResponse?.data?.attributes?.logged_in_csrf_token,
            });
          }
        }
        if (params.has('fields[reward]') && url.startsWith('https://www.patreon.com/api/posts')) {
          const accessRules = await response?.clone()?.json();
          window.parent.postMessage({
            type: 'access-rules',
            accessRules: accessRules?.included,
          });
          console.log('fields[reward]', { accessRules });
          window.parent.postMessage({
            type: 'post-content',
            postContent: accessRules?.data,
          });
        }
        if (
          url?.startsWith('https://www.patreon.com/api/media?json-api-version=1.0&json-api-use-default-includes=false')
        ) {
          const mediaResponse = await response?.clone()?.json();
          window.parent.postMessage({
            type: 'media-file-response',
            mediaResponse: mediaResponse,
          });
        }

        return response;
      };
    } catch (error) {
      console.log('error', error);
    }
  };

  const modifyFetch = async () => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      // Modify the request body
      if (init && init.body && input?.startsWith('https://www.patreon.com/api/posts') && init?.method === 'POST') {
        try {
          window.parent.postMessage({
            type: 'post-content',
            postContent: JSON.parse(init?.body)?.data,
          });
        } catch (e) {
          console.error('Error parsing JSON:', e);
        }
      }
      if (
        init &&
        init.body &&
        init?.method === 'PATCH' &&
        input?.startsWith('https://www.patreon.com/api/posts') &&
        input.split('?')[1].startsWith('include=access_rules.tier.null%2Cattachments.null')
      ) {
        const schedulingData = localStorage.getItem('scheduling-data');

        if (schedulingData) {
          const data = JSON.parse(schedulingData);
          const accessRules = {
            type: 'access-rule',
            id: data?.access_rule_id,
          };
          const payload = JSON.parse(init.body);
          payload.data.attributes.scheduled_for = data?.date_time;
          payload.data.attributes.tags.publish = false;
          payload.data.relationships['access-rule'].data = accessRules;
          payload.data.relationships['access_rules'].data = [accessRules];
          const filterData = payload.included?.filter(item => item.type !== 'access-rule');
          filterData.push({ ...accessRules, attributes: {} });
          payload.included = filterData;

          init.body = JSON.stringify(payload);
          window.parent.postMessage({
            type: 'scheduling-start',
            postContent: { body: init?.body, headers: init.headers, url: input },
          });
        }
      }

      if (
        init &&
        init.body &&
        init?.method === 'PATCH' &&
        input?.startsWith('https://www.patreon.com/api/posts') &&
        input.split('?')[1].startsWith('fields[post]')
      ) {
        const data = JSON.parse(init.body);
        window.parent.postMessage({
          type: 'post-update-response',
          postData: data,
        });
      }
      if (init && init?.method === 'DELETE' && input?.startsWith('https://www.patreon.com/api/media/')) {
        const id = input?.split('/').pop().split('?')[0]; // '377788032'
        window.parent.postMessage({
          type: 'delete-attachments',
          id: id,
        });
      }
      // Call the original fetch function with the modified request
      return originalFetch(input, init);
    };
  };
  const isEnable = localStorage.getItem('scheduleon-enable');
  console.log('injected Script', isEnable);
  if (isEnable === 'true') {
    getIntercepts();
    modifyFetch();
  }
})();
