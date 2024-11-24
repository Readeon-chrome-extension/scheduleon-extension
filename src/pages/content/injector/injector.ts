// import extEnableStorage from '@root/src/shared/storages/extEnableStorage';

// import refreshOnUpdate from 'virtual:reload-on-update-in-view';

// refreshOnUpdate('pages/content/injector/index');

// (async () => {
//   const ext = await extEnableStorage.get();

//   if (!ext) return;

//   // Remove any existing script tags (more robust)
//   const existingScripts = document.querySelectorAll(`script[src^="${chrome.runtime.getURL('')}"]`);
//   existingScripts.forEach(script => {
//     if ((script as HTMLScriptElement).src.includes('src/pages/contentInjector/index.js')) {
//       script.remove();
//     }
//   });

//   // Inject the script dynamically as a string with IIFE
//   const scriptContent = `
//     (function() {
//       console.log("Intercepting script injected and running!");

//       // Intercept fetch requests
//       const originalFetch = window.fetch;
//       window.fetch = async (resource, config) => {
//         if (typeof resource === 'string' && resource.startsWith('https://www.patreon.com/api/')) {
//           console.log('Patreon API call intercepted (fetch):', config?.method || 'GET', resource);

//           try {
//             const response = await originalFetch(resource, config);

//             const url = response?.url;
//             const query = url?.split('?')[1];
//             const params = new URLSearchParams(query);

//             if (params.has('fields[reward]') && url.startsWith('https://www.patreon.com/api/posts')) {
//               console.log('Specific Patreon API call intercepted (fields[reward]):', config?.method || 'GET', url);
//               const accessRules = await response.clone().json();
//               window.parent.postMessage({
//                 type: 'access-rules',
//                 accessRules: accessRules.included,
//               });
//             }

//             if (url.startsWith('https://www.patreon.com/api/auth')) {
//               console.log('Specific Patreon API call intercepted (auth):', config?.method || 'GET', url);
//               const authResponse = await response.clone().json();
//               if (authResponse?.data?.attributes?.logged_in_csrf_token?.length) {
//                 window.parent.postMessage({
//                   type: 'x-csrf-token',
//                   csrfToken: authResponse.data.attributes.logged_in_csrf_token,
//                 });
//               }
//             }

//             if (
//               url?.startsWith(
//                 'https://www.patreon.com/api/media?json-api-version=1.0&json-api-use-default-includes=false',
//               )
//             ) {
//               console.log('Specific Patreon API call intercepted (media):', config?.method || 'GET', url);
//               const mediaResponse = await response.clone().json();
//               window.parent.postMessage({
//                 type: 'media-file-response',
//                 mediaResponse: mediaResponse,
//               });
//             }

//             // Logic for POST requests to https://www.patreon.com/api/posts
//             if (config && config.body && resource.startsWith('https://www.patreon.com/api/posts') && config.method === 'POST') {
//               console.log('Specific Patreon API call intercepted (POST):', config?.method || 'GET', resource);
//               try {
//                 window.parent.postMessage({
//                   type: 'post-content',
//                   postContent: { body: config.body, headers: config.headers, url: resource },
//                 });
//               } catch (e) {
//                 console.error('Error parsing JSON:', e);
//               }
//             }

//             // Logic for PATCH requests to https://www.patreon.com/api/posts
//             if (
//               config &&
//               config.body &&
//               config.method === 'PATCH' &&
//               resource.startsWith('https://www.patreon.com/api/posts')
//             ) {
//               if (resource.split('?')[1].startsWith('include=access_rules.tier.null%2Cattachments.null')) {
//                 console.log('Specific Patreon API call intercepted (PATCH):', config?.method || 'GET', resource);
//                 const schedulingData = localStorage.getItem('scheduling-data');
//                 if (schedulingData) {
//                   const data = JSON.parse(schedulingData);
//                   const accessRules = {
//                     type: 'access-rule',
//                     id: data.access_rule_id,
//                   };
//                   const payload = JSON.parse(config.body);
//                   payload.data.attributes.scheduled_for = data.date_time;
//                   payload.data.attributes.tags.publish = false;
//                   payload.data.relationships['access-rule'].data = accessRules;
//                   payload.data.relationships['access_rules'].data = [accessRules];
//                   const filterData = payload.included.filter(item => item.type !== 'access-rule');
//                   filterData.push({ ...accessRules, attributes: {} });
//                   payload.included = filterData;

//                   config.body = JSON.stringify(payload);
//                   window.parent.postMessage({
//                     type: 'scheduling-start',
//                     postContent: { body: config.body, headers: config.headers, url: resource },
//                   });
//                 }
//               } else if (resource.split('?')[1].startsWith('fields[post]')) {
//                 console.log('Specific Patreon API call intercepted (PATCH):', config?.method || 'GET', resource);
//                 const data = JSON.parse(config.body);
//                 window.parent.postMessage({
//                   type: 'post-update-response',
//                   postData: data,
//                 });
//               }
//             }

//             // Logic for DELETE requests to https://www.patreon.com/api/media/
//             if (config && config.method === 'DELETE' && resource.startsWith('https://www.patreon.com/api/media/')) {
//               console.log('Specific Patreon API call intercepted (DELETE):', config?.method || 'GET', resource);
//               const id = resource.split('/').pop().split('?')[0];
//               window.parent.postMessage({
//                 type: 'delete-attachments',
//                 id: id,
//               });
//             }

//             return response;
//           } catch (error) {
//             console.error('Error in Patreon API call (fetch):', error);
//             throw error;
//           }
//         } else {
//           return originalFetch(resource, config);
//         }
//       };
//     })();
//   `;

//   const script = document.createElement('script');
//   script.textContent = scriptContent;
//   script.id = 'my-injected-script';

//   document.documentElement.insertBefore(script, document.documentElement.firstChild);
// })();
