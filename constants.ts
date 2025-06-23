import { TeamId } from './types';

export const GOOGLE_SHEET_URL_HEROES = 'https://docs.google.com/spreadsheets/d/1BGWX21j3fiBwGJzX5PJDAxDBP86osw0B2U0iDxWnpaQ/export?format=csv'; // Assuming GID 0 or first sheet for heroes
export const GOOGLE_SHEET_URL_GODS = 'https://docs.google.com/spreadsheets/d/1BGWX21j3fiBwGJzX5PJDAxDBP86osw0B2U0iDxWnpaQ/export?format=csv&gid=1730997135';

export const LOCAL_STORAGE_OWNED_HEROES_KEY = 'polarisPlanner_ownedHeroes';
export const LOCAL_STORAGE_ROSTER_SETUP_COMPLETE_KEY = 'polarisPlanner_rosterSetupComplete';
export const LOCAL_STORAGE_SAVED_COMPOSITIONS_KEY = 'polarisPlanner_savedCompositions'; // New key

export const TEAM_IDS: TeamId[] = [TeamId.Team1, TeamId.Team2, TeamId.Team3, TeamId.Team4];

export const TEAM_NAMES: Record<TeamId, string> = {
  [TeamId.Team1]: "Battle Team 1",
  [TeamId.Team2]: "Battle Team 2",
  [TeamId.Team3]: "Battle Team 3",
  [TeamId.Team4]: "Battle Team 4",
};
