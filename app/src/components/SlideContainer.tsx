'use client';

import { useState, useEffect, ReactNode } from 'react';

interface SlideContainerProps {
  children: ReactNode[];    // Array de telas/slides
  interval?: number;        // Tempo entre transições (ms)
}

export function SlideContainer({ children, interval = 10000 }: SlideContainerProps) {
  const [current, setCurrent] = useState(0);
  
  useEffect(() => {
    // Rotaciona slides automaticamente
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % children.length);
    }, interval);
    
    return () => clearInterval(timer);
  }, [children.length, interval]);
  
  return (
    <div className="relative w-full h-full overflow-hidden">
      {children.map((child, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
