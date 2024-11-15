import extEnableStorage from '@root/src/shared/storages/extEnableStorage';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';
refreshOnUpdate('pages/content/injector/index');

(async () => {
  const ext = await extEnableStorage.get();
  if (!ext) return;

  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('src/pages/injectedScript/index.js');

  (document.head || document.documentElement).appendChild(script);
})();
