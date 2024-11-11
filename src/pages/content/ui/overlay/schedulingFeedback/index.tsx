/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import { Modal } from '@root/src/shared/components/modal/Modal';
import schedulingCounterStorage from '@root/src/shared/storages/schedulingCounterStorage';
import axios from 'axios';
import React from 'react';
import LoadingOverlay from 'react-loading-overlay-ts';
import { toast } from 'sonner';
interface SchedulingFeedbackProps {
  schedulingPopUp: boolean;
  setSchedulingPopUp: React.Dispatch<React.SetStateAction<boolean>>;
}
type selectedOption = 'Yes' | 'No';

const SchedulingFeedback: React.FC<SchedulingFeedbackProps> = ({ schedulingPopUp, setSchedulingPopUp }) => {
  const [reason, setReason] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [selectedOption, setSelectedOption] = React.useState<selectedOption>();
  const onChangeHandle = (value: selectedOption) => {
    setSelectedOption(value);
  };
  const onSubmit = async () => {
    if (selectedOption === 'No' && !reason?.length) {
      toast.error('Please enter your feedback.');
      return;
    }
    try {
      setIsLoading(true);
      const response = await axios.post('https://www.readeon.com/api/scheduleon-user-feedback', {
        option: selectedOption,
        reason,
      });
      if (response.status === 200) {
        setReason('');
        toast.success('Thanks for your feedback');
        setSchedulingPopUp(false);
        await schedulingCounterStorage.add(false, 0, true);
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.log('error', { error });
    }
  };
  return (
    <>
      {schedulingPopUp && (
        <Modal
          isOpen={schedulingPopUp}
          footer={null}
          closeIcon
          onClose={() => {
            setSchedulingPopUp(false);
          }}
          body={
            <>
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
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '14px',
                    marginTop: '12px',
                    alignItems: 'center',
                  }}>
                  <h3 style={{ margin: 0, textAlign: 'center', lineHeight: '1.5rem' }}>
                    Please answer this question to continue using Scheduleon
                  </h3>
                  <p>Will you still use this extension after it switches to a paid model?</p>
                  <div className="space-around flex w-30">
                    <label>
                      <input type="radio" name="option-select" onChange={() => onChangeHandle('Yes')} />
                      <span style={{ marginLeft: '10px' }}>Yes</span>
                    </label>
                    <label>
                      <input type="radio" name="option-select" onChange={() => onChangeHandle('No')} />
                      <span style={{ marginLeft: '10px' }}>No</span>
                    </label>
                  </div>
                  {selectedOption && (
                    <textarea
                      className="feedback-text-area"
                      placeholder={selectedOption === 'Yes' ? 'How much would you pay?' : 'Enter your feedback here...'}
                      required
                      value={reason}
                      onChange={e => {
                        setReason(e?.target?.value ?? '');
                      }}
                    />
                  )}

                  <button className="common_button" style={{ marginTop: '1rem' }} onClick={onSubmit}>
                    Submit
                  </button>
                </div>
              </LoadingOverlay>
            </>
          }
        />
      )}
    </>
  );
};
export default SchedulingFeedback;
