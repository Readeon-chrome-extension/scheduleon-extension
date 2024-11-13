/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import '@pages/popup/Popup.css';
import useStorage from '@root/src/shared/hooks/useStorage';
import extEnableStorage from '@root/src/shared/storages/extEnableStorage';
import themeStorage from '@root/src/shared/storages/themeStorage';

import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';
import withSuspense from '@src/shared/hoc/withSuspense';
import Header, { openOrFocusTab, patreonUrl, webURL } from './components/Header';
import React from 'react';
import userDataStorage from '@root/src/shared/storages/user-storage';
import isPublishScreenStorage from '@root/src/shared/storages/isPublishScreen';

const Popup = () => {
  const theme = useStorage(themeStorage);
  const userData = useStorage(userDataStorage);
  const isPublishScreen = useStorage(isPublishScreenStorage);
  const [currentUrl, setCurrentUrl] = React.useState<string>();
  const extEnabled = useStorage(extEnableStorage);

  const handleClick = async (messageType: 'Feedback' | 'Scheduling') => {
    chrome?.tabs?.query({ currentWindow: true, active: true }, function (tabs) {
      const activeTab = tabs[0];
      const message = messageType === 'Feedback' ? 'feedback_modal' : 'scheduling-option-modal';
      chrome?.tabs?.sendMessage(activeTab?.id, { message });
    });
  };
  React.useEffect(() => {
    chrome.tabs.query({ currentWindow: true, active: true }, tanInfo => {
      const tab = tanInfo[0];
      setCurrentUrl(tab?.url);
    });
  }, []);
  const handleRefresh = async () => {
    await chrome.tabs.reload();
  };
  const pathname = React.useMemo(() => {
    if (currentUrl) {
      const url = new URL(currentUrl); // Extract the URL from the active tab
      return url?.pathname;
    }
  }, [currentUrl]);
  return (
    <div
      className="App"
      style={{
        backgroundColor: theme === 'light' ? '#fff' : '#000',
        height: '100%',
        color: theme === 'dark' ? '#fff' : '#000',
      }}>
      <Header />

      <div className="flex flex-col justify-center" style={{ height: '75%' }}>
        <div className={`flex w-full justify-center w-full flex-col items-center`}>
          <img
            style={{ margin: '8px 0' }}
            src={theme === 'light' ? '../../../scheduleon-logo.png' : '../../../scheduleon-light.png'}
            height={80}
            width={80}
            alt="logo"
          />
        </div>

        {extEnabled && (
          <>
            {currentUrl?.startsWith(patreonUrl) && userData?.isLoggedIn && (
              <p className="text-sm font-bold text-center color-inherit">
                Scheduleon is currently running on your Patreon tab.
              </p>
            )}
            {!currentUrl?.startsWith(patreonUrl) && (
              <p className="text-sm font-bold text-center color-inherit">
                Please proceed to Patreon to use Scheduleon.
              </p>
            )}
          </>
        )}
        {!currentUrl?.startsWith(patreonUrl) && extEnabled && (
          <>
            <div className="text-center w-full mt-2">
              <button
                className="exe-pop-up-btn"
                id="patreon-chapter-view-btn-2"
                onClick={() => openOrFocusTab(patreonUrl, patreonUrl)}
                style={{ padding: '0 12px', width: 'fit-content', fontSize: '12px' }}>
                Click here to go to Patreon
              </button>
            </div>
          </>
        )}

        <>
          {currentUrl?.startsWith(patreonUrl) && extEnabled && userData?.isLoggedIn && (
            <>
              <div className="flex flex-col  justify-center gap-4 mt-4">
                {/* ToDO: will update this once do the monitoring */}

                <div className="flex  justify-center gap-4" style={{ flexWrap: 'wrap' }}>
                  <button
                    className="exe-pop-up-btn"
                    id="patreon-chapter-view-btn-1"
                    onClick={() => openOrFocusTab(`${webURL}/faq`, webURL)}
                    style={{ padding: 0, width: '195px', fontSize: '12px' }}>
                    How To Use Extension?
                  </button>
                </div>
                <div className="flex  justify-center gap-4" style={{ flexWrap: 'wrap' }}>
                  <button
                    className="exe-pop-up-btn"
                    id="patreon-feedback-btn"
                    onClick={() => handleClick('Feedback')}
                    style={{ padding: 0, width: '195px', fontSize: '12px' }}>
                    Give Scheduleon Feedback
                  </button>
                  <button
                    className="exe-pop-up-btn"
                    id="patreon-report-btn"
                    onClick={handleRefresh}
                    style={{ padding: 0, width: '195px', fontSize: '12px' }}>
                    Scheduleon Issue? Click to Refresh
                  </button>
                  <button
                    className="exe-pop-up-btn"
                    id="patreon-report-btn"
                    onClick={() => openOrFocusTab(`${patreonUrl}/DemocraticDeveloper`, patreonUrl)}
                    style={{ padding: 0, width: '195px', fontSize: '12px' }}>
                    Support Scheduleon
                  </button>
                  {pathname?.includes('edit') && isPublishScreen && (
                    <button
                      className="exe-pop-up-btn"
                      id="patreon-scheduling-option"
                      onClick={() => handleClick('Scheduling')}
                      style={{ padding: 0, width: '195px', fontSize: '12px' }}>
                      Scheduling Options
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </>
        {!userData?.isLoggedIn && currentUrl?.startsWith(patreonUrl) && extEnabled && (
          <p className="text-sm font-bold text-center color-inherit">Sign in to Patreon to use this extension</p>
        )}
        {!extEnabled && (
          <p className="text-sm font-bold text-center color-inherit">
            To use Scheduleon please turn on the extension by clicking on the settings icon in the top right corner and
            then toggling the “Extension” toggle to on.
          </p>
        )}
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
