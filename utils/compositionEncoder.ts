import { TeamComposition, TeamId, TeamData, SharedPayload } from '../types';
import { TEAM_IDS } from '../constants';

export const encodeComposition = (payload: SharedPayload): string => {
  try {
    // Ensure the teamComposition within the payload is well-formed.
    const validTeamComposition: TeamComposition = TEAM_IDS.reduce((acc, teamId) => {
      acc[teamId] = payload.teamComposition[teamId] || { heroes: [], godId: null };
      return acc;
    }, {} as TeamComposition);

    // Payload now directly reflects the simplified SharedPayload structure
    const fullPayload: SharedPayload = {
        teamComposition: validTeamComposition
    };

    const jsonString = JSON.stringify(fullPayload);
    const base64String = btoa(jsonString);
    return base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (error) {
    console.error("Error encoding shared payload:", error);
    return "";
  }
};

export const decodeComposition = (encodedString: string): SharedPayload | null => {
  try {
    let base64String = encodedString.replace(/-/g, '+').replace(/_/g, '/');
    while (base64String.length % 4) {
      base64String += '=';
    }
    const jsonString = atob(base64String);
    const parsed = JSON.parse(jsonString) as Partial<SharedPayload>; // Expecting object with teamComposition
    
    if (!parsed || typeof parsed.teamComposition !== 'object') {
        console.error("Decoded data is not a valid SharedPayload structure (missing teamComposition).");
        return null;
    }

    const decodedTeamComposition = parsed.teamComposition || {};

    const fullTeamComposition = TEAM_IDS.reduce((acc, teamId) => {
        const teamData = (decodedTeamComposition as Partial<Record<TeamId, Partial<TeamData>>>)[teamId];
        acc[teamId] = {
            heroes: teamData?.heroes || [],
            godId: teamData?.godId || null,
        };
        return acc;
    }, {} as TeamComposition);

    return { // Return simplified SharedPayload
        teamComposition: fullTeamComposition
    };

  } catch (error) {
    console.error("Error decoding shared payload:", error);
    return null;
  }
};