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
  customStyles,
  imageFileHandler,
  nextButtonHandler,
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

function convertCentsToDollars(cents: number) {
  if (typeof cents !== 'number' || isNaN(cents)) {
    throw new Error('Input must be a valid number');
  }
  return (cents / 100).toFixed(2); // Convert and return in 2 decimal places
}

const OverlayView = () => {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [data, setData] = React.useState<AccessRulesData[]>();

  const [error, setError] = React.useState<ErrorTypes>(null);
  const [selected, setSelected] = React.useState<selectedDataType[]>([]);
  const schedulingCounter = useStorage(schedulingCounterStorage);
  const fileStorage = useStorage(fileDataStorage);
  const accessRuleData = useStorage(accessRulesStorage);

  const [schedulingPopUp, setSchedulingPopUp] = React.useState<boolean>(false);

  const handleBackBtn = React.useCallback(backButtonHandler, []);

  const hidePostAccess = (startTime: number = Date.now()) => {
    const isNewUI = document
      .querySelector(config.pages.headerRootSelector)
      ?.parentElement?.querySelector(config.pages.postAccessRootNew);

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
    isPublishScreenStorage.setScreen(true);
  };

  const handleContinueBtn = () => {
    const nextButton: HTMLButtonElement = document.querySelector(config.pages.continueWithAuthoreonBtnInjectSelector);

    if (nextButton) {
      nextButton?.click();
      nextButton.removeAttribute('style');
      hidePostAccess();
    }
  };
  const handleOpen = React.useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleMessage = event => {
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
    // First, create a map of reward information by reward_id
    const rewardMap = {};

    accessRules?.forEach(item => {
      if (item.type === 'reward') {
        rewardMap[item.id] = {
          reward_id: item.id,
          amount_cents: item.attributes.amount_cents,
          currency: item.attributes.currency,
          is_free_tier: item.attributes.is_free_tier,
          title: item.attributes.title,
          published: item.attributes.published,
        };
      }
    });
    // Now, extract access rules and associate rewards
    const result = [];
    accessRules.forEach(item => {
      if (item.type === 'access-rule') {
        const accessRule = {
          access_rule_id: item.id,
          reward_id: null, // Default reward_id is null
          description: null,
          is_free_tier: null,
          amount_cents: item.attributes?.amount_cents,
          title: item?.attributes?.access_rule_type,
          published: null,
        };

        // Check if the access-rule has a tier (reward)
        if (item.relationships && item.relationships.tier && item.relationships.tier.data) {
          const rewardId = item?.relationships?.tier?.data?.id;
          if (rewardMap[rewardId]) {
            // Add reward information from rewardMap
            accessRule.reward_id = rewardMap[rewardId]?.reward_id;
            accessRule.description = `$${convertCentsToDollars(rewardMap[rewardId]?.amount_cents)}/month`;
            accessRule.is_free_tier = rewardMap[rewardId]?.is_free_tier;
            accessRule.title = rewardMap[rewardId]?.title;
            accessRule.amount_cents = rewardMap[rewardId]?.amount_cents;
            accessRule.published = rewardMap[rewardId]?.published;
          }
        }

        // Push the extracted information to result array
        result.push(accessRule);
      }
    });

    const sortedData = result.sort((a, b) => {
      // Define sort order values
      const getTypeOrder = item => {
        if (item.title.toLowerCase() === 'public') return 1;
        if (item.is_free_tier) return 2;
        if (item.title.toLowerCase() === 'patrons') return 3;
        return 4; // For paid tiers
      };

      const typeOrderA = getTypeOrder(a);
      const typeOrderB = getTypeOrder(b);

      // Sort by type first
      if (typeOrderA !== typeOrderB) {
        return typeOrderA - typeOrderB;
      }

      // For paid tiers, sort by amount_cents in ascending order
      if (typeOrderA === 4 && typeOrderB === 4) {
        return (a.amount_cents || 0) - (b.amount_cents || 0);
      }

      return 0; // No sorting needed if they are of the same type and not paid tiers
    });

    await accessRulesStorage.add(sortedData);
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
    };
  }, []);

  React.useEffect(() => {
    setData(accessRuleData ?? []);
  }, [accessRuleData]);

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

    if (selectedDate <= currentDate) {
      setError({ message: 'You cannot select a past date', rowId });
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
          {/* <div
            className={`overlay__close `}
            onClick={handleClose}
            data-tooltip-content="Close Post"
            data-tooltip-id="my-tooltip">
            <X size={25} />
          </div> */}
          <h2 className="text-center">Scheduling Options</h2>
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
