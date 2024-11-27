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
import { feedbackSuccess, submitFeedback } from '@root/src/shared/utils/common';
import { Clock } from 'lucide-react';
import React from 'react';

const ConfirmationPopUp = () => {
  const [isOpen, setOpen] = React.useState<boolean>(false);

  const isScheduling = useStorage(isSchedulingStartStorage);

  const beforeUnloadHandler = React.useCallback(event => {
    // Recommended
    event.preventDefault();

    // Included for legacy support, e.g. Chrome/Edge < 119
    event.returnValue = true;
  }, []);
  React.useEffect(() => {
    if (isOpen) {
      window.addEventListener('beforeunload', beforeUnloadHandler);
    }

    // Cleanup interval on component unmount or when `isScheduling` changes
    return () => {
      isSchedulingStartStorage.add(false, 0, 'Pending').then();
      window.removeEventListener('beforeunload', beforeUnloadHandler);
    };
  }, [isOpen]);
  React.useEffect(() => {
    if (!isScheduling?.start && isScheduling?.schedulingState === 'Complete') {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
      //cleaning the local storage
      setOpen(false);
      cleanUpStorage();
    }
  }, [isScheduling]);

  const cleanUpStorage = async () => {
    localStorage.removeItem('scheduling-data');
    await isSchedulingStartStorage.add(false, 0, 'Pending');
    await isWarningShowStorage.add(false);
    await submitFeedback(feedbackSuccess);
    await schedulingStorage.add([]).then();

    await fileDataStorage.set(null).then();
    await isPublishScreenStorage.setScreen(false);
    await postContentStorage.setPostContent(null);
    window.open('https://www.patreon.com/library', '_self');
  };
  React.useEffect(() => {
    if (isScheduling?.start) setOpen(isScheduling?.start);
  }, [isScheduling]);

  return (
    <>
      {isOpen && (
        <Modal
          portalClassName="scheduleon-confirmation-pop-up"
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

                <Loader />
              </div>
            </>
          }
        />
      )}
    </>
  );
};
export default ConfirmationPopUp;
