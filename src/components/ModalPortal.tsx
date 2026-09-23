import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

let activeModalCount = 0;

interface ModalPortalProps {
  children: React.ReactNode;
  isOpen?: boolean;
}

export const ModalPortal: React.FC<ModalPortalProps> = ({ children, isOpen = true }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !mounted) return;

    activeModalCount++;
    if (activeModalCount === 1) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      activeModalCount = Math.max(0, activeModalCount - 1);
      if (activeModalCount === 0) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen, mounted]);

  if (!isOpen || !mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="modal-portal-wrapper">
      {children}
    </div>,
    document.body
  );
};
