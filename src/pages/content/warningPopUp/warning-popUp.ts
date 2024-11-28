/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */

import extEnableStorage from '@root/src/shared/storages/extEnableStorage';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';

refreshOnUpdate('pages/content/warningPopUp/warning-popUp');
(async function () {
  const exitWarningPopup = document.getElementById('scheduleon-warning-banner-pop-up');
  const extEnable = await extEnableStorage.get();
  if (!extEnable) {
    return;
  }
  // Check if the popup is already shown on this page load
  if (exitWarningPopup?.style?.display === 'block') return;

  // Create the popup element
  const popup = `
      <div id='scheduleon-warning-banner-pop-up' style='border: 2px solid var(--global-border-action-default);overflow-wrap: anywhere; position:fixed;bottom:25px;right:30px;width:340px;padding:10px;background-color:var(--global-bg-page-default);color:#FF7F3E;text-align:center;z-index:1300;display:block;border-radius:6px;'>
     <span id='scheduleon-warning-close-icon' style='background-color:#FF7F3E;width:11px;heigjt display:block;border-radius: 50%;left:-6px;top:-10px;padding:4px;position: absolute;font-size:10px;cursor:pointer;color:var(--global-content-regular-default);'>&#x2715;</span>
   
      <p>Tip: Scheduleon does not support creating multiple posts at the same time. Please close all tabs related to post creation and start with a fresh post to use Scheduleon without issues.</p>
      
      </div>`;

  // Append the popup to the body
  document.body.insertAdjacentHTML('beforeend', popup);

  const icon = document.getElementById('scheduleon-warning-close-icon');

  icon?.addEventListener('click', () => {
    const exitWarningPopUp = document.getElementById('scheduleon-warning-banner-pop-up');
    exitWarningPopUp.style.display = 'none';
  });
})();
