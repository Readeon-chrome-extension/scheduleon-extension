/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import userDataStorage from '@root/src/shared/storages/user-storage';
import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';
import { patreonUrl, webURL } from '../popup/components/Header';

import isPublishScreenStorage from '@root/src/shared/storages/isPublishScreen';
import isSchedulingStartStorage from '@root/src/shared/storages/isSchedulingStart';
import isWarningShowStorage from '@root/src/shared/storages/isWarningShowStorage';

import schedulingStorage from '@root/src/shared/storages/schedulingStorage';

// reloadOnUpdate('pages/background');

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate('pages/content/style.scss');
const shownTabs = {};
chrome.runtime.onInstalled.addListener(() => {
  reloadPatreon();
  openOrFocusTab('https://www.patreon.com', 'https://www.patreon.com');
});
const reloadPatreon = (url?: string) => {
  chrome.tabs.query({}, async tabs => {
    const patreonUrl = url ?? 'https://www.patreon.com';
    tabs.forEach(tab => {
      if (tab.url && tab.url.startsWith(patreonUrl)) {
        chrome.tabs.reload(tab.id);
      }
    });
  });
};

const openOrFocusTab = (newUrl: string, baseUrl: string) => {
  chrome.tabs.query({}, tabs => {
    const existingTab = tabs.find(tab => tab.url?.startsWith(baseUrl));

    if (existingTab) {
      chrome.tabs.update(existingTab.id, { active: true, url: newUrl });
      // chrome.tabs.reload();
    } else {
      chrome.tabs.create({ url: newUrl });
    }
  });
};
// Listen for updates to tabs (e.g., navigation, reloads)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    if (isPatreonUrl(tab.url)) {
      const patreonSession = await chrome.cookies?.get({ url: 'https://www.patreon.com', name: 'session_id' });

      userDataStorage.add({ isLoggedIn: !!patreonSession });

      if (!shownTabs[tabId] && patreonSession?.value) {
        // Check if banner has already been shown on this tab
        // Inject content script to show the banner
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['src/pages/contentBannerScript/index.js'],
        });

        // Mark this tab as having shown the banner
        shownTabs[tabId] = true;
      }
      if (!patreonSession?.value) {
        if (shownTabs[tabId]) {
          delete shownTabs[tabId];
        }
      }
    }
  }
});
// Listen for tab removal to clear stored data
chrome.tabs.onRemoved.addListener(async tabId => {
  if (shownTabs[tabId]) {
    delete shownTabs[tabId];
  }
  await isSchedulingStartStorage.add(false, 0, 'Pending');
  await isWarningShowStorage.add(false);
  await schedulingStorage.add([]);
  await isPublishScreenStorage.setScreen(false);
});
// Listen for when the tab becomes inactive
chrome.tabs.onActivated.addListener(activeInfo => {
  const tabId = activeInfo.tabId;

  // Clear the shown status when the tab becomes inactive
  if (shownTabs[tabId]) {
    delete shownTabs[tabId];
  }
});
function isPatreonUrl(url: string) {
  return url.includes('patreon.com') && !url.includes('patreon.com/oauth2/authorize');
}
chrome.runtime.onMessage.addListener(request => {
  if (request.action === 'Reload_Patreon') {
    reloadPatreon();
  }
  if (request.action === 'Open_PopUp') {
    chrome.action.openPopup().then();
  }
  if (request.action === 'how-to-use-scheduleon') {
    openOrFocusTab(`${webURL}/faq`, webURL);
  }
  if (request.action === 'support-scheduleon') {
    openOrFocusTab(`${patreonUrl}/DemocraticDeveloper`, patreonUrl);
  }
  if (request.action === 'feedback_modal') {
    sendMessage(request.action);
  }
  if (request.action === 'scheduling-option-modal') {
    sendMessage(request.action);
  }
  if (request.action === 'redirect-library-page') {
    openOrFocusTab(`${patreonUrl}/library`, patreonUrl);
  }
  // if (request.action === 'redirect-library-page') {
  //   openOrFocusTab(`${patreonUrl}/library`, patreonUrl);
  // }
});
const sendMessage = (message: string) => {
  chrome?.tabs?.query({ currentWindow: true, active: true }, function (tabs) {
    const activeTab = tabs[0];

    chrome?.tabs?.sendMessage(activeTab?.id, { message });
  });
};
//* this below listener is used to track the theme changes in the cookies

console.log('background loaded');

/**
 * ============================================
 * WebRequest Listener for 'fields[reward]'
 * ============================================
 */

// Function to parse query parameters from a URL
function getQueryParams(url) {
  const urlObj = new URL(url);
  return new URLSearchParams(urlObj.search);
}

// Listener for GET requests with 'fields[reward]'
chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    const queryParams = getQueryParams(details.url);

    if (queryParams.has('fields[reward]')) {
      console.log('[Intercepted GET] Fields[Reward] Request:', details.url);

      // Send a message to the content script with the request details
      chrome.tabs.sendMessage(details.tabId, {
        type: 'fields-reward-request',
        url: details.url,
      });
    }
  },
  {
    urls: ['*://www.patreon.com/api/posts*'], // Target specific endpoints
    types: ['xmlhttprequest'], // Types of requests to intercept
  },
  [], // No extra options needed for GET requests
);
