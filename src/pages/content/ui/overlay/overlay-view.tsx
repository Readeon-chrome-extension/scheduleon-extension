/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import useStorage from '@root/src/shared/hooks/useStorage';
import React from 'react';
import ReactModal from 'react-modal';
import config from '@root/src/config';
import {
  attachmentsInput,
  backButtonHandler,
  combineDateTime,
  createPostBtnListener,
  customStyles,
  imageFileHandler,
  nextButtonHandler,
  scheduleBtnClick,
} from './overlay-utils';
import schedulingStorage from '@root/src/shared/storages/schedulingStorage';
import schedulingCounterStorage from '@root/src/shared/storages/schedulingCounterStorage';
import dayjs from 'dayjs';

import accessRulesStorage from '@root/src/shared/storages/accessRuleStorage';
import { toast, Toaster } from 'sonner';
import SchedulingFeedback from './schedulingFeedback';
import { AccessRulesData, ErrorTypes, selectedDataType } from './overlay.d';
import fileDataStorage from '@root/src/shared/storages/fileStorage';
import isPublishScreenStorage from '@root/src/shared/storages/isPublishScreen';
import { File } from 'lucide-react';
import { generateSchedulingOptions } from '@root/src/shared/utils/schedulingOptions';
import { schedulingOptionsFeedbacks, submitFeedback } from '@root/src/shared/utils/common';
import { getAllFiles } from '@root/src/shared/utils/indexDb';

const OverlayView = () => {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [data, setData] = React.useState<AccessRulesData[]>();

  const [error, setError] = React.useState<ErrorTypes>(null);
  const [selected, setSelected] = React.useState<selectedDataType[]>([]);
  const schedulingCounter = useStorage(schedulingCounterStorage);
  const fileStorage = useStorage(fileDataStorage);
  const accessRuleData = useStorage(accessRulesStorage);

  const [currentTheme, setCurrentTheme] = React.useState('dark');
  const [schedulingPopUp, setSchedulingPopUp] = React.useState<boolean>(false);
  const [createPostBtnEle, setCreatePostBtnEle] = React.useState<Element>();
  const handleBackBtn = React.useCallback(backButtonHandler, []);

  const hidePostAccess = async (startTime: number = Date.now()) => {
    const isNewUI = document
      .querySelector(config.pages.headerRootSelector)
      ?.parentElement?.parentElement?.querySelector(config.pages.postAccessRootNew);

    const postAccessRoot = isNewUI ? isNewUI : document.querySelector(config.pages.postAccessRoot);
    // Check if 5 seconds have passed
    if (Date.now() - startTime > 5000) {
      return;
    }

    if (!postAccessRoot) {
      setTimeout(() => hidePostAccess(startTime), 300);
      return;
    }
    const selectors = isNewUI
      ? ['#audience-selector', '#sell-post-toggle', '#scheduled-for-toggle', '#early-access-toggle']
      : [1, 2, 3, 4, 5];

    injectOverlayViewBtn();
    selectors?.forEach((selector: string | number) => {
      const element = isNewUI ? postAccessRoot?.querySelector(selector as string) : postAccessRoot.children[selector];
      if (element) {
        const closest = isNewUI ? element?.closest('[elevation="subtle"]') : element;

        closest?.setAttribute('style', 'display:none;');
      }
    });
    await isPublishScreenStorage.setScreen(true);
  };

  const handleContinueBtn = async () => {
    const nextButton: HTMLButtonElement = document.querySelector(config.pages.continueWithAuthoreonBtnInjectSelector);
    if (nextButton) {
      nextButton?.click();
      nextButton.removeAttribute('style');
      const files = await getAllFiles();
      console.log('files', { files });

      hidePostAccess();
    }
  };

  const handleOpen = React.useCallback(async () => {
    setIsOpen(true);
  }, []);
  const checkThemeAndData = async (data: AccessRulesData[]) => {
    const themeColorEle = document?.head?.querySelector('meta[name="theme-color"]');
    const themeColor = themeColorEle?.getAttribute('content');
    setCurrentTheme(themeColor.includes('#131313') ? 'dark' : 'light');
    if (!data?.length) {
      await submitFeedback(schedulingOptionsFeedbacks);
    }
  };
  const handleMessage = event => {
    // getting the access rules data from event
    if (event?.data.type === 'access-rules') {
      extractAccessRulesWithRewards(event.data.accessRules);
    }
  };

  const injectOverlayViewBtn = () => {
    const injectViewOverlay = document.querySelector(config.pages.headerRootSelector);
    const viewOverlayExist = document.querySelector('#open-overlay-view-btn');

    if (injectViewOverlay && !viewOverlayExist) {
      const isNewUI = document.querySelector(config.pages.postAccessRootNew);
      const btn = `<div id="open-overlay-view-btn-container" style="width:100%;display:flex;justify-content: center;${isNewUI ? 'margin-bottom:16px;' : ''}"><button class="common_button" id="open-overlay-view-btn" style="padding:0 10px;font-size:14px;margin-top:6px;font-weight:700;min-height:40px;max-height:40px;">Open Scheduling Options </button></div>`;
      injectViewOverlay?.insertAdjacentHTML('afterend', btn);

      const viewOverlay = document.querySelector('#open-overlay-view-btn');
      //removing the existing listener
      viewOverlay?.removeEventListener('click', handleOpen);
      viewOverlay.addEventListener('click', handleOpen);
    }
  };

  const extractAccessRulesWithRewards = async (accessRules: any[]) => {
    const schedulingOptions = generateSchedulingOptions(accessRules);
    await accessRulesStorage.add(schedulingOptions);
  };
  const OnChromeMessage = React.useCallback(action => {
    if (action.message === 'scheduling-option-modal') {
      setIsOpen(true);
    }
  }, []);

  React.useEffect(() => {
    window.addEventListener('message', handleMessage);
    let continueWithAuthoreonBtn;
    const observer = new MutationObserver(async mutationsList => {
      // Look through all mutations that just occurred
      for (const mutation of mutationsList) {
        // If the addedNodes property has one or more nodes
        if (mutation.addedNodes.length) {
          continueWithAuthoreonBtn = document?.getElementById('continue-authoreon-btn');

          if (continueWithAuthoreonBtn) {
            const backBtn = document.querySelector(config.pages.backButton);
            //adding the event listener back btn
            backBtn?.addEventListener('click', handleBackBtn);
            nextButtonHandler();
            attachmentsInput();
            continueWithAuthoreonBtn?.addEventListener('click', handleContinueBtn);
            observer.disconnect();
          }
        }
      }
    });

    observer.observe(document?.body, { childList: true, subtree: true });
    chrome.runtime.onMessage.addListener(OnChromeMessage);
    return () => {
      //cleanup all the listener
      observer.disconnect();
      chrome.runtime.onMessage.removeListener(OnChromeMessage);
      const backBtn = document.querySelector(config.pages.backButton);
      continueWithAuthoreonBtn?.removeEventListener('click', handleContinueBtn);
      backBtn.removeEventListener('click', handleBackBtn);
      localStorage.removeItem('scheduling-data');
    };
  }, []);
  // Set the scheduling options from storage
  React.useEffect(() => {
    setData(accessRuleData ?? []);
  }, [accessRuleData]);
  React.useEffect(() => {
    if (isOpen) {
      checkThemeAndData(data);
    }
  }, [isOpen]);
  // handle the image file upload
  const callBack = React.useCallback(async (event: any) => {
    const files = event?.target?.files;
    imageFileHandler(files);
  }, []);

  const addMoreImagesHandler = (imageFileInput2: HTMLInputElement) => {
    imageFileInput2?.removeEventListener('change', callBack);
    imageFileInput2?.addEventListener('change', callBack);
  };

  React.useEffect(() => {
    const selectImage = document.querySelector('[data-tag="IconPhoto"]');
    if (selectImage) {
      const imageFileInput: HTMLInputElement = document.querySelector(config.pages.imageInputField);
      addMoreImagesHandler(imageFileInput);
    }
    return () => {
      const imageFileInput2: HTMLInputElement = document.querySelector(config.pages.addMoreImages);

      imageFileInput2?.removeEventListener('change', callBack);
    };
  }, [fileStorage]);

  const createPostBtnHandler = React.useCallback(createPostBtnListener, []);
  // getting the create post button
  React.useEffect(() => {
    const getSidebar = () => {
      const size = window.innerWidth;
      const sideBar = document?.querySelector(config.pages.createPostBtnSelector);

      const createPost = sideBar?.querySelector(
        `div.${size >= 978 ? 'cnetpD' : 'gnXrWQ'} button[aria-label="Create post"]`,
      );
      return createPost;
    };
    setCreatePostBtnEle(getSidebar());

    window?.addEventListener('resize', () => {
      setCreatePostBtnEle(getSidebar());
    });
  }, []);
  React.useEffect(() => {
    if (createPostBtnEle) {
      createPostBtnEle?.removeEventListener('click', createPostBtnHandler);
      createPostBtnEle?.addEventListener('click', createPostBtnHandler);
    }
  }, [createPostBtnEle]);
  // Function to handle checkbox toggle
  const handleCheckboxChange = (access_rule_id: string) => {
    setError(null);
    const existing = selected.find(item => item.access_rule_id === access_rule_id);

    if (existing) {
      // Remove if already selected
      setSelected(selected.filter(item => item.access_rule_id !== access_rule_id));
    } else {
      // Add new rule with empty date and time if not already selected
      setSelected([...selected, { access_rule_id, date: '', time: dayjs().minute(0).format('HH:mm'), date_time: '' }]);
    }
  };
  // Function to handle the combined DateTime validation
  const validateDate = (date: string, time: string, rowId: string) => {
    const selectedDate = new Date(`${date}T${time}`);
    const currentDate = new Date();

    // Add 5 minutes to the current time for validation
    const minFutureDate = new Date(currentDate.getTime() + 5 * 50000); // 5 minutes in milliseconds
    if (selectedDate <= currentDate) {
      setError({ message: 'You cannot select a past date', rowId });
      return false;
    }

    if (selectedDate <= minFutureDate) {
      setError({ message: 'Please select a time at least 5 minutes in the future', rowId });
      return false;
    }

    setError(null);
    return true;
  };
  // Function to handle date change
  const handleDateChange = (access_rule_id: string, date: string) => {
    if (selected.find(item => item.access_rule_id === access_rule_id)) {
      setSelected(
        selected.map(item =>
          item.access_rule_id === access_rule_id
            ? { ...item, date, date_time: combineDateTime(date, item.time) }
            : item,
        ),
      );
    } else {
      setError({ rowId: access_rule_id, message: 'Please select the tier first' });
    }
  };

  // Function to handle time change
  const handleTimeChange = (access_rule_id: string, time: string) => {
    if (selected.find(item => item.access_rule_id === access_rule_id)) {
      setSelected(
        selected.map(item =>
          item.access_rule_id === access_rule_id
            ? { ...item, time, date_time: combineDateTime(item.date, time) }
            : item,
        ),
      );
    } else {
      setError({ rowId: access_rule_id, message: 'Please select the tier first' });
    }
  };

  const validate = () => {
    for (const item of selected) {
      if (item.access_rule_id && !item.date) {
        return false;
      }
    }

    return true;
  };
  const scheduleBtnListener = React.useCallback(scheduleBtnClick, []);
  const handleClose = async () => {
    if (schedulingCounter?.usedCounter === 2 && !schedulingCounter?.hasAnswered) {
      setSchedulingPopUp(true);
      return;
    }

    if (validate()) {
      for (const item of selected) {
        if (!validateDate(item.date, item.time, item?.access_rule_id)) {
          return;
        }
      }

      setIsOpen(false);
      const scheduling = selected[0];
      localStorage.setItem('scheduling-data', JSON.stringify(scheduling));
      // enable the release date element from patreon UI
      const toggleBtn: HTMLButtonElement = document.querySelector('#scheduled-for-toggle');
      if (toggleBtn.getAttribute('aria-checked') === 'false') {
        toggleBtn?.click();
      }

      await schedulingStorage.add(selected?.slice(1, selected?.length));
      const scheduleBtn = document.querySelector(config.pages.continueWithAuthoreonBtnInjectSelector);
      // append the schedule button click listener
      if (scheduleBtn && scheduleBtn?.textContent === 'Schedule') {
        scheduleBtn.removeEventListener('click', scheduleBtnListener);
        scheduleBtn.addEventListener('click', scheduleBtnListener);
      }
    } else {
      toast.error('Please ensure all selected tiers have a date and time');
    }
  };

  return (
    <>
      <Toaster richColors position="top-right" />
      {isOpen && (
        <ReactModal
          isOpen={isOpen}
          style={customStyles}
          onAfterOpen={() => (document.body.style.overflow = 'hidden')}
          onAfterClose={() => (document.body.style.overflow = 'unset')}>
          <div style={{ textAlign: 'right' }}>
            <img
              src={
                currentTheme === 'dark'
                  ? chrome.runtime.getURL('scroll-dark.png')
                  : chrome.runtime.getURL('scroll-light.png')
              }
              style={{ height: '40px', width: 'fit-content', objectFit: 'contain' }}
            />
          </div>
          <h2 className="text-center" style={{ marginTop: '0px' }}>
            Scheduling Options
          </h2>
          <div className="access-rules-list-container ">
            {data?.map(rules => (
              <div key={rules.access_rule_id ?? 'key-1' + rules.title?.toLocaleLowerCase()}>
                <span className="access-rules-label-container">
                  <input
                    type="checkbox"
                    className="access-rules-checkbox"
                    checked={!!selected.find(item => item.access_rule_id === rules.access_rule_id)}
                    onChange={() => handleCheckboxChange(rules.access_rule_id)}
                  />
                  <span>
                    <label className="access-rules-label">
                      {rules.title === 'patrons'
                        ? 'Paid members only'
                        : rules.title === 'Free'
                          ? 'Free members only'
                          : rules.title}
                    </label>
                    {rules.description && <p className="access-rules-label-description">{rules?.description}</p>}
                  </span>
                </span>
                <div className="date-time-picker-container">
                  <div className="date-picker-outer-wrapper">
                    <div className="date-picker-wrapper">
                      <input
                        value={selected.find(item => item.access_rule_id === rules.access_rule_id)?.date || ''}
                        onChange={e => handleDateChange(rules.access_rule_id, e.target.value)}
                        aria-invalid="false"
                        aria-label="Schedule Date"
                        aria-multiline="false"
                        id="date"
                        type="date"
                        placeholder="YYYY-MM-DD"
                        className="date-picker"
                      />
                    </div>
                  </div>

                  <div className="date-picker-outer-wrapper">
                    <div className="date-picker-wrapper">
                      <input
                        aria-invalid="false"
                        aria-label="Schedule Time"
                        aria-multiline="false"
                        type="time"
                        className="date-picker"
                        placeholder="12:00"
                        value={selected.find(item => item.access_rule_id === rules.access_rule_id)?.time || ''}
                        onChange={e => handleTimeChange(rules.access_rule_id, e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                {error?.rowId === rules.access_rule_id && <p className="error-text">{error.message}</p>}
              </div>
            ))}
            {!data?.length && (
              <div className="flex tiers-not-found">
                <File size={25} />
                <p>
                  Scheduleon is having a hard time getting your tiers. Try creating a new post or delete and re-install
                  the extension.
                </p>
              </div>
            )}
          </div>
          <div className="footer-button-container">
            <button className="common_button" style={{ marginBottom: '1rem' }} onClick={handleClose}>
              Done Scheduling
            </button>
          </div>
        </ReactModal>
      )}
      {schedulingPopUp && (
        <SchedulingFeedback schedulingPopUp={schedulingPopUp} setSchedulingPopUp={setSchedulingPopUp} />
      )}
    </>
  );
};
export default OverlayView;
