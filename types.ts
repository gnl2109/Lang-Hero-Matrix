export interface Hero {
  id: string;
  name: string;
  portrait_url: string;
  faction1?: string;
  faction2?: string;
  faction3?: string;
  factionBuffValue?: string; // Changed from hasFactionBuff: boolean
}

export interface God {
  id: string;
  name: string;
}

export enum TeamId {
  Team1 = "BATTLE_1",
  Team2 = "BATTLE_2",
  Team3 = "BATTLE_3",
  Team4 = "BATTLE_4",
}

export interface TeamData {
  heroes: string[]; // Stores hero IDs
  godId: string | null; // Stores selected God ID, or null if none
}

export type TeamComposition = Record<TeamId, TeamData>;

export interface SharedPayload {
  teamComposition: TeamComposition;
}

// Interfaces for Save/Load feature
export interface SavedCompositionState {
  teamComposition: TeamComposition;
  ownedHeroIds: string[]; // Storing as array for JSON serializability
}

export interface SavedCompositionItem {
  id: string; // Unique ID, e.g., timestamp
  name: string;
  timestamp: number;
  data: SavedCompositionState;
}

export interface AppContextType {
  allHeroes: Hero[];
  isLoadingHeroes: boolean;
  allGods: God[];
  isLoadingGods: boolean;
  ownedHeroIds: Set<string>;
  toggleOwnedHero: (heroId: string) => void;
  clearOwnedHeroSelections: () => void;
  teamComposition: TeamComposition;
  addHeroToTeam: (heroId: string, teamId: TeamId) => boolean;
  removeHeroFromTeam: (heroId: string, teamId: TeamId) => void;
  moveHeroBetweenTeams: (heroId: string, sourceTeamId: TeamId, targetTeamId: TeamId) => boolean;
  assignGodToTeam: (godId: string | null, teamId: TeamId) => void;
  clearTeam: (teamId: TeamId) => void;
  isHeroInAnyTeam: (heroId: string) => boolean;
  getHeroById: (heroId: string) => Hero | undefined;
  getGodById: (godId: string) => God | undefined;
  setSharedData: (payload: SharedPayload | null) => void;
  isRosterSetupComplete: boolean;
  completeRosterSetup: () => void;
  resetRosterAndTeams: () => void;
  editRoster: () => void; // Added function to re-enter roster setup
  isAppDragging: boolean;
  setIsAppDragging: (isDragging: boolean) => void; // Added for explicit control
  rosterViewKey: number; // Key to force HomePage re-mount

  // Save/Load Compositions
  savedCompositions: SavedCompositionItem[];
  saveCurrentComposition: (name: string) => void;
  loadComposition: (compositionId: string) => void;
  deleteSavedComposition: (compositionId: string) => void;

  // Touch Drag and Drop State
  touchDragItem: { heroId: string; sourceTeamId?: TeamId } | null;
  setTouchDragItem: (item: { heroId: string; sourceTeamId?: TeamId } | null) => void;
  touchDropTargetTeamId: TeamId | null;
  setTouchDropTargetTeamId: (teamId: TeamId | null) => void;
}