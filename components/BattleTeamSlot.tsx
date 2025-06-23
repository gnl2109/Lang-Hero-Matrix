
import React, { useState, useMemo } from 'react';
import { Hero, TeamId, God } from '../types';
import { useAppContext } from '../context/AppContext';
import HeroCard from './HeroCard';
import { TEAM_NAMES } from '../constants';

interface BattleTeamSlotProps {
  teamId: TeamId;
}

const BattleTeamSlot: React.FC<BattleTeamSlotProps> = ({ teamId }) => {
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
    clearTeam, // Added context function
  } = useAppContext();

  const currentTeamData = teamComposition[teamId];
  const heroesInTeam = useMemo(() => 
    currentTeamData.heroes.map(id => getHeroById(id)).filter(Boolean) as Hero[],
    [currentTeamData.heroes, getHeroById]
  );
  
  const selectedGodId = currentTeamData.godId;
  const selectedGod = selectedGodId ? getGodById(selectedGodId) : null;

  const [isDragOver, setIsDragOver] = useState(false);
  const MAX_HEROES_PER_TEAM = 8;
  const isTeamEmpty = heroesInTeam.length === 0 && !selectedGodId;

  // Calculate active faction buffs for this specific team
  const activeTeamBuffs = useMemo(() => {
    const buffs = new Set<string>();
    heroesInTeam.forEach(hero => {
      if (hero.factionBuffValue) {
        buffs.add(hero.factionBuffValue);
      }
    });
    return buffs;
  }, [heroesInTeam]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes('heroid')) {
        e.preventDefault(); 
        e.dataTransfer.dropEffect = 'move'; 
        setIsDragOver(true); 
    } else {
        if (isDragOver) { 
          setIsDragOver(false);
        }
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); 
    setIsDragOver(false);
    const heroId = e.dataTransfer.getData('heroId');
    const sourceTeamId = e.dataTransfer.getData('sourceTeamId') as TeamId | undefined; 

    if (heroId) {
      if (sourceTeamId && sourceTeamId !== teamId) {
        const success = moveHeroBetweenTeams(heroId, sourceTeamId, teamId);
        if (!success) {
          console.warn(`Failed to move hero ${heroId} from ${sourceTeamId} to ${teamId}.`);
        }
      } else if (!sourceTeamId) {
        const success = addHeroToTeam(heroId, teamId);
        if (!success) {
          console.warn("Failed to add hero:", heroId, "to team:", teamId);
        }
      }
    }
  };

  const handleGodSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const godId = e.target.value;
    assignGodToTeam(godId === "" ? null : godId, teamId);
  };

  const handleClearTeam = () => {
    // window.confirm removed for direct action
    clearTeam(teamId);
  };

  const slotClasses = `
    bg-slate-800 p-4 rounded-lg shadow-xl flex-1 min-w-[280px] flex flex-col
    transition-all duration-150 ease-in-out
    ${isDragOver ? 'ring-2 ring-sky-500 scale-105 bg-slate-700' : 'ring-1 ring-slate-700'}
  `;

  return (
    <div 
      className={slotClasses}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <h3 className="text-xl font-bold text-sky-400 mb-1 border-b-2 border-slate-700 pb-2">{TEAM_NAMES[teamId]} ({heroesInTeam.length}/{MAX_HEROES_PER_TEAM})</h3>
      
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
            Drag and drop heroes here.
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
                activeTeamBuffs={activeTeamBuffs} // Pass active buffs to HeroCard
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
