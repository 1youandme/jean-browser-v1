import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal' | 'both';
  scrollbarSize?: 'sm' | 'md' | 'lg';
}

const ScrollArea: React.FC<ScrollAreaProps> = ({
  className,
  orientation = 'vertical',
  scrollbarSize = 'md',
  children,
  ...props
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const [showScrollbar, setShowScrollbar] = useState(false);

  const scrollbarSizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const handleScroll = () => {
      setScrollPosition({
        x: scrollArea.scrollLeft,
        y: scrollArea.scrollTop,
      });
      setIsScrolling(true);

      clearTimeout((window as any).scrollTimeout);
      (window as any).scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    const checkOverflow = () => {
      const hasVerticalScroll = scrollArea.scrollHeight > scrollArea.clientHeight;
      const hasHorizontalScroll = scrollArea.scrollWidth > scrollArea.clientWidth;
      setShowScrollbar(hasVerticalScroll || hasHorizontalScroll);
    };

    scrollArea.addEventListener('scroll', handleScroll);
    checkOverflow();

    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(scrollArea);

    return () => {
      scrollArea.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      if ((window as any).scrollTimeout) {
        clearTimeout((window as any).scrollTimeout);
      }
    };
  }, []);

  const scrollPercentage = {
    x: scrollAreaRef.current ? (scrollPosition.x / (scrollAreaRef.current.scrollWidth - scrollAreaRef.current.clientWidth)) * 100 : 0,
    y: scrollAreaRef.current ? (scrollPosition.y / (scrollAreaRef.current.scrollHeight - scrollAreaRef.current.clientHeight)) * 100 : 0,
  };

  const hasVerticalScroll = scrollAreaRef.current ? scrollAreaRef.current.scrollHeight > scrollAreaRef.current.clientHeight : false;
  const hasHorizontalScroll = scrollAreaRef.current ? scrollAreaRef.current.scrollWidth > scrollAreaRef.current.clientWidth : false;

  return (
    <div className={cn('relative overflow-hidden', className)} {...props}>
      <div
        ref={scrollAreaRef}
        className={cn(
          'h-full w-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent',
          isScrolling && 'scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-500'
        )}
      >
        {children}
      </div>

      {/* Vertical scrollbar indicator */}
      {(orientation === 'vertical' || orientation === 'both') && hasVerticalScroll && showScrollbar && (
        <div className="absolute top-0 right-0 w-2 h-full pointer-events-none">
          <div
            className={cn(
              'absolute right-1 bg-gray-300 dark:bg-gray-600 rounded-full transition-opacity',
              scrollbarSizeClasses[scrollbarSize],
              isScrolling && 'bg-gray-400 dark:bg-gray-500'
            )}
            style={{
              top: `${scrollPercentage.y}%`,
              height: `${Math.max(20, 100 / (scrollAreaRef.current ? scrollAreaRef.current.scrollHeight / scrollAreaRef.current.clientHeight : 1))}%`,
              transform: `translateY(-${scrollPercentage.y} * ${Math.max(20, 100 / (scrollAreaRef.current ? scrollAreaRef.current.scrollHeight / scrollAreaRef.current.clientHeight : 1))}%)`,
            }}
          />
        </div>
      )}

      {/* Horizontal scrollbar indicator */}
      {(orientation === 'horizontal' || orientation === 'both') && hasHorizontalScroll && showScrollbar && (
        <div className="absolute bottom-0 left-0 h-2 w-full pointer-events-none">
          <div
            className={cn(
              'absolute bottom-1 bg-gray-300 dark:bg-gray-600 rounded-full transition-opacity',
              scrollbarSizeClasses[scrollbarSize],
              isScrolling && 'bg-gray-400 dark:bg-gray-500'
            )}
            style={{
              left: `${scrollPercentage.x}%`,
              width: `${Math.max(20, 100 / (scrollAreaRef.current ? scrollAreaRef.current.scrollWidth / scrollAreaRef.current.clientWidth : 1))}%`,
              transform: `translateX(-${scrollPercentage.x} * ${Math.max(20, 100 / (scrollAreaRef.current ? scrollAreaRef.current.scrollWidth / scrollAreaRef.current.clientWidth : 1))}%)`,
            }}
          />
        </div>
      )}
    </div>
  );
};

export { ScrollArea };