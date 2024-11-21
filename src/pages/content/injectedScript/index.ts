(() => {
  const getIntercepts = async () => {
    const { fetch: originFetch } = window;
    try {
      window.fetch = async (...args) => {
        const [resource, config] = args;
        console.log('Intercepted fetch request:', { resource, config });

        const response = await originFetch(resource, config);
        const url = response?.url;
        const query = url?.split('?')[1];
        const params = new URLSearchParams(query);
        console.log('Response URL:', url);

        if (url.startsWith('https://www.patreon.com/api/auth')) {
          console.log('Intercepted auth API call');
          const authResponse = await response?.clone()?.json();
          console.log('Auth response:', authResponse);

          if (authResponse?.data?.attributes?.logged_in_csrf_token?.length) {
            window.parent.postMessage({
              type: 'x-csrf-token',
              csrfToken: authResponse?.data?.attributes?.logged_in_csrf_token,
            });
            console.log('Posted x-csrf-token message');
          }
        }

        if (params.has('fields[reward]') && url.startsWith('https://www.patreon.com/api/posts')) {
          console.log('Intercepted posts API call with fields[reward]');
          const accessRules = await response?.clone()?.json();
          console.log('Access rules:', accessRules);

          window.parent.postMessage({
            type: 'access-rules',
            accessRules: accessRules?.included,
          });
          console.log('Posted access-rules message');
        }

        if (
          url?.startsWith('https://www.patreon.com/api/media?json-api-version=1.0&json-api-use-default-includes=false')
        ) {
          console.log('Intercepted media API call');
          const mediaResponse = await response?.clone()?.json();
          console.log('Media response:', mediaResponse);

          window.parent.postMessage({
            type: 'media-file-response',
            mediaResponse: mediaResponse,
          });
          console.log('Posted media-file-response message');
        }

        return response;
      };
    } catch (error) {
      console.error('Error in getIntercepts:', error);
    }
  };

  const modifyFetch = async () => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      console.log('Intercepting fetch request:', { input, init });

      // Modify the request body for POST requests to /api/posts
      if (init && init.body && input?.startsWith('https://www.patreon.com/api/posts') && init?.method === 'POST') {
        try {
          console.log('Intercepted POST request to /api/posts');
          window.parent.postMessage({
            type: 'post-content',
            postContent: { body: init?.body, headers: init.headers, url: input },
          });
          console.log('Posted post-content message');
        } catch (e) {
          console.error('Error parsing JSON in POST request:', e);
        }
      }

      // Modify the request body for PATCH requests with specific query parameters
      if (
        init &&
        init.body &&
        init?.method === 'PATCH' &&
        input?.startsWith('https://www.patreon.com/api/posts') &&
        input.split('?')[1]?.startsWith('include=access_rules.tier.null%2Cattachments.null')
      ) {
        console.log('Intercepted PATCH request to /api/posts with specific query parameters');
        const schedulingData = localStorage.getItem('scheduling-data');
        console.log('Scheduling data from localStorage:', schedulingData);

        if (schedulingData) {
          const data = JSON.parse(schedulingData);
          const accessRules = {
            type: 'access-rule',
            id: data?.access_rule_id,
          };
          const payload = JSON.parse(init.body);
          console.log('Original payload:', payload);

          payload.data.attributes.scheduled_for = data?.date_time;
          payload.data.attributes.tags.publish = false;
          payload.data.relationships['access-rule'].data = accessRules;
          payload.data.relationships['access_rules'].data = [accessRules];

          const filterData = payload.included?.filter(item => item.type !== 'access-rule');
          filterData.push({ ...accessRules, attributes: {} });
          payload.included = filterData;

          init.body = JSON.stringify(payload);
          console.log('Modified payload:', payload);

          window.parent.postMessage({
            type: 'scheduling-start',
            postContent: { body: init?.body, headers: init.headers, url: input },
          });
          console.log('Posted scheduling-start message');
        }
      }

      // Handle PATCH requests to update posts
      if (
        init &&
        init.body &&
        init?.method === 'PATCH' &&
        input?.startsWith('https://www.patreon.com/api/posts') &&
        input.split('?')[1]?.startsWith('fields[post]')
      ) {
        console.log('Intercepted PATCH request to update post');
        const data = JSON.parse(init.body);
        console.log('Post update data:', data);

        window.parent.postMessage({
          type: 'post-update-response',
          postData: data,
        });
        console.log('Posted post-update-response message');
      }

      // Handle DELETE requests to media endpoints
      if (init && init?.method === 'DELETE' && input?.startsWith('https://www.patreon.com/api/media/')) {
        console.log('Intercepted DELETE request to media endpoint');
        const id = input?.split('/').pop().split('?')[0];
        console.log('Media ID to delete:', id);

        window.parent.postMessage({
          type: 'delete-attachments',
          id: id,
        });
        console.log('Posted delete-attachments message');
      }

      // Call the original fetch function with the (possibly) modified request
      return originalFetch(input, init);
    };
  };

  getIntercepts();
  modifyFetch();
})();
