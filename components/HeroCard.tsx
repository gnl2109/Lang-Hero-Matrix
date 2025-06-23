
import React from 'react';
import { Hero, TeamId } from '../types';
import { useAppContext } from '../context/AppContext'; // Corrected import

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
  const { isAppDragging } = useAppContext(); // Get global dragging state

  const cardClasses = `
    relative 
    bg-slate-700 rounded-md overflow-hidden shadow-md transition-all duration-200 ease-in-out
    p-1 w-full h-16 
    flex flex-col items-center justify-start 
    text-center 
    ${isSelected ? 'ring-2 ring-sky-500' : 'ring-1 ring-slate-600'}
    ${isDisabled ? 'opacity-50 cursor-not-allowed grayscale filter' : 'cursor-pointer'}
    ${(!isDisabled && !showRemoveButton && !isAppDragging) ? 'hover:shadow-lg hover:ring-sky-400' : ''} 
    ${(showRemoveButton) ? 'cursor-grab' : ''}
  `;

  const handleClick = () => {
    if (!isDisabled && onClick) {
      onClick();
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
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
        e.dataTransfer.setData('heroid', hero.id); 
    } catch (err) {
        console.warn("Error setting multiple dataTransfer types:", err);
    }
  };
  
  const isDraggable = showRemoveButton || !isDisabled;

  const rawFactions = [hero.faction1, hero.faction2, hero.faction3]
    .filter(Boolean)
    .join(' / ');
  const cardTitle = `${hero.name}${rawFactions ? ` (${rawFactions})` : ''}`;

  return (
    <div 
      className={cardClasses} 
      onClick={handleClick} 
      title={cardTitle}
      role="button" 
      tabIndex={isDisabled && !showRemoveButton ? -1 : 0} 
      aria-pressed={isSelected} 
      aria-disabled={isDisabled && !showRemoveButton}
      draggable={isDraggable}
      onDragStart={handleDragStart}
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
          className="absolute top-0.5 right-0.5 bg-red-500 hover:bg-red-700 text-white text-xxs font-bold p-0.5 rounded-full w-4 h-4 flex items-center justify-center"
          aria-label={`Remove ${hero.name}`}
        >
          X
        </button>
      )}
    </div>
  );
};

export default HeroCard;
