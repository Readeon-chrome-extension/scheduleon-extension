/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import { Modal } from '@root/src/shared/components/modal/Modal';
import axios from 'axios';
import LoadingOverlay from 'react-loading-overlay-ts';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const FeedbackPopUp = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConfirmation, setConfirmation] = useState<boolean>(false);
  const [isCancel, setIsCancel] = useState<boolean>(false);
  const handleClose = () => {
    if (feedback?.length) {
      setIsCancel(true);
    } else {
      setFeedback('');
      setIsModalOpen(false);
    }
  };
  const detectBrowser = () => {
    const userAgent = navigator?.userAgent;

    if (userAgent.includes('Firefox')) {
      return 'firefox';
    } else if (userAgent.includes('Chrome')) {
      return 'chrome';
    } else {
      return 'unknown';
    }
  };

  useEffect(() => {
    const handleChromeMessage = (request: any) => {
      if (request?.message === 'feedback_modal') {
        setIsModalOpen(true);
      }
    };

    chrome?.runtime?.onMessage?.addListener(handleChromeMessage);
    const feedbackBtnEle = document.getElementById('patreon-feedback-btn');
    if (feedbackBtnEle) {
      const openModal = () => setIsModalOpen(true);
      feedbackBtnEle.addEventListener('click', openModal);
      // Cleanup the event listener on component unmount
      return () => {
        feedbackBtnEle.removeEventListener('click', openModal);
        chrome?.runtime?.onMessage?.removeListener(handleChromeMessage);
      };
    }
  }, []);

  const handleSubmit = (e: any) => {
    e?.preventDefault();
    //Todo: Handle the feedback submission
    setConfirmation(true);
  };
  const handleConfirmationClose = () => {
    setConfirmation(false);
  };
  const handleConfirmationSubmit = async () => {
    try {
      setConfirmation(false);
      setIsLoading(true);
      const response = await axios.post(`https://www.readeon.com/api/feedbacks/create`, {
        feedback: feedback,
        browser: detectBrowser(),
        extension: 'Scheduleon',
      });
      if (response?.status === 201) {
        setIsLoading(false);
        setIsModalOpen(false);
        setFeedback(null);
        toast.success('Feedback successfully submitted!');
      } else {
        setIsLoading(false);
        toast.error('Something went wrong.');
      }
    } catch (error) {
      setIsLoading(false);
      toast.error('Something went wrong.');
      console.log('error', { error });
    }
  };
  const handleCloseModelSubmit = () => {
    setIsCancel(false);
    setIsModalOpen(false);
    setFeedback('');
  };
  const handleCloseModelCancel = () => {
    setIsCancel(false);
  };

  return (
    <>
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          title="Feedback"
          footer={false}
          body={
            <LoadingOverlay
              active={isLoading}
              spinner={isLoading}
              styles={{
                overlay: base => ({
                  ...base,
                  background: '#00000054',
                }),
                wrapper: base => ({
                  ...base,
                  pointerEvents: isLoading ? 'none' : 'all',
                }),
              }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ textAlign: 'center' }}>
                  We&apos;d love to hear your thoughts! Please share your feedback in the box below.
                </p>
                <form
                  onSubmit={handleSubmit}
                  style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', width: '100%' }}>
                    <textarea
                      className="feedback-text-area"
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                      placeholder="Enter your feedback here..."
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button type="button" className="common_button" onClick={handleClose}>
                      {'Close'}
                    </button>
                    <button type="submit" className="common_button">
                      {'Submit'}
                    </button>
                  </div>
                </form>
              </div>
            </LoadingOverlay>
          }
        />
      )}
      {isConfirmation && (
        <Modal
          isOpen={isConfirmation}
          title="Confirmation"
          footer
          okButtonText="Yes"
          onOk={handleConfirmationSubmit}
          onClose={handleConfirmationClose}
          closeButtonText="No"
          body={
            <div>
              <p>Are you sure you want to submit?</p>
            </div>
          }
        />
      )}

      {isCancel && (
        <Modal
          isOpen={isCancel}
          title="Cancel"
          footer
          okButtonText="Yes"
          onOk={handleCloseModelSubmit}
          onClose={handleCloseModelCancel}
          closeButtonText="No"
          body={
            <div>
              <p>Are you sure you want to cancel?</p>
            </div>
          }
        />
      )}
    </>
  );
};

export default FeedbackPopUp;
