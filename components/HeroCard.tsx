
import React, { useRef, useEffect, useCallback } from 'react';
import { Hero, TeamId } from '../types';
import { useAppContext } from '../context/AppContext'; 

interface HeroCardProps {
  hero: Hero;
  isSelected?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  showRemoveButton?: boolean;
  sourceTeamId?: TeamId; 
  activeTeamBuffs?: Set<string>; 
}

const DRAG_THRESHOLD = 5; // pixels
const SCROLL_SPEED = 15; // Pixels per interval tick
const SCROLL_ZONE = 75; // Pixels from viewport edge to trigger auto-scroll

const HeroCard: React.FC<HeroCardProps> = ({ 
  hero, 
  isSelected, 
  isDisabled, 
  onClick, 
  onRemove, 
  showRemoveButton, 
  sourceTeamId,
  activeTeamBuffs 
}) => {
  const { 
    isAppDragging, 
    setTouchDragData, 
    setTouchOverTeamId, 
    addHeroToTeam, 
    moveHeroBetweenTeams,
    touchDragData: contextTouchDragData,
    setIsTouchActive,
    isTouchActive,
    touchOverTeamId: contextTouchOverTeamId,
  } = useAppContext();

  const heroCardRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const touchStartCoordsRef = useRef<{ x: number; y: number } | null>(null);
  const dragStylesAppliedRef = useRef(false);
  const scrollIntervalRef = useRef<number | null>(null);
  // Ref to store the ID of the hero this card instance is managing for document events
  const activeDragHeroIdRef = useRef<string | null>(null);


  const cardClasses = `
    relative 
    bg-slate-700 rounded-md overflow-hidden shadow-md transition-all duration-200 ease-in-out
    p-1 w-full h-20
    flex flex-col items-center justify-start 
    text-center 
    select-none 
    ${isSelected ? 'ring-2 ring-sky-500' : 'ring-1 ring-slate-600'}
    ${isDisabled ? 'opacity-50 cursor-not-allowed grayscale filter' : 'cursor-pointer'}
    ${(!isDisabled && !showRemoveButton && !isAppDragging && !isTouchActive) ? 'hover:shadow-lg hover:ring-sky-400' : ''} 
    ${(showRemoveButton && !dragStylesAppliedRef.current) ? 'cursor-grab' : ''}
    ${(dragStylesAppliedRef.current) ? 'cursor-grabbing' : ''}
  `;

  const handleClick = () => {
    if (isDisabled || !onClick || isDraggingRef.current) return; // Prevent click if it was a drag
    onClick();
  };

  const handleDragStartNative = (e: React.DragEvent<HTMLDivElement>) => {
    if (isDisabled && !showRemoveButton) {
        e.preventDefault();
        return;
    }
    e.dataTransfer.setData('heroId', hero.id);
    e.dataTransfer.effectAllowed = 'move';
    if (showRemoveButton && sourceTeamId) {
      e.dataTransfer.setData('sourceTeamId', sourceTeamId);
    }
    try {
        e.dataTransfer.setData('text/plain', hero.id); 
    } catch (err) {
        console.warn("Error setting dataTransfer type:", err);
    }
  };

  const clearScrollInterval = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);
  
  const manageAutoScroll = useCallback((clientY: number) => {
    clearScrollInterval(); 

    if (clientY < SCROLL_ZONE) {
      scrollIntervalRef.current = window.setInterval(() => {
        window.scrollBy(0, -SCROLL_SPEED);
      }, 16); 
    } else if (clientY > window.innerHeight - SCROLL_ZONE) {
      scrollIntervalRef.current = window.setInterval(() => {
        window.scrollBy(0, SCROLL_SPEED);
      }, 16);
    }
  }, [clearScrollInterval]);

  const applyDragStyles = useCallback(() => {
    if (heroCardRef.current && !dragStylesAppliedRef.current) {
      heroCardRef.current.style.opacity = '0.7';
      heroCardRef.current.style.transform = 'scale(1.05)';
      heroCardRef.current.style.zIndex = '1000';
      dragStylesAppliedRef.current = true;
    }
  }, []);

  const resetDragStyles = useCallback(() => {
    if (heroCardRef.current && dragStylesAppliedRef.current) {
      heroCardRef.current.style.opacity = '1';
      heroCardRef.current.style.transform = 'scale(1)';
      heroCardRef.current.style.zIndex = 'auto';
      dragStylesAppliedRef.current = false;
    }
  }, []);


  const handleDocumentTouchMove = useCallback((event: TouchEvent) => {
    if (!activeDragHeroIdRef.current || !touchStartCoordsRef.current || event.touches.length === 0) return;
    
    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartCoordsRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartCoordsRef.current.y);

    if (!isDraggingRef.current && (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD)) {
      isDraggingRef.current = true;
    }

    if (isDraggingRef.current) {
      event.preventDefault(); 
      applyDragStyles();
      manageAutoScroll(touch.clientY);

      let originalPointerEvents: string | undefined;
      if (heroCardRef.current && dragStylesAppliedRef.current) {
          originalPointerEvents = heroCardRef.current.style.pointerEvents;
          heroCardRef.current.style.pointerEvents = 'none';
      }
      const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
      if (heroCardRef.current && dragStylesAppliedRef.current) {
          heroCardRef.current.style.pointerEvents = originalPointerEvents || '';
      }
      
      let currentlyOverTeamId: TeamId | null = null;
      if (targetElement) {
        const battleTeamSlotElement = targetElement.closest('[data-team-id]');
        if (battleTeamSlotElement) {
          currentlyOverTeamId = battleTeamSlotElement.getAttribute('data-team-id') as TeamId;
        }
      }
      // Only update context if the over team ID actually changes
      if (contextTouchOverTeamId !== currentlyOverTeamId) {
         setTouchOverTeamId(currentlyOverTeamId);
      }
    }
  }, [applyDragStyles, manageAutoScroll, setTouchOverTeamId, contextTouchOverTeamId]); 

  const handleDocumentTouchEnd = useCallback((event: TouchEvent) => {
    document.removeEventListener('touchmove', handleDocumentTouchMove);
    document.removeEventListener('touchend', handleDocumentTouchEnd);

    clearScrollInterval();
    resetDragStyles();

    if (activeDragHeroIdRef.current && contextTouchDragData && activeDragHeroIdRef.current === contextTouchDragData.heroId) {
      if (isDraggingRef.current) { 
        const currentDropTargetTeamId = contextTouchOverTeamId; 
        if (currentDropTargetTeamId) {
          const { heroId: draggedHeroId, sourceTeamId: dragSourceTeamId } = contextTouchDragData;
          if (dragSourceTeamId && dragSourceTeamId !== currentDropTargetTeamId) {
            moveHeroBetweenTeams(draggedHeroId, dragSourceTeamId, currentDropTargetTeamId);
          } else if (!dragSourceTeamId) {
            addHeroToTeam(draggedHeroId, currentDropTargetTeamId);
          }
        }
      } else {
         // This was a tap, not a drag. The onClick handler will manage this.
         // However, ensure isTouchActive is reset if no drag occurred.
          if (onClick && !isDisabled) {
             // Let original onClick on the div handle the tap
          }
      }
    }
    
    setTouchDragData(null);
    setTouchOverTeamId(null);
    setIsTouchActive(false); 
    isDraggingRef.current = false;
    touchStartCoordsRef.current = null;
    activeDragHeroIdRef.current = null;

  }, [clearScrollInterval, resetDragStyles, contextTouchDragData, contextTouchOverTeamId, moveHeroBetweenTeams, addHeroToTeam, setTouchDragData, setTouchOverTeamId, setIsTouchActive, onClick, isDisabled, handleDocumentTouchMove]);


  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if ((isDisabled && !showRemoveButton) || e.touches.length === 0) return;

    clearScrollInterval(); 
    isDraggingRef.current = false; // Reset drag status for this touch sequence
    dragStylesAppliedRef.current = false; // Reset style status
    
    touchStartCoordsRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    activeDragHeroIdRef.current = hero.id; // Mark this hero as being actively considered for drag

    if (heroCardRef.current) {
        setTouchDragData({ heroId: hero.id, sourceTeamId, element: heroCardRef.current });
    }
    setIsTouchActive(true);

    document.addEventListener('touchmove', handleDocumentTouchMove, { passive: false });
    document.addEventListener('touchend', handleDocumentTouchEnd, { once: true });
  };

  useEffect(() => {
    // Cleanup document event listeners if component unmounts during a drag
    return () => {
      if (activeDragHeroIdRef.current) { // Check if this instance was dragging
        document.removeEventListener('touchmove', handleDocumentTouchMove);
        document.removeEventListener('touchend', handleDocumentTouchEnd);
        clearScrollInterval();
        // Reset relevant context state if this card was the one being dragged
        if (contextTouchDragData && contextTouchDragData.heroId === activeDragHeroIdRef.current) {
            setTouchDragData(null);
            setTouchOverTeamId(null);
            setIsTouchActive(false);
        }
      }
    };
  }, [handleDocumentTouchMove, handleDocumentTouchEnd, clearScrollInterval, contextTouchDragData, setTouchDragData, setTouchOverTeamId, setIsTouchActive]);


  const isDraggableNative = showRemoveButton || !isDisabled; 

  const rawFactions = [hero.faction1, hero.faction2, hero.faction3]
    .filter(Boolean)
    .join(' / ');
  const cardTitle = `${hero.name}${rawFactions ? ` (${rawFactions})` : ''}`;

  return (
    <div 
      ref={heroCardRef}
      className={cardClasses} 
      onClick={handleClick} // Modified to not fire if drag occurred
      title={cardTitle}
      role="button" 
      tabIndex={isDisabled && !showRemoveButton ? -1 : 0} 
      aria-pressed={isSelected} 
      aria-disabled={isDisabled && !showRemoveButton}
      draggable={isDraggableNative}
      onDragStart={handleDragStartNative}
      onTouchStart={handleTouchStart}
      // onTouchMove, onTouchEnd, onTouchCancel are removed from here as they are handled by document listeners now
    >
      <div className="w-full">
        <p className="font-semibold text-xs text-sky-300 truncate w-full px-1">{hero.name}</p>
      </div>
      
      <div className="w-full flex flex-wrap gap-0.5 justify-center items-center mt-1 px-0.5">
        {[hero.faction1, hero.faction2, hero.faction3].map((faction, index) => {
          if (!faction) return null;
          
          const isProvider = hero.factionBuffValue && hero.factionBuffValue === faction;
          const isBuffedByTeam = activeTeamBuffs && activeTeamBuffs.has(faction) && !isProvider;

          let tagClasses = `px-1.5 py-0.5 rounded text-xxs leading-none shadow-sm `;

          if (isProvider) {
            tagClasses += 'bg-emerald-600 text-emerald-100 font-bold ring-1 ring-emerald-300';
          } else if (isBuffedByTeam) {
            tagClasses += 'bg-sky-600 text-sky-100 font-semibold ring-1 ring-sky-400';
          } else {
            tagClasses += 'bg-slate-600 text-slate-300';
          }
          
          return (
            <span key={`${hero.id}-faction-${index}`} className={tagClasses} title={faction}>
              {faction}
            </span>
          );
        })}
        {![hero.faction1, hero.faction2, hero.faction3].some(Boolean) && (
            <div className="h-[17px] mt-1"></div> 
        )}
      </div>

      {showRemoveButton && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation(); 
            onRemove();
          }}
          className="absolute top-0.5 right-0.5 bg-red-500 hover:bg-red-700 text-white text-xxs font-bold p-0.5 rounded-full w-4 h-4 flex items-center justify-center z-10"
          aria-label={`Remove ${hero.name}`}
        >
          X
        </button>
      )}
    </div>
  );
};

export default HeroCard;
