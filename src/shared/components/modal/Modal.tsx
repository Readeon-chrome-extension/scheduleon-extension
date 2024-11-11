/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import ReactModal from 'react-modal';
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import styled from '@emotion/styled';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onOk?: () => void;
  okButtonText?: string;
  closeButtonText?: string;
  title?: string;
  body?: React.ReactNode;
  footer?: boolean;
  isRemoveScroll?: boolean;
  closeIcon?: boolean;
  style?: ReactModal.Styles;
  maskClosable?: boolean;
}

const customStyles = {
  overlay: {
    zIndex: '1300',
    backgroundColor: 'var(--component-dialog-overlay-bg)',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  content: {
    background: 'var(--global-bg-elevated-default)',
    maxWidth: '440px',
    boxShadow: 'var(--global-boxShadow-high)',
    borderRadius: 'var(--global-radius-lg)',
    border: 'none',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    height: 'fit-content',
  },
} as ReactModal.Styles;

const CloseIcon = styled(X)`
  position: fixed;
  right: 8px;
  top: 8px;
  height: 28px;
  width: 28px;
  cursor: pointer;
`;

// ReactModal.setAppElement('#renderPageContentWrapper');

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onOk,
  body,
  closeButtonText,
  okButtonText,
  title,
  footer = true,
  isRemoveScroll = true,
  closeIcon = false,
  style,
  maskClosable = false,
}) => {
  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  return (
    <ReactModal
      isOpen={open}
      style={{ ...customStyles, ...style }}
      onRequestClose={onClose}
      onAfterOpen={() => (isRemoveScroll ? (document.body.style.overflow = 'hidden') : null)}
      onAfterClose={() => {
        const overlyView = document.querySelector('.overlay-portal');
        if (!overlyView) isRemoveScroll ? (document.body.style.overflow = 'unset') : null;
      }}
      preventScroll
      shouldCloseOnOverlayClick={maskClosable}
      parentSelector={() => document.querySelector('#renderPageContentWrapper')}
      shouldCloseOnEsc={true}>
      {closeIcon && <CloseIcon size={35} onClick={onClose} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
        {title && <h2 style={{ textAlign: 'center', margin: 0 }}>{title}</h2>}
        {body ? body : null}
        {footer && (
          <div style={{ display: 'flex', gap: 5 }}>
            <button className="common_button" onClick={onClose}>
              {closeButtonText ?? 'Close'}
            </button>
            <button className="common_button" onClick={onOk}>
              {okButtonText ?? 'Go to Post'}
            </button>
          </div>
        )}
      </div>
    </ReactModal>
  );
};
