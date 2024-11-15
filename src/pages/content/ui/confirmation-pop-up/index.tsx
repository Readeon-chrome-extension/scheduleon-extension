/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import { Loader } from '@root/src/shared/components/loader/Loader';
import { Modal } from '@root/src/shared/components/modal/Modal';
import useStorage from '@root/src/shared/hooks/useStorage';
import fileDataStorage from '@root/src/shared/storages/fileStorage';
import isPublishScreenStorage from '@root/src/shared/storages/isPublishScreen';
import isSchedulingStartStorage from '@root/src/shared/storages/isSchedulingStart';
import isWarningShowStorage from '@root/src/shared/storages/isWarningShowStorage';
import postContentStorage from '@root/src/shared/storages/post-content-storage';
import schedulingStorage from '@root/src/shared/storages/schedulingStorage';
import { Clock } from 'lucide-react';
import React from 'react';

const ConfirmationPopUp = () => {
  const [isOpen, setOpen] = React.useState<boolean>(false);

  const isScheduling = useStorage(isSchedulingStartStorage);

  const [showTimer, setShowTimer] = React.useState<boolean>(false);

  const beforeUnloadHandler = React.useCallback(event => {
    // Recommended
    event.preventDefault();

    // Included for legacy support, e.g. Chrome/Edge < 119
    event.returnValue = true;
  }, []);
  React.useEffect(() => {
    let timer;

    if (isOpen) {
      setShowTimer(true);
      window.addEventListener('beforeunload', beforeUnloadHandler);
      // Calculate initial remaining time
      // const calculateRemainingTime = () => {
      //   const currentTime = Date.now();
      //   const remainingTime = Math.max(0, isScheduling?.endTime - currentTime);
      //   setCountdown(remainingTime);
      //   return remainingTime;
      // };

      // calculateRemainingTime();

      // // Update the countdown every second
      // timer = setInterval(() => {
      //   const remainingTime = calculateRemainingTime();

      //   // Stop scheduling when countdown reaches 0
      //   if (remainingTime <= 0) {
      //     isSchedulingStartStorage.add(false, 0).then();
      //     window.removeEventListener('beforeunload', beforeUnloadHandler);

      //     //cleaning the local storage
      //     localStorage.removeItem('scheduling-data');
      //     schedulingStorage.add([]).then();
      //     fileDataStorage.set(null).then();
      //     isPublishScreenStorage.setScreen(false);
      //     postContentStorage.setPostContent(null);

      //     setShowTimer(false);
      //     clearInterval(timer);

      //     setTimeout(() => {
      //       window.open('https://www.patreon.com/library', '_self');
      //     }, 1000);
      //   }
      // }, 1000);
    }

    // Cleanup interval on component unmount or when `isScheduling` changes
    return () => {
      isSchedulingStartStorage.add(false, 0, 'Pending').then();
      setShowTimer(false);
      window.removeEventListener('beforeunload', beforeUnloadHandler);
      clearInterval(timer);
    };
  }, [isOpen]);
  React.useEffect(() => {
    if (!isScheduling?.start && isScheduling?.schedulingState === 'Complete') {
      isSchedulingStartStorage.add(false, 0, 'Pending').then();
      window.removeEventListener('beforeunload', beforeUnloadHandler);

      //cleaning the local storage
      localStorage.removeItem('scheduling-data');
      isWarningShowStorage.add(false);
      schedulingStorage.add([]).then();
      fileDataStorage.set(null).then();
      isPublishScreenStorage.setScreen(false);
      postContentStorage.setPostContent(null);

      setTimeout(() => {
        chrome.runtime.sendMessage({ action: 'redirect-library-page' });
      }, 1000);
    }
  }, [isScheduling]);

  // const formatTime = milliseconds => {
  //   const totalSeconds = Math.floor(milliseconds / 1000);
  //   const minutes = Math.floor((totalSeconds % 3600) / 60);
  //   const seconds = totalSeconds % 60;

  //   return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  // };

  React.useEffect(() => {
    if (isScheduling?.start) setOpen(isScheduling?.start);
  }, [isScheduling]);

  return (
    <>
      {isOpen && (
        <Modal
          isOpen={isOpen}
          footer={null}
          body={
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '14px',
                  alignItems: 'center',
                }}>
                <Clock />

                <p className="confirmation-text">
                  Please wait while Scheduleon takes care of your scheduling. You will be redirected to your Library
                  page once posts are scheduled.
                </p>
                {showTimer && (
                  <>
                    <Loader />
                  </>
                )}
                {/* <button
                  className="common_button"
                  style={{
                    width: '200px',
                    pointerEvents: isScheduling?.start ? 'none' : 'all',
                    opacity: isScheduling?.start ? '0.7' : 'unset',
                  }}
                  disabled={isScheduling?.start}>
                  <a href="https://www.patreon.com/library" style={{ color: '#000', width: '100%' }}>
                    OK
                  </a>
                </button> */}
              </div>
            </>
          }
        />
      )}
    </>
  );
};
export default ConfirmationPopUp;
