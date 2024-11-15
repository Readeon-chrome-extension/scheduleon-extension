import { Modal } from '@root/src/shared/components/modal/Modal';
import useStorage from '@root/src/shared/hooks/useStorage';
import isPublishScreenStorage from '@root/src/shared/storages/isPublishScreen';
import React from 'react';

const ScheduleonControl = () => {
  const [isOpen, setOpen] = React.useState<boolean>(false);
  const isPublishScreen = useStorage(isPublishScreenStorage);

  const handlePostMessage = ev => {
    if (ev?.data?.type === 'open-scheduleon-control') {
      setOpen(true);
    }
  };
  React.useEffect(() => {
    window.addEventListener('message', handlePostMessage);
    return () => {
      window.removeEventListener('message', handlePostMessage);
    };
  }, []);
  const handleRefresh = async () => {
    window?.location?.reload();
  };

  const handleClick = async (messageType: 'Feedback' | 'Scheduling') => {
    const message = messageType === 'Feedback' ? 'feedback_modal' : 'scheduling-option-modal';
    chrome.runtime.sendMessage({ action: message });
    setOpen(false);
  };
  return (
    <>
      {isOpen && (
        <Modal
          isOpen={isOpen}
          onClose={() => setOpen(false)}
          title="Scheduleon Controls"
          footer={null}
          closeIcon
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
                <button
                  className="common_button"
                  id="patreon-chapter-view-btn-1"
                  onClick={() => {
                    chrome.runtime.sendMessage({ action: 'how-to-use-scheduleon' });
                  }}
                  style={{ padding: 0, width: '195px', fontSize: '12px' }}>
                  How To Use Extension?
                </button>

                <button
                  className="common_button"
                  id="patreon-feedback-btn"
                  onClick={() => handleClick('Feedback')}
                  style={{ padding: 0, width: '195px', fontSize: '12px' }}>
                  Give Scheduleon Feedback
                </button>
                <button
                  className="common_button"
                  id="patreon-report-btn"
                  onClick={handleRefresh}
                  style={{ padding: 0, width: '195px', fontSize: '12px' }}>
                  Scheduleon Issue? Click to Refresh
                </button>
                <button
                  className="common_button"
                  id="patreon-report-btn"
                  onClick={() => {
                    chrome.runtime.sendMessage({ action: 'support-scheduleon' });
                  }}
                  style={{ padding: 0, width: '195px', fontSize: '12px' }}>
                  Support Scheduleon
                </button>
                {window?.location?.pathname?.includes('edit') && isPublishScreen && (
                  <button
                    className="common_button"
                    id="patreon-scheduling-option"
                    onClick={() => handleClick('Scheduling')}
                    style={{ padding: 0, width: '195px', fontSize: '12px' }}>
                    Scheduling Options
                  </button>
                )}
              </div>
            </>
          }
        />
      )}
    </>
  );
};
export default ScheduleonControl;
