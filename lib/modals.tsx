'use client';

import React, { createContext, useContext, useState } from 'react';
import { SaveItemModal } from '@/components/SaveItemModal';
import { ChatPanel } from '@/components/ChatPanel';

interface ModalContextType {
  openSaveModal: () => void;
  closeSaveModal: () => void;
  openChat: () => void;
  closeChat: () => void;
  isChatOpen: boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const openSaveModal = () => setIsSaveModalOpen(true);
  const closeSaveModal = () => setIsSaveModalOpen(false);
  
  const openChat = () => setIsChatOpen(true);
  const closeChat = () => setIsChatOpen(false);

  return (
    <ModalContext.Provider value={{ 
      openSaveModal, 
      closeSaveModal, 
      openChat, 
      closeChat, 
      isChatOpen 
    }}>
      {children}
      <SaveItemModal isOpen={isSaveModalOpen} onClose={closeSaveModal} />
      <ChatPanel isOpen={isChatOpen} onClose={closeChat} />
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
