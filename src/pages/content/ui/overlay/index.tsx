/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import config from '@root/src/config';
import refreshOnUpdate from 'virtual:reload-on-update-in-view';
import { createRoot } from 'react-dom/client';
import OverlayView from './overlay-view';
import ConfirmationPopUp from '../confirmation-pop-up';
import postContentStorage from '@root/src/shared/storages/post-content-storage';
import extEnableStorage from '@root/src/shared/storages/extEnableStorage';
import FeedbackPopUp from '../feedback';
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
    }
  };
  const checkValidView = async () => {
    const postContent = await postContentStorage.get();
    const isEditPost = document.querySelector(config.pages.headerRootSelector)?.textContent?.includes('Edit');
    if (isEditPost) return false;

    if (postContent?.body) {
      const parsedData = JSON.parse(postContent?.body);
      const postType =
        parsedData?.data?.attributes?.post_type === 'video_external_file' ||
        parsedData?.data?.attributes?.post_type === 'audio_file';

      if (postType) return false;
    }

    return true;
  };

  const injectButtonListener = () => {
    const scheduleonControl = document.getElementById('open-scheduleon-readeon-control');

    if (!scheduleonControl) {
      setTimeout(() => injectButtonListener(), 500);
      return;
    }

    scheduleonControl?.addEventListener('click', async () => {
      console.log('open pop up');

      chrome.runtime.sendMessage({ action: 'Open_PopUp' });
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
  reportIssuePatreon();
  //* this function runs one time and inject the buttons into the sidebar
  injectButtonListener();
})();
