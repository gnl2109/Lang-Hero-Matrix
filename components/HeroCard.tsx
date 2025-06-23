
import React from 'react';
import { Hero, TeamId } from '../types';
import { useAppContext } from '../context/AppContext'; // Corrected import

interface HeroCardProps {
  hero: Hero;
  isSelected?: boolean; // For "owned" status in roster setup
  isDisabled?: boolean; // Generally true if hero is in any team (for pool display)
  onClick?: () => void; // Primarily for roster setup's toggleOwnedHero
  onRemove?: () => void;
  showRemoveButton?: boolean;
  sourceTeamId?: TeamId;
  activeTeamBuffs?: Set<string>;
  isCurrentlySelectedForAssignment?: boolean; // True if hero is part of the multi-selection group from pool
  onSelectForAssignment?: (heroId: string) => void; // Handler for selecting/deselecting for assignment
}

const HeroCard: React.FC<HeroCardProps> = ({
  hero,
  isSelected, // For roster setup selection
  isDisabled, // Generally means hero is in a team when shown in the pool
  onClick,
  onRemove,
  showRemoveButton,
  sourceTeamId,
  activeTeamBuffs,
  isCurrentlySelectedForAssignment, // For pool hero multi-selection
  onSelectForAssignment,
}) => {
  const { isAppDragging } = useAppContext();

  // In the pool, isDisabled means the hero is in a team.
  // In roster setup, isDisabled might not be used, isSelected is primary.
  const cardIsEffectivelyDisabledForPoolInteraction = isDisabled && !showRemoveButton;


  const cardClasses = `
    relative
    bg-slate-700 rounded-md overflow-hidden shadow-md transition-all duration-200 ease-in-out
    p-1 w-full h-16
    flex flex-col items-center justify-start
    text-center
    ${isCurrentlySelectedForAssignment ? 'ring-2 ring-yellow-400 scale-105 shadow-yellow-500/50' : (isSelected ? 'ring-2 ring-sky-500' : 'ring-1 ring-slate-600')}
    ${cardIsEffectivelyDisabledForPoolInteraction ? 'opacity-50 cursor-not-allowed grayscale filter' : 'cursor-pointer'}
    ${(!cardIsEffectivelyDisabledForPoolInteraction && !showRemoveButton && !isAppDragging && !isCurrentlySelectedForAssignment) ? 'hover:shadow-lg hover:ring-sky-400' : ''}
    ${(showRemoveButton) ? 'cursor-grab' : ''}
  `;

  const handleClick = () => {
    // For pool selection: onSelectForAssignment should be callable even if isDisabled (meaning hero is in a team),
    // as the selection logic in HomePage will prevent selection of already assigned heroes.
    // The visual "isDisabled" state (opacity/grayscale) is for indication.
    if (onSelectForAssignment) {
      onSelectForAssignment(hero.id);
    } else if (onClick && !cardIsEffectivelyDisabledForPoolInteraction) { // Roster setup click
      onClick();
    }
  };

  // A hero is draggable if:
  // 1. It's in a team (showRemoveButton is true) 
  // OR it's in the pool and not disabled (i.e., not in another team)
  // 2. AND It's NOT currently part of the multi-selection group for assignment.
  const isDraggable = (showRemoveButton || !isDisabled) && !isCurrentlySelectedForAssignment;


  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isDraggable) {
        e.preventDefault();
        return;
    }
    e.dataTransfer.setData('heroId', hero.id);
    e.dataTransfer.effectAllowed = 'move';
    if (showRemoveButton && sourceTeamId) {
      e.dataTransfer.setData('sourceTeamId', sourceTeamId);
    }
    try {
        e.dataTransfer.setData('text/plain', hero.id); // For Firefox compatibility
        // Ensure custom type is 'heroid' if consistently used, or just text/plain + heroId
    } catch (err) {
        console.warn("Error setting multiple dataTransfer types:", err);
    }
  };

  const rawFactions = [hero.faction1, hero.faction2, hero.faction3]
    .filter(Boolean)
    .join(' / ');
  const cardTitle = `${hero.name}${rawFactions ? ` (${rawFactions})` : ''} ${isDisabled ? '[Assigned]' : ''} ${isCurrentlySelectedForAssignment ? '[Selected for Add]' : ''}`;


  return (
    <div
      className={cardClasses}
      onClick={handleClick}
      title={cardTitle}
      role="button"
      tabIndex={cardIsEffectivelyDisabledForPoolInteraction && !onSelectForAssignment ? -1 : 0}
      aria-pressed={isSelected || isCurrentlySelectedForAssignment}
      aria-disabled={cardIsEffectivelyDisabledForPoolInteraction}
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
            <div className="h-[17px] mt-1"></div> // Placeholder for consistent height if no factions
        )}
      </div>

      {showRemoveButton && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click event
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
