import React, { useState, useMemo, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import HeroCard from '../components/HeroCard';
import BattleTeamSlot from '../components/BattleTeamSlot';
import ShareLinkModal from '../components/ShareLinkModal';
import SaveCompositionModal from '../components/SaveCompositionModal';
import LoadCompositionModal from '../components/LoadCompositionModal';
import { TEAM_IDS } from '../constants';
import { encodeComposition } from '../utils/compositionEncoder';
import { SharedPayload, TeamId, Hero } from '../types';

const HomePage: React.FC = () => {
  const {
    allHeroes,
    isLoadingHeroes,
    ownedHeroIds,
    toggleOwnedHero,
    clearOwnedHeroSelections,
    isHeroInAnyTeam,
    isRosterSetupComplete,
    completeRosterSetup,
    resetRosterAndTeams,
    editRoster, // Added from context
    teamComposition,
    addHeroToTeam,
    savedCompositions,
    saveCurrentComposition,
    loadComposition,
    deleteSavedComposition,
  } = useAppContext();

  // Filters for Hero Pool (after roster setup)
  const [filterText, setFilterText] = useState('');
  const [selectedFactionFilters, setSelectedFactionFilters] = useState<Set<string>>(new Set());
  const [showOnlyFactionBuffHolders, setShowOnlyFactionBuffHolders] = useState(false);


  // Filters for Roster Setup
  const [rosterFilterText, setRosterFilterText] = useState('');
  const [rosterSelectedFactionFilters, setRosterSelectedFactionFilters] = useState<Set<string>>(new Set());
  const [rosterShowOnlyFactionBuffHolders, setRosterShowOnlyFactionBuffHolders] = useState(false);


  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  
  const [selectedHeroIdsForAssignment, setSelectedHeroIdsForAssignment] = useState<Set<string>>(new Set());

  const toggleHeroForAssignment = useCallback((heroId: string) => {
    if (isHeroInAnyTeam(heroId)) {
        setSelectedHeroIdsForAssignment(prev => {
            const newSet = new Set(prev);
            newSet.delete(heroId);
            return newSet;
        });
        return;
    }

    setSelectedHeroIdsForAssignment(prev => {
      const newSet = new Set(prev);
      if (newSet.has(heroId)) {
        newSet.delete(heroId);
      } else {
        newSet.add(heroId);
      }
      return newSet;
    });
  }, [isHeroInAnyTeam]);

  const handleAddSelectedHeroesToTeam = useCallback((teamId: TeamId) => {
    const successfullyAddedIds = new Set<string>();
    for (const heroId of selectedHeroIdsForAssignment) {
      const success = addHeroToTeam(heroId, teamId);
      if (success) {
        successfullyAddedIds.add(heroId);
      }
      const currentTeam = teamComposition[teamId];
      if (currentTeam && currentTeam.heroes.length >= 8) {
         // Team became full
      }
    }

    if (successfullyAddedIds.size > 0) {
      setSelectedHeroIdsForAssignment(prevSelected => {
        const newSelected = new Set(prevSelected);
        successfullyAddedIds.forEach(id => newSelected.delete(id));
        return newSelected;
      });
    }
  }, [selectedHeroIdsForAssignment, addHeroToTeam, teamComposition]);


  const handleShare = () => {
    const payload: SharedPayload = {
      teamComposition: teamComposition,
    };
    const encoded = encodeComposition(payload);
    const baseUrl = window.location.origin + window.location.pathname.replace(/index.html$/, '');
    const fullUrl = `${baseUrl}#/view/${encoded}`;
    setShareUrl(fullUrl);
    setShowShareModal(true);
  };

  const handleFullReset = () => {
    resetRosterAndTeams();
    setSelectedHeroIdsForAssignment(new Set());
    setFilterText('');
    setSelectedFactionFilters(new Set());
    setShowOnlyFactionBuffHolders(false);
    setRosterFilterText('');
    setRosterSelectedFactionFilters(new Set());
    setRosterShowOnlyFactionBuffHolders(false); 
  };
  
  const clearCurrentlySelectedHeroesForAssignment = () => {
    setSelectedHeroIdsForAssignment(new Set());
  };

  const handleSaveComposition = (name: string) => {
    saveCurrentComposition(name);
  };

  const uniqueFactions = useMemo(() => {
    const factions = new Set<string>();
    allHeroes.forEach(hero => {
      if (hero.faction1 && hero.faction1 !== '-') factions.add(hero.faction1);
      if (hero.faction2 && hero.faction2 !== '-') factions.add(hero.faction2);
      if (hero.faction3 && hero.faction3 !== '-') factions.add(hero.faction3);
    });
    return Array.from(factions).sort();
  }, [allHeroes]);

  const toggleFactionFilter = useCallback((faction: string) => {
    setSelectedFactionFilters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(faction)) {
        newSet.delete(faction);
      } else {
        newSet.add(faction);
      }
      return newSet;
    });
  }, []);

  const clearAllFactionFilters = useCallback(() => {
    setSelectedFactionFilters(new Set());
  }, []);

  const heroPool = useMemo(() => {
    return allHeroes
      .filter(hero => ownedHeroIds.has(hero.id))
      .filter(hero => {
        const nameMatch = hero.name.toLowerCase().includes(filterText.toLowerCase());
        
        const heroFactions = [hero.faction1, hero.faction2, hero.faction3].filter(f => f && f !== '-');
        const factionMatch = selectedFactionFilters.size === 0 || 
                             heroFactions.some(hf => selectedFactionFilters.has(hf));
        
        const factionBuffMatch = !showOnlyFactionBuffHolders || (hero.factionBuffValue && hero.factionBuffValue.trim() !== '');
        
        return nameMatch && factionMatch && factionBuffMatch;
      });
  }, [allHeroes, ownedHeroIds, filterText, selectedFactionFilters, showOnlyFactionBuffHolders]);

  // Logic for Roster Setup filters
  const toggleRosterFactionFilter = useCallback((faction: string) => {
    setRosterSelectedFactionFilters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(faction)) {
        newSet.delete(faction);
      } else {
        newSet.add(faction);
      }
      return newSet;
    });
  }, []);

  const filteredAllHeroesForRosterSetup = useMemo(() => {
    return allHeroes.filter(hero => {
      const nameMatch = !rosterFilterText || hero.name.toLowerCase().includes(rosterFilterText.toLowerCase());
      
      const heroFactions = [hero.faction1, hero.faction2, hero.faction3].filter(f => f && f !== '-');
      const factionMatch = rosterSelectedFactionFilters.size === 0 || 
                           heroFactions.some(hf => rosterSelectedFactionFilters.has(hf));
      
      const factionBuffMatch = !rosterShowOnlyFactionBuffHolders || (hero.factionBuffValue && hero.factionBuffValue.trim() !== '');
      
      return nameMatch && factionMatch && factionBuffMatch;
    });
  }, [allHeroes, rosterFilterText, rosterSelectedFactionFilters, rosterShowOnlyFactionBuffHolders]);


  if (isLoadingHeroes) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-sky-300">Loading heroes...</div>;
  }

  if (!isRosterSetupComplete) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-center text-sky-400 mb-6">랑그릿사 모바일 (극성의나라, 황혼의영역 컨텐츠용) 로스터 조합기</h1>
        <p className="text-center text-slate-300 mb-2">Click hero cards to mark as owned. You'll then build your teams.</p>

        <div className="mb-6 max-w-lg mx-auto">
          <input
            type="text"
            placeholder="Search heroes by name..."
            value={rosterFilterText}
            onChange={(e) => setRosterFilterText(e.target.value)}
            className="w-full bg-slate-700 text-slate-100 border border-slate-600 rounded p-3 text-lg focus:ring-sky-500 focus:border-sky-500"
            aria-label="Search heroes for roster selection"
          />
        </div>

        <div className="my-6 max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-slate-300 mb-2 text-center">Filter by Faction:</h3>
          <div className="flex flex-wrap justify-center gap-2 mb-3">
            {uniqueFactions.map(faction => (
              <button
                key={`roster-faction-${faction}`}
                onClick={() => toggleRosterFactionFilter(faction)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150
                  ${rosterSelectedFactionFilters.has(faction) ? 'bg-sky-600 text-white hover:bg-sky-500' : 'bg-slate-600 text-slate-200 hover:bg-slate-500'}
                `}
                aria-pressed={rosterSelectedFactionFilters.has(faction)}
              >
                {faction}
              </button>
            ))}
          </div>
        </div>
        
        {/* Faction Buff Filter for Roster Setup */}
        <div className="my-4 max-w-md mx-auto flex items-center justify-center">
          <input
            type="checkbox"
            id="roster-faction-buff-filter"
            checked={rosterShowOnlyFactionBuffHolders}
            onChange={(e) => setRosterShowOnlyFactionBuffHolders(e.target.checked)}
            className="h-5 w-5 rounded border-slate-500 bg-slate-600 text-sky-600 focus:ring-sky-500"
            aria-label="Filter by faction buff holders during roster setup"
          />
          <label htmlFor="roster-faction-buff-filter" className="ml-3 text-sm text-slate-300">
            초절 보유 영웅만 보기 (Show Faction Buff Holders Only)
          </label>
        </div>

        {allHeroes.length === 0 && <p className="text-center text-amber-400">No heroes available. Check data source.</p>}
        {filteredAllHeroesForRosterSetup.length === 0 && (rosterFilterText || rosterSelectedFactionFilters.size > 0 || rosterShowOnlyFactionBuffHolders) && allHeroes.length > 0 && (
            <p className="text-center text-slate-400 my-4">
              No heroes match your criteria (name: "{rosterFilterText || 'any'}", factions: {rosterSelectedFactionFilters.size > 0 ? Array.from(rosterSelectedFactionFilters).join(', ') : 'any'}, faction buff: {rosterShowOnlyFactionBuffHolders ? 'Yes' : 'Any'}).
            </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 mb-8">
          {filteredAllHeroesForRosterSetup.map(hero => (
            <HeroCard
              key={hero.id}
              hero={hero}
              isSelected={ownedHeroIds.has(hero.id)}
              onClick={() => toggleOwnedHero(hero.id)}
            />
          ))}
        </div>
        <div className="text-center space-x-4">
          <button
            onClick={clearOwnedHeroSelections}
            disabled={ownedHeroIds.size === 0}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear Selections
          </button>
          <button
            onClick={completeRosterSetup}
            disabled={ownedHeroIds.size === 0}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Done ({ownedHeroIds.size} selected)
          </button>
        </div>
      </div>
    );
  }

  // Main application view after roster setup
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
            <h1 className="text-4xl font-bold text-sky-400">원하는 영웅 조합을 만들어보세요</h1>
        </div>
        <div className="flex flex-wrap gap-2">
            <button
                onClick={editRoster} // New button to go back to roster editing
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-150"
            >
                영웅 선택 수정
            </button>
            <button
                onClick={() => setShowSaveModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-150"
            >
                Save Composition
            </button>
            <button
                onClick={() => setShowLoadModal(true)}
                disabled={savedCompositions.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Load Compositions ({savedCompositions.length})
            </button>
            <button
                onClick={handleShare}
                className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-150"
            >
                Share Composition
            </button>
            <button
                onClick={handleFullReset}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-150"
            >
                Reset All & Roster
            </button>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-sky-300 mb-4">Battle Teams</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEAM_IDS.map(teamId => (
            <BattleTeamSlot
              key={teamId}
              teamId={teamId}
              selectedHeroIdsForAssignment={selectedHeroIdsForAssignment}
              onAssignSelectedHeroes={handleAddSelectedHeroesToTeam}
            />
          ))}
        </div>
      </div>

      {/* Hero Pool Section */}
      <div className="bg-slate-800 p-4 rounded-lg shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
            <h2 className="text-2xl font-semibold text-sky-300">My Hero Pool</h2>
            {selectedHeroIdsForAssignment.size > 0 && (
                <button 
                    onClick={clearCurrentlySelectedHeroesForAssignment} 
                    className="text-sm text-amber-400 hover:text-amber-300 underline"
                >
                    Clear {selectedHeroIdsForAssignment.size} Selected Heroes for Assignment
                </button>
            )}
        </div>

        {/* Filter Options Panel */}
        <div className="bg-slate-700 p-3 rounded-md mb-4 shadow">
            {/* Name Filter Section */}
            <div className="mb-4">
                <label htmlFor="hero-name-filter" className="block text-sm font-medium text-slate-300 mb-1">Filter by Name:</label>
                <input
                    id="hero-name-filter"
                    type="text"
                    placeholder="Enter hero name..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="w-full bg-slate-600 text-slate-100 border border-slate-500 rounded p-2 focus:ring-sky-500 focus:border-sky-500"
                    aria-label="Filter owned heroes by name"
                />
            </div>

            {/* Faction Filters Section */}
            <div className="mb-3">
                <p className="text-sm font-medium text-slate-300 mb-1">Filter by Faction:</p>
                <div className="flex flex-wrap gap-2 mb-2">
                    {uniqueFactions.map(faction => (
                        <button
                            key={`pool-faction-${faction}`}
                            onClick={() => toggleFactionFilter(faction)}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors duration-150
                                ${selectedFactionFilters.has(faction) ? 'bg-sky-500 text-white hover:bg-sky-400' : 'bg-slate-600 text-slate-200 hover:bg-slate-500'}
                            `}
                            aria-pressed={selectedFactionFilters.has(faction)}
                        >
                            {faction}
                        </button>
                    ))}
                </div>
                {selectedFactionFilters.size > 0 && (
                    <button
                        onClick={clearAllFactionFilters}
                        className="text-xs text-amber-400 hover:text-amber-300 underline"
                    >
                        Clear Faction Filters
                    </button>
                )}
            </div>
            
            {/* Faction Buff Filter Section */}
            <div>
                <div className="flex items-center space-x-3">
                    <input
                        type="checkbox"
                        id="faction-buff-filter"
                        checked={showOnlyFactionBuffHolders}
                        onChange={(e) => setShowOnlyFactionBuffHolders(e.target.checked)}
                        className="h-5 w-5 rounded border-slate-500 bg-slate-600 text-sky-600 focus:ring-sky-500"
                        aria-label="Filter by faction buff holders"
                    />
                    <label htmlFor="faction-buff-filter" className="text-sm text-slate-300">
                        초절 보유 영웅만 보기 (Show Faction Buff Holders Only)
                    </label>
                </div>
            </div>
        </div>


        {heroPool.length === 0 && ownedHeroIds.size > 0 && <p className="text-slate-400 italic text-center py-3">No heroes match your current filters, or all owned heroes are assigned.</p>}
        {ownedHeroIds.size === 0 && <p className="text-slate-400 text-center py-3">You haven't marked any heroes as owned. <button onClick={handleFullReset} className="text-sky-400 underline">Setup your roster</button>.</p>}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 max-h-[50vh] overflow-y-auto p-1 bg-slate-700/50 rounded-md shadow-inner">
          {heroPool.map(hero => {
            const isInATeam = isHeroInAnyTeam(hero.id);
            return (
              <HeroCard
                key={hero.id}
                hero={hero}
                isDisabled={isInATeam}
                onSelectForAssignment={toggleHeroForAssignment}
                isCurrentlySelectedForAssignment={selectedHeroIdsForAssignment.has(hero.id)}
              />
            );
          })}
        </div>
      </div>

      {showShareModal && <ShareLinkModal shareUrl={shareUrl} onClose={() => setShowShareModal(false)} />}
      {showSaveModal && <SaveCompositionModal onSave={handleSaveComposition} onClose={() => setShowSaveModal(false)} />}
      {showLoadModal && <LoadCompositionModal savedCompositions={savedCompositions} onLoad={loadComposition} onDelete={deleteSavedComposition} onClose={() => setShowLoadModal(false)} />}
    </div>
  );
};

export default HomePage;