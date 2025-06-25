import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Hero, God, TeamComposition, AppContextType, TeamId, SharedPayload, SavedCompositionItem, SavedCompositionState } from '../types';
import { fetchHeroes as fetchHeroesService } from '../services/heroService';
import { fetchGods as fetchGodsService } from '../services/godService';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { LOCAL_STORAGE_OWNED_HEROES_KEY, TEAM_IDS, LOCAL_STORAGE_ROSTER_SETUP_COMPLETE_KEY, LOCAL_STORAGE_SAVED_COMPOSITIONS_KEY } from '../constants';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [allHeroes, setAllHeroes] = useState<Hero[]>([]);
  const [isLoadingHeroes, setIsLoadingHeroes] = useState(true);
  const [allGods, setAllGods] = useState<God[]>([]);
  const [isLoadingGods, setIsLoadingGods] = useState(true);
  const [isAppDragging, setIsAppDragging] = useState(false);

  const [storedOwnedHeroIds, setStoredOwnedHeroIds] = useLocalStorage<string[]>(LOCAL_STORAGE_OWNED_HEROES_KEY, []);
  const [ownedHeroIds, setOwnedHeroIds] = useState(new Set(storedOwnedHeroIds));

  const [isRosterSetupComplete, setIsRosterSetupComplete] = useLocalStorage<boolean>(LOCAL_STORAGE_ROSTER_SETUP_COMPLETE_KEY, false);
  const [rosterViewKey, setRosterViewKey] = useState(0); // Key for re-mounting HomePage

  const initialTeamComposition = TEAM_IDS.reduce((acc, teamId) => {
    acc[teamId] = { heroes: [], godId: null };
    return acc;
  }, {} as TeamComposition);
  const [teamComposition, setTeamComposition] = useState<TeamComposition>(initialTeamComposition);
  const MAX_HEROES_PER_TEAM = 8;

  // Saved Compositions
  const [savedCompositions, setSavedCompositions] = useLocalStorage<SavedCompositionItem[]>(LOCAL_STORAGE_SAVED_COMPOSITIONS_KEY, []);

  useEffect(() => {
    const loadAppData = async () => {
      setIsLoadingHeroes(true);
      setIsLoadingGods(true);
      try {
        const [heroesData, godsData] = await Promise.all([
          fetchHeroesService(),
          fetchGodsService()
        ]);
        setAllHeroes(heroesData);
        setAllGods(godsData);
      } catch (error) {
        console.error("Failed to load app data (heroes or gods):", error);
      }
      setIsLoadingHeroes(false);
      setIsLoadingGods(false);
    };
    loadAppData();
  }, []);

  useEffect(() => {
    setStoredOwnedHeroIds(Array.from(ownedHeroIds));
  }, [ownedHeroIds, setStoredOwnedHeroIds]);

  useEffect(() => {
    const handleGlobalDragStart = () => setIsAppDragging(true);
    const handleGlobalDragEnd = () => setIsAppDragging(false);

    document.addEventListener('dragstart', handleGlobalDragStart);
    document.addEventListener('dragend', handleGlobalDragEnd);
    document.addEventListener('drop', handleGlobalDragEnd);

    return () => {
      document.removeEventListener('dragstart', handleGlobalDragStart);
      document.removeEventListener('dragend', handleGlobalDragEnd);
      document.removeEventListener('drop', handleGlobalDragEnd);
    };
  }, []);

  const toggleOwnedHero = useCallback((heroId: string) => {
    setOwnedHeroIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(heroId)) {
        newSet.delete(heroId);
      } else {
        newSet.add(heroId);
      }
      return newSet;
    });
  }, []);

  const clearOwnedHeroSelections = useCallback(() => {
    setOwnedHeroIds(new Set());
  }, []);

  const isHeroInAnyTeam = useCallback((heroId: string) => {
    return Object.values(teamComposition).some(teamData => teamData.heroes.includes(heroId));
  }, [teamComposition]);

  const addHeroToTeam = useCallback((heroId: string, teamId: TeamId): boolean => {
    if (isHeroInAnyTeam(heroId)) {
      console.warn(`Hero ${heroId} is already in a team.`);
      return false;
    }
    if (teamComposition[teamId].heroes.length >= MAX_HEROES_PER_TEAM) {
      console.warn(`Team ${teamId} is full.`);
      return false;
    }
    setTeamComposition(prev => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        heroes: [...prev[teamId].heroes, heroId]
      }
    }));
    return true;
  }, [isHeroInAnyTeam, teamComposition]);

  const removeHeroFromTeam = useCallback((heroId: string, teamId: TeamId) => {
    setTeamComposition(prev => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        heroes: prev[teamId].heroes.filter(id => id !== heroId)
      }
    }));
  }, []);

  const moveHeroBetweenTeams = useCallback((heroId: string, sourceTeamId: TeamId, targetTeamId: TeamId): boolean => {
    if (sourceTeamId === targetTeamId) return false;
    const targetTeam = teamComposition[targetTeamId];
    if (targetTeam.heroes.length >= MAX_HEROES_PER_TEAM) {
      console.warn(`Target team ${targetTeamId} is full.`);
      return false;
    }
    if (!teamComposition[sourceTeamId].heroes.includes(heroId)) {
      console.warn(`Hero ${heroId} not found in source team ${sourceTeamId}.`);
      return false;
    }
    setTeamComposition(prev => {
      const newComposition = { ...prev };
      newComposition[sourceTeamId] = {
        ...newComposition[sourceTeamId],
        heroes: newComposition[sourceTeamId].heroes.filter(id => id !== heroId)
      };
      newComposition[targetTeamId] = {
        ...newComposition[targetTeamId],
        heroes: [...newComposition[targetTeamId].heroes, heroId]
      };
      return newComposition;
    });
    return true;
  }, [teamComposition]);

  const assignGodToTeam = useCallback((godId: string | null, teamId: TeamId) => {
    setTeamComposition(prev => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        godId: godId
      }
    }));
  }, []);

  const clearTeam = useCallback((teamId: TeamId) => {
    setTeamComposition(prev => ({
      ...prev,
      [teamId]: {
        heroes: [],
        godId: null
      }
    }));
  }, []);

  const getHeroById = useCallback((heroId: string): Hero | undefined => {
    return allHeroes.find(hero => hero.id === heroId);
  }, [allHeroes]);

  const getGodById = useCallback((godId: string): God | undefined => {
    return allGods.find(god => god.id === godId);
  }, [allGods]);

  const setSharedData = useCallback((payload: SharedPayload | null) => {
    if (!payload || !payload.teamComposition) {
      setTeamComposition(initialTeamComposition);
      return;
    }
    const { teamComposition: sharedTeamComposition } = payload;
    const validComposition = TEAM_IDS.reduce((acc, currentTeamId) => {
      const teamData = sharedTeamComposition ? sharedTeamComposition[currentTeamId] : undefined;
      const validHeroes = teamData?.heroes?.filter(id => allHeroes.some(h => h.id === id)) || [];
      const validGodId = teamData?.godId && allGods.some(g => g.id === teamData.godId) ? teamData.godId : null;
      acc[currentTeamId] = { heroes: validHeroes, godId: validGodId };
      return acc;
    }, {} as TeamComposition);
    setTeamComposition(validComposition);
  }, [allHeroes, allGods, initialTeamComposition]);

  const completeRosterSetup = useCallback(() => {
    setIsRosterSetupComplete(true);
  }, [setIsRosterSetupComplete]);

  const resetRosterAndTeams = useCallback(() => {
    setOwnedHeroIds(new Set());
    setTeamComposition(initialTeamComposition);
    setIsRosterSetupComplete(false);
    setRosterViewKey(prevKey => prevKey + 1); // Increment key to force HomePage re-mount
  }, [setIsRosterSetupComplete, initialTeamComposition]);

  const editRoster = useCallback(() => {
    setIsRosterSetupComplete(false); // Allows returning to roster setup view
    // Optionally, increment rosterViewKey here as well if a full remount is desired when editing roster
    // setRosterViewKey(prevKey => prevKey + 1); 
  }, [setIsRosterSetupComplete]);

  const saveCurrentComposition = useCallback((name: string) => {
    const currentOwnedIds = Array.from(ownedHeroIds);
    const compositionToSave: SavedCompositionState = {
      teamComposition: JSON.parse(JSON.stringify(teamComposition)), // Deep copy
      ownedHeroIds: currentOwnedIds,
    };
    const newSavedItem: SavedCompositionItem = {
      id: `comp-${Date.now()}`,
      name,
      timestamp: Date.now(),
      data: compositionToSave,
    };
    setSavedCompositions(prev => [...prev, newSavedItem].sort((a,b) => b.timestamp - a.timestamp));
  }, [teamComposition, ownedHeroIds, setSavedCompositions]);

  const loadComposition = useCallback((compositionId: string) => {
    const itemToLoad = savedCompositions.find(item => item.id === compositionId);
    if (itemToLoad) {
      setTeamComposition(itemToLoad.data.teamComposition);
      setOwnedHeroIds(new Set(itemToLoad.data.ownedHeroIds));
      setIsRosterSetupComplete(true); // Ensure app state reflects loaded roster
      setRosterViewKey(prevKey => prevKey + 1); // Also remount to ensure clean state
    }
  }, [savedCompositions, setTeamComposition, setOwnedHeroIds, setIsRosterSetupComplete]);

  const deleteSavedComposition = useCallback((compositionId: string) => {
    setSavedCompositions(prev => prev.filter(item => item.id !== compositionId));
  }, [setSavedCompositions]);


  const contextValue: AppContextType = {
    allHeroes,
    isLoadingHeroes,
    allGods,
    isLoadingGods,
    isAppDragging,
    ownedHeroIds,
    toggleOwnedHero,
    clearOwnedHeroSelections,
    teamComposition,
    addHeroToTeam,
    removeHeroFromTeam,
    moveHeroBetweenTeams,
    assignGodToTeam,
    clearTeam,
    isHeroInAnyTeam,
    getHeroById,
    getGodById,
    setSharedData,
    isRosterSetupComplete,
    completeRosterSetup,
    resetRosterAndTeams,
    editRoster,
    rosterViewKey, // Provide the key in context
    savedCompositions,
    saveCurrentComposition,
    loadComposition,
    deleteSavedComposition,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};