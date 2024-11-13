/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import extEnableStorage from '@root/src/shared/storages/extEnableStorage';

import refreshOnUpdate from 'virtual:reload-on-update-in-view';

refreshOnUpdate('pages/content/banner/banner-script');

const getBannerData = async () => {
  const response = await fetch('https://www.readeon.com/api/banner?ext=Scheduleon');
  const data = await response?.json();
  return data;
};

(async function () {
  const extEnable = await extEnableStorage.get();
  if (!extEnable) {
    return;
  }
  const bannerData = await getBannerData();

  if (!bannerData?.id) return;

  const exitBanner = document.getElementById('custom-banner-scheduleon');
  // Check if the banner is already shown on this page load
  if (exitBanner?.style?.display === 'block') return;
  const isReadeonBanner = document.getElementById('custom-banner');
  // Create the banner element
  const banner = `
    <div id='custom-banner-scheduleon' style='border: 2px solid var(--global-border-muted-default);overflow-wrap: anywhere; position:fixed;top:${isReadeonBanner ? '32%' : '16px'};left:5%;width:90%;padding:10px;background-color:var(--global-bg-base-default);color:var(--global-content-regular-default);text-align:center;z-index:1300;display:block;border-radius:6px;'>
   <span id='banner-close-icon-scheduleon' style='display:block;float:right;margin-right:8px;font-size:22px;cursor:pointer;color:var(--global-content-regular-default);'>&#x2715;</span>
   <div>
    <h1>${bannerData?.title ?? ''}</h1>
    <div id="banner-message" >${bannerData?.message}</div>
    </div>
    </div>`;

  // Append the banner to the body
  document.body.insertAdjacentHTML('beforeend', banner);

  const icon = document.getElementById('banner-close-icon-scheduleon');

  icon?.addEventListener('click', () => {
    const exitBanner = document.getElementById('custom-banner-scheduleon');
    exitBanner.style.display = 'none';
  });

  // Set a flag to ensure the banner isn't shown again during the same page session

  // Optionally, remove the banner after a few seconds
  setTimeout(() => {
    const exitBanner = document.getElementById('custom-banner-scheduleon');
    exitBanner.style.display = 'none';
  }, 15000);
})();
