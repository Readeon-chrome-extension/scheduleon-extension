/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import userDataStorage from '@root/src/shared/storages/user-storage';
import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';
import { patreonUrl, webURL } from '../popup/components/Header';

import accessRulesStorage from '@root/src/shared/storages/accessRuleStorage';
import { generateSchedulingOptions } from '@root/src/shared/utils/schedulingOptions';
import postContentStorage from '@root/src/shared/storages/postContentStorage';
import isSchedulingStartStorage from '@root/src/shared/storages/isSchedulingStart';
import isWarningShowStorage from '@root/src/shared/storages/isWarningShowStorage';
import schedulingStorage from '@root/src/shared/storages/schedulingStorage';
import isCreatePostReloadStorage from '@root/src/shared/storages/isCreatePostReload';
import isPublishScreenStorage from '@root/src/shared/storages/isPublishScreen';
import extEnableStorage from '@root/src/shared/storages/extEnableStorage';

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
        chrome.tabs.reload(tab.id).then();
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
  const isEnable = await extEnableStorage.get();
  if (changeInfo.status === 'complete') {
    if (isPatreonUrl(tab.url)) {
      const postContent = await postContentStorage.get();

      const patreonSession = await chrome.cookies?.get({ url: 'https://www.patreon.com', name: 'session_id' });

      userDataStorage.add({ isLoggedIn: !!patreonSession });
      chrome.tabs.query({}, tanInfo => {
        const postType = postContent?.attributes?.post_type;
        const isInValidPost = postType === 'video_external_file' || postType === 'audio_file';
        const patreonTabs = tanInfo?.filter(
          tab => tab?.url?.startsWith('https://www.patreon.com') && new URL(tab?.url)?.pathname?.includes('edit'),
        );
        if (patreonTabs?.length > 1 && patreonSession?.value && !isInValidPost) {
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['src/pages/contentWarningScript/index.js'],
          });
        }
      });
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
  if (isEnable) {
    // Inject the main custom script to override Patreon's scheduling feature
    chrome.scripting
      .executeScript({
        target: { tabId: tabId },
        files: ['src/pages/injectedScript/index.js'],
        world: 'MAIN', // Inject into MAIN world to bypass CSP
        injectImmediately: true,
      })
      .catch(err => console.error('Error injecting injectedScript:', err));
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
  await postContentStorage.setPostContent(null);
  await isCreatePostReloadStorage.add(false);
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
    chrome.tabs.query({}, tabs => {
      const patreonTab = tabs?.filter(
        tab => new URL(tab?.url)?.pathname?.includes('edit') && new URL(tab?.url)?.origin === 'https://www.patreon.com',
      );
      const tabData = patreonTab[0];
      chrome.tabs.update(tabData.id, { active: true, url: 'https://www.patreon.com/library' });
    });
  }
});
const sendMessage = (message: string) => {
  chrome?.tabs?.query({ currentWindow: true, active: true }, function (tabs) {
    const activeTab = tabs[0];

    chrome?.tabs?.sendMessage(activeTab?.id, { message });
  });
};
//* this below listener is used to track the theme changes in the cookies

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
chrome.webRequest.onCompleted.addListener(
  async details => {
    const queryParams = getQueryParams(details.url);

    if (
      queryParams.has('fields[reward]') &&
      queryParams.has('fields[post]') &&
      queryParams.has('fields[access_rule]')
    ) {
      console.log('[Intercepted GET] Fields[Reward] Request:', details);
      const { method, responseHeaders, url } = details;
      const headers = new Headers();
      responseHeaders.forEach(header => {
        headers.append(header.name, header.value);
      });
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      await delay(2000);
      const accessRules = await accessRulesStorage.get();

      if (!accessRules?.length) {
        const response = await fetch(url, { method, headers });
        const data = await response.json();
        const schedulingOptions = generateSchedulingOptions(data?.included);
        await accessRulesStorage.add(schedulingOptions);
      }
    }
    //updating the tiers
    if (
      queryParams.has('fields[reward]') &&
      (details?.method === 'PATCH' || details.method === 'POST') &&
      queryParams.get('include') === 'items'
    ) {
      // cleanup access rules storage if user update or crete new tiers
      await accessRulesStorage.add([]);
    }
    //Deleting the tiers
    if (
      queryParams.has('fields[reward]') &&
      details?.method === 'DELETE' &&
      queryParams.get('include') === 'tier_image,items,free_trial_configuration'
    ) {
      // cleanup access rules storage if user delete tiers
      await accessRulesStorage.add([]);
    }
  },
  {
    urls: ['*://www.patreon.com/api/posts*', 'https://www.patreon.com/api/rewards*'], // Target specific endpoints
  },
  ['responseHeaders'], // No extra options needed for GET requests
);
console.log('background loaded');
