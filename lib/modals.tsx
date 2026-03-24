'use client';

import React, { createContext, useContext, useState } from 'react';
import { SaveItemModal } from '@/components/SaveItemModal';

interface ModalContextType {
  openSaveModal: () => void;
  closeSaveModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const openSaveModal = () => setIsSaveModalOpen(true);
  const closeSaveModal = () => setIsSaveModalOpen(false);

  return (
    <ModalContext.Provider value={{ openSaveModal, closeSaveModal }}>
      {children}
      <SaveItemModal isOpen={isSaveModalOpen} onClose={closeSaveModal} />
    </ModalContext.Provider>
  );
}

export function useModals() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModals must be used within a ModalProvider');
  }
  return context;
}
