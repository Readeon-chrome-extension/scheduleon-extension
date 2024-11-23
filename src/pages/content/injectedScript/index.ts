(() => {
  const interceptFetch = async () => {
    const { fetch: originFetch } = window;
    try {
      window.fetch = async (...args) => {
        const [input, init] = args;

        // Intercept requests before they are sent
        if (init && init.body && input?.startsWith('https://www.patreon.com/api/posts') && init?.method === 'POST') {
          try {
            window.parent.postMessage({
              type: 'post-content',
              postContent: { body: init?.body, headers: init.headers, url: input },
            });
          } catch (e) {
            console.error('Error parsing JSON:', e);
          }
        }
        console.log('intercept api details init', { init });
        console.log('intercept api details input', { input });
        if (
          init &&
          init.body &&
          init?.method === 'PATCH' &&
          input?.startsWith('https://www.patreon.com/api/posts') &&
          input.split('?')[1]?.startsWith('include=access_rules.tier.null%2Cattachments.null')
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
            console.log('scheduling start----');

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
          input.split('?')[1]?.startsWith('fields[post]')
        ) {
          const data = JSON.parse(init.body);
          window.parent.postMessage({
            type: 'post-update-response',
            postData: data,
          });
        }
        if (init && init?.method === 'DELETE' && input?.startsWith('https://www.patreon.com/api/media/')) {
          const id = input?.split('/').pop().split('?')[0];
          window.parent.postMessage({
            type: 'delete-attachments',
            id: id,
          });
        }

        // Proceed with the original fetch call
        const response = await originFetch(...args);
        const url = response?.url;
        const query = url?.split('?')[1];
        const params = new URLSearchParams(query);

        // Intercept responses after they are received
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
  interceptFetch();
})();
