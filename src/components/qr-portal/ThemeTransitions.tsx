import React, { useEffect, useState } from 'react';

interface ThemeTransitionsProps {
  theme: string;
  children: React.ReactNode;
}

export function ThemeTransitions({ theme, children }: ThemeTransitionsProps) {
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (theme !== currentTheme) {
      setIsTransitioning(true);
      
      // Smooth transition between themes
      setTimeout(() => {
        setCurrentTheme(theme);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 100);
      }, 250);
    }
  }, [theme, currentTheme]);

  return (
    <div 
      className={`theme-transition-wrapper ${isTransitioning ? 'transitioning' : ''}`}
      style={{
        opacity: isTransitioning ? 0.8 : 1,
        transition: 'opacity 0.25s ease-in-out'
      }}
    >
      {children}
    </div>
  );
}