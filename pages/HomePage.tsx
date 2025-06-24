
import React, { useState, useMemo, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import HeroCard from '../components/HeroCard';
import BattleTeamSlot from '../components/BattleTeamSlot';
import ShareLinkModal from '../components/ShareLinkModal';
import SaveCompositionModal from '../components/SaveCompositionModal';
import LoadCompositionModal from '../components/LoadCompositionModal';
import { TEAM_IDS } from '../constants';
import { encodeComposition } from '../utils/compositionEncoder';
import { SharedPayload, TeamId } from '../types';

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
    teamComposition,
    addHeroToTeam, // Now correctly from useAppContext
    savedCompositions,
    saveCurrentComposition,
    loadComposition,
    deleteSavedComposition,
  } = useAppContext();

  const [filterText, setFilterText] = useState('');
  const [rosterFilterText, setRosterFilterText] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  
  const [selectedHeroIdsForAssignment, setSelectedHeroIdsForAssignment] = useState<Set<string>>(new Set());

  const toggleHeroForAssignment = useCallback((heroId: string) => {
    // Prevent selecting heroes already in a team for multi-add.
    // The HeroCard's isDisabled visual state should already reflect this.
    // This is an additional safeguard.
    if (isHeroInAnyTeam(heroId)) {
        // If an assigned hero is somehow clicked for selection, ensure it's not added.
        setSelectedHeroIdsForAssignment(prev => {
            const newSet = new Set(prev);
            newSet.delete(heroId); // Remove if it was there
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
      // addHeroToTeam returns true on success, false if team is full or hero is already in another team.
      const success = addHeroToTeam(heroId, teamId);
      if (success) {
        successfullyAddedIds.add(heroId);
      }
      // Check if team is full to potentially break early, though addHeroToTeam handles this.
      // Assuming MAX_HEROES_PER_TEAM is handled within addHeroToTeam implicitly by returning false.
      const currentTeam = teamComposition[teamId]; // Get latest team state
      if (currentTeam && currentTeam.heroes.length >= 8) { // Assuming MAX_HEROES_PER_TEAM = 8
         // If after adding a hero, the team becomes full, we might not need to iterate further
         // for *this specific team*. However, addHeroToTeam will fail for subsequent heroes anyway.
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
  };
  
  const clearCurrentlySelectedHeroesForAssignment = () => {
    setSelectedHeroIdsForAssignment(new Set());
  };

  const handleSaveComposition = (name: string) => {
    saveCurrentComposition(name);
  };

  const heroPool = useMemo(() => {
    return allHeroes
      .filter(hero => ownedHeroIds.has(hero.id))
      .filter(hero => hero.name.toLowerCase().includes(filterText.toLowerCase()));
  }, [allHeroes, ownedHeroIds, filterText]);

  const filteredAllHeroesForRosterSetup = useMemo(() => {
    if (!rosterFilterText) return allHeroes;
    return allHeroes.filter(hero =>
      hero.name.toLowerCase().includes(rosterFilterText.toLowerCase())
    );
  }, [allHeroes, rosterFilterText]);

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

        {allHeroes.length === 0 && <p className="text-center text-amber-400">No heroes available. Check data source.</p>}
        {filteredAllHeroesForRosterSetup.length === 0 && rosterFilterText && allHeroes.length > 0 && (
            <p className="text-center text-slate-400 my-4">No heroes match your search term "{rosterFilterText}".</p>
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

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
            <h1 className="text-4xl font-bold text-sky-400">원하는 영웅 조합을 만들어보세요</h1>
        </div>
        <div className="flex flex-wrap gap-2">
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

      <div>
        <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-semibold text-sky-300">My Hero Pool</h2>
            {selectedHeroIdsForAssignment.size > 0 && (
                <button 
                    onClick={clearCurrentlySelectedHeroesForAssignment} 
                    className="text-sm text-amber-400 hover:text-amber-300 underline"
                >
                    Clear {selectedHeroIdsForAssignment.size} Selected Heroes
                </button>
            )}
        </div>
        <input
          type="text"
          placeholder="Filter heroes..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full md:w-1/2 bg-slate-700 text-slate-100 border border-slate-600 rounded p-2 mb-4 focus:ring-sky-500 focus:border-sky-500"
          aria-label="Filter owned heroes"
        />
        {heroPool.length === 0 && ownedHeroIds.size > 0 && <p className="text-slate-400">No heroes match your filter, or all owned heroes are assigned.</p>}
        {ownedHeroIds.size === 0 && <p className="text-slate-400">You haven't marked any heroes as owned. <button onClick={handleFullReset} className="text-sky-400 underline">Setup your roster</button>.</p>}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 max-h-[50vh] overflow-y-auto p-2 bg-slate-800 rounded-lg shadow-inner">
          {heroPool.map(hero => {
            const isInATeam = isHeroInAnyTeam(hero.id);
            return (
              <HeroCard
                key={hero.id}
                hero={hero}
                isDisabled={isInATeam} // Visually disable if in a team
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
