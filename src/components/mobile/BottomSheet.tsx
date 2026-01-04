import { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  children: React.ReactNode;
  defaultSnap?: number; // 0-1
  maxSnap?: number;     // 0-1
  minSnap?: number;     // 0-1
}

export function BottomSheet({
  children,
  defaultSnap = 0.4,
  maxSnap = 0.9,
  minSnap = 0.15,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [currentSnap, setCurrentSnap] = useState(defaultSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startSnap, setStartSnap] = useState(defaultSnap);

  const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setStartY(clientY);
    setStartSnap(currentSnap);
  }, [currentSnap]);

  const handleTouchMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = startY - clientY;
    const windowHeight = window.innerHeight;
    const deltaSnap = deltaY / windowHeight;
    
    let newSnap = startSnap + deltaSnap;
    newSnap = Math.max(minSnap, Math.min(maxSnap, newSnap));
    setCurrentSnap(newSnap);
  }, [isDragging, startY, startSnap, minSnap, maxSnap]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    
    // Snap to nearest point
    const snapPoints = [minSnap, defaultSnap, maxSnap];
    const nearest = snapPoints.reduce((prev, curr) =>
      Math.abs(curr - currentSnap) < Math.abs(prev - currentSnap) ? curr : prev
    );
    setCurrentSnap(nearest);
  }, [currentSnap, minSnap, defaultSnap, maxSnap]);

  // Add global mouse events for desktop dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      handleTouchMove(e as unknown as React.MouseEvent);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        handleTouchEnd();
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleTouchMove, handleTouchEnd]);

  const sheetHeight = `${currentSnap * 100}%`;

  return (
    <div
      ref={sheetRef}
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-card rounded-t-2xl shadow-xl border-t border-border z-overlay',
        !isDragging && 'bottom-sheet-transition'
      )}
      style={{ height: sheetHeight }}
    >
      {/* Handle */}
      <div
        className="flex items-center justify-center py-3 cursor-grab active:cursor-grabbing touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
      >
        <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
      </div>

      {/* Content */}
      <div className="h-[calc(100%-28px)] overflow-hidden">
        {children}
      </div>
    </div>
  );
}
