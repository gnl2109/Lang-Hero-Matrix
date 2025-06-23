
import React, { useRef } from 'react';
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
    isAppDragging, // Native D&D global flag
    setTouchDragData, 
    setTouchOverTeamId, 
    addHeroToTeam, 
    moveHeroBetweenTeams,
    touchDragData: contextTouchDragData, // Renamed to avoid conflict with local var if any
    setIsTouchActive,
    isTouchActive,
    touchOverTeamId: contextTouchOverTeamId, // Get latest from context for drop
  } = useAppContext();

  const heroCardRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const touchStartCoordsRef = useRef<{ x: number; y: number } | null>(null);
  const dragStylesAppliedRef = useRef(false);

  const cardClasses = `
    relative 
    bg-slate-700 rounded-md overflow-hidden shadow-md transition-all duration-200 ease-in-out
    p-1 w-full h-20 /* Increased height from h-16 to h-20 */
    flex flex-col items-center justify-start 
    text-center 
    select-none /* Prevent text selection during drag on mobile */
    ${isSelected ? 'ring-2 ring-sky-500' : 'ring-1 ring-slate-600'}
    ${isDisabled ? 'opacity-50 cursor-not-allowed grayscale filter' : 'cursor-pointer'}
    ${(!isDisabled && !showRemoveButton && !isAppDragging && !isTouchActive) ? 'hover:shadow-lg hover:ring-sky-400' : ''} 
    /* The grabbing cursor style will now be primarily for native D&D or if dragStylesAppliedRef is true */
    ${(showRemoveButton && !dragStylesAppliedRef.current) ? 'cursor-grab' : ''}
    ${(dragStylesAppliedRef.current) ? 'cursor-grabbing' : ''}
  `;

  // Click handler for mouse clicks and taps that weren't prevented
  const handleClick = () => {
    if (isDisabled || !onClick) return;
    // If it was a drag, onTouchMove would have called preventDefault, 
    // and this click handler might not even fire.
    // isDraggingRef is reset in onTouchEnd, so it would be false here
    // for a click event that fires *after* onTouchEnd.
    // The key is that onTouchMove only calls preventDefault for actual drags.
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
  
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isDisabled && !showRemoveButton) return;

    isDraggingRef.current = false;
    dragStylesAppliedRef.current = false;
    if (e.touches.length > 0) {
        touchStartCoordsRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
        touchStartCoordsRef.current = null; // Should not happen if event fires
    }

    // Set touchDragData early so other components know a touch has started
    // The element reference might be useful for other advanced scenarios, keeping it for now.
    if (heroCardRef.current) {
        setTouchDragData({ heroId: hero.id, sourceTeamId, element: heroCardRef.current });
    }
    setIsTouchActive(true); // Global flag for things like disabling hover on other cards
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    // Use touchDragData from context to ensure we're acting on the correct drag session
    if (!contextTouchDragData || contextTouchDragData.heroId !== hero.id || !touchStartCoordsRef.current || e.touches.length === 0) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartCoordsRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartCoordsRef.current.y);

    if (!isDraggingRef.current && (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD)) {
      isDraggingRef.current = true;
    }

    if (isDraggingRef.current) {
      e.preventDefault(); // Prevent scroll only if actively dragging

      if (!dragStylesAppliedRef.current && heroCardRef.current) {
        heroCardRef.current.style.opacity = '0.7';
        heroCardRef.current.style.transform = 'scale(1.05)';
        heroCardRef.current.style.zIndex = '1000';
        dragStylesAppliedRef.current = true;
      }

      const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
      let currentlyOverTeamId: TeamId | null = null;
      if (targetElement) {
        const battleTeamSlotElement = targetElement.closest('[data-team-id]');
        if (battleTeamSlotElement) {
          currentlyOverTeamId = battleTeamSlotElement.getAttribute('data-team-id') as TeamId;
        }
      }
      // Only update if it changed to avoid excessive re-renders from setTouchOverTeamId
      if (contextTouchOverTeamId !== currentlyOverTeamId) {
        setTouchOverTeamId(currentlyOverTeamId);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    // Use touchDragData from context for consistency
    if (!contextTouchDragData || contextTouchDragData.heroId !== hero.id) {
       // This touch end isn't for the hero this card instance thought it was dragging.
       // Or, another touch operation might have cleared global state.
       // Reset local visual state if it was applied by this card.
       if (dragStylesAppliedRef.current && heroCardRef.current) {
          heroCardRef.current.style.opacity = '1';
          heroCardRef.current.style.transform = 'scale(1)';
          heroCardRef.current.style.zIndex = 'auto';
       }
       // If global touch active flag is true, but no specific drag data, reset it.
       // This case is a bit broad, but aims to prevent a stuck isTouchActive state.
       if (isTouchActive && !contextTouchDragData) {
           setIsTouchActive(false);
       }
       isDraggingRef.current = false;
       dragStylesAppliedRef.current = false;
       touchStartCoordsRef.current = null;
       return;
    }

    if (dragStylesAppliedRef.current && heroCardRef.current) {
      heroCardRef.current.style.opacity = '1';
      heroCardRef.current.style.transform = 'scale(1)';
      heroCardRef.current.style.zIndex = 'auto';
      dragStylesAppliedRef.current = false;
    }

    if (isDraggingRef.current) { // It was a drag
      const currentDropTargetTeamId = contextTouchOverTeamId; // Use value from context at time of drop
      if (currentDropTargetTeamId) {
        const { heroId: draggedHeroId, sourceTeamId: dragSourceTeamId } = contextTouchDragData;
        if (dragSourceTeamId && dragSourceTeamId !== currentDropTargetTeamId) {
          moveHeroBetweenTeams(draggedHeroId, dragSourceTeamId, currentDropTargetTeamId);
        } else if (!dragSourceTeamId) {
          addHeroToTeam(draggedHeroId, currentDropTargetTeamId);
        }
      }
    } 
    // For taps (isDraggingRef.current is false), we rely on the native click event to fire,
    // as onTouchMove wouldn't have called e.preventDefault().

    // Universal cleanup for this touch interaction ending
    setTouchDragData(null);
    setTouchOverTeamId(null);
    setIsTouchActive(false); 
    isDraggingRef.current = false;
    touchStartCoordsRef.current = null;
  };


  const isDraggableNative = showRemoveButton || !isDisabled; 

  const rawFactions = [hero.faction1, hero.faction2, hero.faction3]
    .filter(Boolean)
    .join(' / ');
  const cardTitle = `${hero.name}${rawFactions ? ` (${rawFactions})` : ''}`;

  return (
    <div 
      ref={heroCardRef}
      className={cardClasses} 
      onClick={handleClick} // This will now fire for taps
      title={cardTitle}
      role="button" 
      tabIndex={isDisabled && !showRemoveButton ? -1 : 0} 
      aria-pressed={isSelected} 
      aria-disabled={isDisabled && !showRemoveButton}
      draggable={isDraggableNative}
      onDragStart={handleDragStartNative}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd} 
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
          // No special touch handling needed for this button itself, as parent handles drag.
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
