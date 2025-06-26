
import React, { useState, useMemo } from 'react';
import { Hero, TeamId, God } from '../types';
import { useAppContext } from '../context/AppContext';
import HeroCard from './HeroCard';
import { TEAM_NAMES } from '../constants';

interface BattleTeamSlotProps {
  teamId: TeamId;
  selectedHeroIdsForAssignment: ReadonlySet<string>; 
  onAssignSelectedHeroes: (teamId: TeamId) => void; 
}

const BattleTeamSlot: React.FC<BattleTeamSlotProps> = ({ 
  teamId, 
  selectedHeroIdsForAssignment, 
  onAssignSelectedHeroes 
}) => {
  const {
    teamComposition,
    removeHeroFromTeam,
    getHeroById,
    addHeroToTeam,
    moveHeroBetweenTeams,
    allGods,
    assignGodToTeam,
    getGodById,
    isLoadingGods,
    clearTeam,
    isHeroInAnyTeam,
    // Touch D&D context
    touchDragItem,
    setTouchDragItem,
    touchDropTargetTeamId,
    setTouchDropTargetTeamId,
    setIsAppDragging, // To set false after touch drop
  } = useAppContext();

  const currentTeamData = teamComposition[teamId];
  const heroesInTeam = useMemo(() =>
    currentTeamData.heroes.map(id => getHeroById(id)).filter(Boolean) as Hero[],
    [currentTeamData.heroes, getHeroById]
  );

  const selectedGodId = currentTeamData.godId;
  const selectedGod = selectedGodId ? getGodById(selectedGodId) : null;

  const [isMouseDragOver, setIsMouseDragOver] = useState(false); // Renamed for clarity
  const MAX_HEROES_PER_TEAM = 8;
  const isTeamEmpty = heroesInTeam.length === 0 && !selectedGodId;

  const activeTeamBuffs = useMemo(() => {
    const buffs = new Set<string>();
    heroesInTeam.forEach(hero => {
      if (hero.factionBuffValue) {
        buffs.add(hero.factionBuffValue);
      }
    });
    return buffs;
  }, [heroesInTeam]);

  // Mouse Drag Handlers
  const handleMouseDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes('heroid') || e.dataTransfer.types.includes('text/plain')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setIsMouseDragOver(true);
    }
  };

  const handleMouseDragLeave = () => {
    setIsMouseDragOver(false);
  };

  const handleMouseDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsMouseDragOver(false);
    // setIsAppDragging(false) is handled by global 'dragend' listener
    const heroId = e.dataTransfer.getData('heroId') || e.dataTransfer.getData('text/plain');
    const sourceTeamId = e.dataTransfer.getData('sourceTeamId') as TeamId | undefined;

    if (heroId) {
      if (sourceTeamId && sourceTeamId !== teamId) {
        moveHeroBetweenTeams(heroId, sourceTeamId, teamId);
      } else if (!sourceTeamId) {
        if (!isHeroInAnyTeam(heroId)) {
            addHeroToTeam(heroId, teamId);
        } else {
            console.warn(`Hero ${heroId} is already in a team (DND attempt).`);
        }
      }
    }
  };

  // Touch Drag Handlers
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchDragItem) {
      e.preventDefault(); // Allow drop and prevent scrolling over this element
      setTouchDropTargetTeamId(teamId);
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchDragItem && touchDropTargetTeamId === teamId) {
      e.preventDefault(); // Ensure this event is handled here
      const { heroId, sourceTeamId } = touchDragItem;
      let success = false;
      if (heroId) {
        if (sourceTeamId && sourceTeamId !== teamId) {
          success = moveHeroBetweenTeams(heroId, sourceTeamId, teamId);
        } else if (!sourceTeamId) {
          if (!isHeroInAnyTeam(heroId)) {
            success = addHeroToTeam(heroId, teamId);
          } else {
            console.warn(`Hero ${heroId} is already in a team (Touch DND attempt).`);
          }
        }
      }
      // Reset drag state - Global touchend will also fire, but this handles successful drop cleanup immediately.
      setTouchDragItem(null);
      setTouchDropTargetTeamId(null); 
      setIsAppDragging(false); // Crucial for touch
    }
    // If drop was not intended for this specific slot (e.g. touchDropTargetTeamId was different), global touchend handles reset.
  };


  const handleGodSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const godId = e.target.value;
    assignGodToTeam(godId === "" ? null : godId, teamId);
  };

  const handleClearTeam = () => {
    clearTeam(teamId);
  };
  
  const numSelectedHeroes = selectedHeroIdsForAssignment.size;
  const isTeamFull = heroesInTeam.length >= MAX_HEROES_PER_TEAM;

  let addButtonText = 'Select Heroes to Add';
  let isAddButtonDisabled = true;

  if (numSelectedHeroes > 0) {
    if (isTeamFull) {
      addButtonText = `Team Full (${heroesInTeam.length}/${MAX_HEROES_PER_TEAM})`;
      isAddButtonDisabled = true;
    } else {
      addButtonText = `Add ${numSelectedHeroes} Selected Heroes`;
      isAddButtonDisabled = false;
    }
  } else {
    isAddButtonDisabled = true; 
  }

  const isHighlightedForDrop = isMouseDragOver || (touchDragItem && touchDropTargetTeamId === teamId);

  const slotClasses = `
    bg-slate-800 p-4 rounded-lg shadow-xl flex-1 min-w-[280px] flex flex-col
    transition-all duration-150 ease-in-out
    ${isHighlightedForDrop ? 'ring-2 ring-sky-500 scale-105 bg-slate-700' : 'ring-1 ring-slate-700'}
  `;

  return (
    <div
      className={slotClasses}
      onDragOver={handleMouseDragOver}
      onDragLeave={handleMouseDragLeave}
      onDrop={handleMouseDrop}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <h3 className="text-xl font-bold text-sky-400 mb-1 border-b-2 border-slate-700 pb-2">{TEAM_NAMES[teamId]} ({heroesInTeam.length}/{MAX_HEROES_PER_TEAM})</h3>

      <div className="my-3">
        <button
          onClick={() => onAssignSelectedHeroes(teamId)}
          disabled={isAddButtonDisabled}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          aria-label={`Add selected heroes to ${TEAM_NAMES[teamId]}`}
        >
          {addButtonText}
        </button>
      </div>
      
      <div className="my-2">
        <label htmlFor={`god-select-${teamId}`} className="block text-sm font-medium text-slate-300 mb-1">
          Select God:
        </label>
        {isLoadingGods ? (
            <p className="text-xs text-slate-400">Loading Gods...</p>
        ) : (
        <select
          id={`god-select-${teamId}`}
          value={selectedGodId || ""}
          onChange={handleGodSelection}
          className="w-full bg-slate-700 text-slate-100 border border-slate-600 rounded p-2 text-sm focus:ring-sky-500 focus:border-sky-500"
          aria-label={`Select God for ${TEAM_NAMES[teamId]}`}
        >
          <option value="">-- None --</option>
          {allGods.map(god => (
            <option key={god.id} value={god.id}>
              {god.name}
            </option>
          ))}
        </select>
        )}
        {selectedGod && (
          <p className="text-xs text-amber-300 mt-1">Chosen God: {selectedGod.name}</p>
        )}
      </div>

      <div className="flex-grow">
        {heroesInTeam.length === 0 && (
          <p className="text-slate-400 text-sm italic mb-3 h-full flex items-center justify-center">
            Drag & drop heroes or use 'Add' button.
          </p>
        )}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2 mb-3 min-h-[50px]">
          {heroesInTeam.map(hero => (
            <div key={hero.id}>
              <HeroCard
                hero={hero}
                onRemove={() => removeHeroFromTeam(hero.id, teamId)}
                showRemoveButton={true}
                sourceTeamId={teamId}
                activeTeamBuffs={activeTeamBuffs}
              />
            </div>
          ))}
        </div>
      </div>
       <div className="mt-auto pt-2 flex justify-between items-center">
        <button
            onClick={handleClearTeam}
            disabled={isTeamEmpty}
            className="text-xs text-amber-400 hover:text-amber-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors duration-150 underline"
            aria-label={`Clear all selections for ${TEAM_NAMES[teamId]}`}
        >
            Clear Team
        </button>
        {heroesInTeam.length >= MAX_HEROES_PER_TEAM && (
         <p className="text-xs text-amber-400 text-right">Hero Team Full</p>
        )}
       </div>
    </div>
  );
};

export default BattleTeamSlot;
