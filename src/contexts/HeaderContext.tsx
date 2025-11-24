'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface HeaderContextType {
  isHeaderVisible: boolean;
}

const HeaderContext = createContext<HeaderContextType>({ isHeaderVisible: true });

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Update theme-color based on header visibility
  useEffect(() => {
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute(
        'content',
        isHeaderVisible ? '#ffffff' : 'rgb(249, 248, 246)'
      );
    }
  }, [isHeaderVisible]);

  return (
    <HeaderContext.Provider value={{ isHeaderVisible }}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  return useContext(HeaderContext);
}


