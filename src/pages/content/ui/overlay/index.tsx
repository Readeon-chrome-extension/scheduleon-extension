/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import config from '@root/src/config';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';
import { createRoot } from 'react-dom/client';
import OverlayView from './overlay-view';
import ConfirmationPopUp from '../confirmation-pop-up';
import postContentStorage from '@root/src/shared/storages/postContentStorage';
import extEnableStorage from '@root/src/shared/storages/extEnableStorage';
import FeedbackPopUp from '../feedback';
import ScheduleonControl from '../scheduleon-control';
import isCreatePostReloadStorage from '@root/src/shared/storages/isCreatePostReload';
refreshOnUpdate('pages/content/ui');

(() => {
  let overlayInjected = false;
  let overlayShowBtnInjected = false;
  const observer = new MutationObserver(async mutationsList => {
    // Look through all mutations that just occurred
    for (const mutation of mutationsList) {
      // If the addedNodes property has one or more nodes
      if (mutation.addedNodes.length) {
        const overlayInjectRootEle = document.querySelector(config.pages.overlyMountRootSelector);
        const overlayViewBtnELe = document?.querySelector(config.pages.continueWithAuthoreonBtnInjectSelector);

        if (overlayViewBtnELe && !overlayShowBtnInjected) {
          overlayShowBtnInjected = true;
          mountShowOverlayBtn(overlayViewBtnELe);
        }
        if (overlayInjectRootEle && !overlayInjected) {
          overlayInjected = true;
          mountOverlay(overlayInjectRootEle);
        }
      }
    }
  });
  observer.observe(document?.body, { childList: true, subtree: true });

  const mountOverlay = async (overlayRootElement: Element) => {
    const isValidView = await checkValidView();
    const extEnable = await extEnableStorage.get();
    if (!extEnable) {
      return;
    }
    if (!isValidView) return;

    const overlayRoot = document.createElement('div');
    overlayRootElement.insertAdjacentElement('beforeend', overlayRoot);

    const overlayRootIntoShadow = document.createElement('div');
    overlayRootIntoShadow.id = 'overlay-shadow-root-scheduleon';

    overlayRoot.id = `patreon-chrome-extension-creator-overlay-scheduleon`;

    const styleDiv = document.createElement('div');
    overlayRoot.appendChild(overlayRootIntoShadow);
    overlayRoot.appendChild(styleDiv);
    try {
      createRoot(overlayRootIntoShadow).render(
        <>
          <OverlayView />
          <ConfirmationPopUp />
          <FeedbackPopUp />
          <ScheduleonControl />
        </>,
      );
    } catch (error) {
      console.error(error);
    }
  };
  const mountShowOverlayBtn = async (overlayViewBtnELe: Element) => {
    const isValidView = await checkValidView();
    const extEnable = await extEnableStorage.get();
    if (!extEnable) {
      return;
    }
    if (!isValidView) return;

    overlayViewBtnELe.setAttribute('style', 'display:none;');
    const btn = `<div id="continue-with-authoreon-btn" ><button class="common_button" id="continue-authoreon-btn" style="padding:0 10px;font-size:14px;font-weight:700;min-height:40px;max-height:40px;">Continue With Scheduleon</button></div>`;
    if (overlayViewBtnELe?.parentElement && window.location.pathname?.includes('edit')) {
      overlayViewBtnELe?.parentElement.setAttribute('style', 'display:flex;gap:8px;align-items:center;');

      overlayViewBtnELe?.parentElement?.insertAdjacentHTML('beforeend', btn);
      setTimeout(addWarningDiv, 900);
    }
  };
  const checkValidView = async () => {
    const postContent = await postContentStorage.get();
    const isEditPost = document.querySelector(config.pages.headerRootSelector)?.textContent?.includes('Edit');
    if (isEditPost) {
      setTimeout(() => addWarningDiv(undefined, isEditPost), 900);
      return false;
    }
    const postType = postContent?.attributes?.post_type;
    const isInValidPost = postType === 'video_external_file' || postType === 'audio_file';

    if (isInValidPost) {
      setTimeout(() => addWarningDiv(postType, isEditPost), 900);
      return false;
    }

    return true;
  };
  const addWarningDiv = (type?: 'video_external_file' | 'audio_file', isEditPost?: boolean) => {
    const headerEle = document.querySelector(config.pages.headerRootSelector);
    const isExist = document.getElementById('scheduleon-post-warning-container');
    if (isExist) return;

    if (headerEle?.parentElement?.parentElement?.parentElement) {
      const warningDiv = `<div
      id="scheduleon-post-warning-container"
      style="
        border: var(--global-borderWidth-thin) solid var(--global-border-action-default);
        border-radius: 'var(--global-radius-md)';
        padding: 16px;
        text-align: center;
        color: #FF7F3E;
        width:94%;
        margin-bottom:12px;
        font-size:14px;
      ">
${type === 'audio_file' || type === 'video_external_file' ? 'Scheduleon does not support audio or video posts.' : isEditPost ? 'Scheduleon does not support editing a scheduled or submitted post.' : 'Do not use Scheduleon on draft posts. Scheduleon is only meant to be used for new posts. Also, it is highly recommended to add attachments one at a time rather than all at once for a smooth experience.'}  </div>`;
      headerEle?.parentElement?.parentElement?.parentElement.insertAdjacentHTML('afterbegin', warningDiv);
    }
  };

  const injectButtonListener = () => {
    const scheduleonControl = document.getElementById('open-scheduleon-readeon-control');

    if (!scheduleonControl) {
      setTimeout(() => injectButtonListener(), 500);
      return;
    }

    scheduleonControl?.addEventListener('click', async () => {
      window.postMessage({ type: 'open-scheduleon-control' });
    });
  };

  const reportIssuePatreon = async () => {
    const extEnabled = await extEnableStorage?.get();
    const navElement = document?.querySelector(config.pages.sideBarNavElementSelector) as HTMLElement;
    const sidebarEle = document.getElementById(config.pages.sideBarSelector);

    if (navElement && extEnabled) {
      navElement.style.flexDirection = 'column';
      navElement.style.gap = '12px';
    }
    sidebarEle.style.zIndex = '1195';

    const injectButton = `<div id="scheduleon-buttons-container" style="display:flex;flex-direction:column;gap:8px;"><button class="common_button" id="open-scheduleon-readeon-control" style='padding:0;width:190px;font-size:12px;'>Open Scheduleon Controls</button>
    <button class="common_button" id="support-scheduleon-feedback" style='padding:0;width:190px;font-size:12px;'>Give Scheduleon Feedback</button>
    </div>`;

    if (extEnabled) navElement?.insertAdjacentHTML('beforeend', injectButton);
    const sidebarElement = document?.getElementById('main-app-navigation');
    const sideReadeonButtons = document?.getElementById('scheduleon-buttons-container') as HTMLElement;
    if (sidebarElement?.clientWidth < 248) {
      sideReadeonButtons.style.display = 'none';
    }
  };

  window?.addEventListener('resize', () => {
    const sideBarElement = document.getElementById('scheduleon-buttons-container') as HTMLElement;
    const size = window.innerWidth;
    if (sideBarElement) {
      if (size < 978) {
        sideBarElement.style.display = 'none';
      } else if (size >= 978) {
        sideBarElement.style.display = 'flex';
      }
    }
  });
  const reloadTab = async () => {
    const pathname = window.location.pathname; // Extract the URL from the active tab
    const cretePostReload = await isCreatePostReloadStorage.get();
    const isEditPost = document.querySelector(config.pages.headerRootSelector)?.textContent?.includes('Edit');
    if (pathname.includes('edit') && !cretePostReload && !isEditPost) {
      await isCreatePostReloadStorage.add(true);
      setTimeout(() => {
        window.location.reload();
      }, 600);
    }
    if (pathname.includes('library') && cretePostReload) {
      await isCreatePostReloadStorage.add(false);
    }
  };
  // Function to start observing
  const trackUrlChanges = () => {
    let currentPathname = window.location.pathname;

    const observer = new MutationObserver(async () => {
      const newPathname = window.location.pathname;
      if (newPathname !== currentPathname) {
        currentPathname = newPathname; // Update the tracked pathname
        await reloadTab(); // Execute your function on URL change
        observer.disconnect();
      }
    });

    // Observe changes in the body element and its subtree
    observer.observe(document.body, { childList: true, subtree: true });
  };

  // Start the observer
  trackUrlChanges();

  reportIssuePatreon();
  //* this function runs one time and inject the buttons into the sidebar
  injectButtonListener();
})();
