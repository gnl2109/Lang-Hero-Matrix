
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
    touchDragData, // Need to access current drag data for cleanup
    setIsTouchActive,
    isTouchActive,
  } = useAppContext();
  const heroCardRef = useRef<HTMLDivElement>(null);

  const cardClasses = `
    relative 
    bg-slate-700 rounded-md overflow-hidden shadow-md transition-all duration-200 ease-in-out
    p-1 w-full h-16 
    flex flex-col items-center justify-start 
    text-center 
    select-none /* Prevent text selection during drag on mobile */
    ${isSelected ? 'ring-2 ring-sky-500' : 'ring-1 ring-slate-600'}
    ${isDisabled ? 'opacity-50 cursor-not-allowed grayscale filter' : 'cursor-pointer'}
    ${(!isDisabled && !showRemoveButton && !isAppDragging && !isTouchActive) ? 'hover:shadow-lg hover:ring-sky-400' : ''} 
    ${(showRemoveButton || (touchDragData && touchDragData.heroId === hero.id)) ? 'cursor-grabbing' : (showRemoveButton ? 'cursor-grab' : '')}
  `;

  const handleClick = () => {
    if (!isDisabled && onClick && !isTouchActive) { // Prevent click during/after touch drag
      onClick();
    }
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
    if (heroCardRef.current) {
      setTouchDragData({ heroId: hero.id, sourceTeamId, element: heroCardRef.current });
      setIsTouchActive(true);
      heroCardRef.current.style.opacity = '0.7';
      heroCardRef.current.style.transform = 'scale(1.05)';
      heroCardRef.current.style.zIndex = '1000'; // Bring to front
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchDragData || touchDragData.heroId !== hero.id) return;
    e.preventDefault(); 
    const touch = e.touches[0];
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);

    let currentlyOverTeamId: TeamId | null = null;
    if (targetElement) {
      const battleTeamSlotElement = targetElement.closest('[data-team-id]');
      if (battleTeamSlotElement) {
        currentlyOverTeamId = battleTeamSlotElement.getAttribute('data-team-id') as TeamId;
      }
    }
    setTouchOverTeamId(currentlyOverTeamId);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchDragData || touchDragData.heroId !== hero.id) {
       // If touch ends for a card not being actively touch-dragged by this instance, clear global touch state.
       // This can happen if another touch operation was interrupted.
       if (isTouchActive) {
          setIsTouchActive(false);
          setTouchOverTeamId(null);
          setTouchDragData(null); 
       }
       return;
    }

    const currentDropTargetTeamId = useAppContext().touchOverTeamId; // Get latest from context

    if (heroCardRef.current) {
      heroCardRef.current.style.opacity = '1';
      heroCardRef.current.style.transform = 'scale(1)';
      heroCardRef.current.style.zIndex = 'auto';
    }

    if (currentDropTargetTeamId) {
      const { heroId: draggedHeroId, sourceTeamId: dragSourceTeamId } = touchDragData;
      if (dragSourceTeamId && dragSourceTeamId !== currentDropTargetTeamId) {
        moveHeroBetweenTeams(draggedHeroId, dragSourceTeamId, currentDropTargetTeamId);
      } else if (!dragSourceTeamId) {
        addHeroToTeam(draggedHeroId, currentDropTargetTeamId);
      }
    }
    
    setTouchDragData(null);
    setTouchOverTeamId(null);
    setIsTouchActive(false); // Reset global touch active flag
  };


  const isDraggableNative = showRemoveButton || !isDisabled; // For HTML D&D

  const rawFactions = [hero.faction1, hero.faction2, hero.faction3]
    .filter(Boolean)
    .join(' / ');
  const cardTitle = `${hero.name}${rawFactions ? ` (${rawFactions})` : ''}`;

  return (
    <div 
      ref={heroCardRef}
      className={cardClasses} 
      onClick={handleClick} 
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
      onTouchCancel={handleTouchEnd} // Treat cancel same as end for cleanup
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
          // For touch, ensure this button doesn't interfere with card drag
          // It's small, so usually touch focuses on card body.
          // If it becomes an issue, might need e.preventDefault() on its onTouchStart.
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