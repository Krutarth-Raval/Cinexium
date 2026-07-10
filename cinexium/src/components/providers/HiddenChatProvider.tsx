'use client';

import React, { createContext, useContext, useState } from 'react';

interface HiddenChatContextType {
  isHiddenModeActive: boolean;
  setIsHiddenModeActive: (active: boolean) => void;
  hasPinSet: boolean | null;
  setHasPinSet: (set: boolean | null) => void;
}

const HiddenChatContext = createContext<HiddenChatContextType>({
  isHiddenModeActive: false,
  setIsHiddenModeActive: () => {},
  hasPinSet: null,
  setHasPinSet: () => {},
});

export const useHiddenChat = () => useContext(HiddenChatContext);

export const HiddenChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [isHiddenModeActive, setIsHiddenModeActive] = useState(false);
  const [hasPinSet, setHasPinSet] = useState<boolean | null>(null); // null means we haven't checked yet

  return (
    <HiddenChatContext.Provider value={{ isHiddenModeActive, setIsHiddenModeActive, hasPinSet, setHasPinSet }}>
      {children}
    </HiddenChatContext.Provider>
  );
};
