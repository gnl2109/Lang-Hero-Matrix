import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Removed Link, Added useNavigate
import { useAppContext } from '../context/AppContext';
import { decodeComposition } from '../utils/compositionEncoder';
import { Hero, TeamComposition, TeamId, God, SharedPayload } from '../types'; 
import HeroCard from '../components/HeroCard';
import { TEAM_IDS, TEAM_NAMES } from '../constants';

const ViewCompositionPage: React.FC = () => {
  const { encodedData } = useParams<{ encodedData: string }>();
  const { 
    allHeroes, 
    isLoadingHeroes, 
    getHeroById, 
    setSharedData,
    isLoadingGods, 
    getGodById,
    resetRosterAndTeams,
  } = useAppContext();

  const navigate = useNavigate(); // Hook for navigation

  const [displayedPayload, setDisplayedPayload] = useState<SharedPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoadingHeroes || isLoadingGods) return; 

    if (encodedData) {
      const decoded = decodeComposition(encodedData);
      if (decoded && decoded.teamComposition) {
        setSharedData(decoded); 
        setDisplayedPayload(decoded); 
      } else {
        setError("Invalid or corrupted share link.");
        setSharedData(null); 
      }
    } else {
      setError("No composition data found in URL.");
      setSharedData(null); 
    }
  }, [encodedData, isLoadingHeroes, isLoadingGods, allHeroes, setSharedData, getGodById, getHeroById]);


  if (isLoadingHeroes || isLoadingGods) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-sky-300">Loading data...</div>;
  }

  const handleNavigateToPlanner = () => {
    resetRosterAndTeams(); // Call the reset function from context
    navigate('/'); // Programmatically navigate to the home page
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Error</h1>
        <p className="text-slate-300 mb-6">{error}</p>
        <button 
          onClick={handleNavigateToPlanner}
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          Go to Planner
        </button>
      </div>
    );
  }

  if (!displayedPayload || !displayedPayload.teamComposition) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-sky-300">Loading composition...</div>;
  }

  const { teamComposition } = displayedPayload;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center text-sky-400 mb-8">Shared Team Composition</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {TEAM_IDS.map(teamId => {
          const teamData = teamComposition[teamId];
          if (!teamData) return null;

          const heroIdsInTeam = teamData.heroes || [];
          const heroesToDisplay: Hero[] = heroIdsInTeam.map(id => getHeroById(id)).filter(Boolean) as Hero[];
          const selectedGod: God | undefined = teamData.godId ? getGodById(teamData.godId) : undefined;

          return (
            <div key={teamId} className="bg-slate-800 p-4 rounded-lg shadow-xl">
              <h3 className="text-xl font-bold text-sky-300 mb-2 border-b-2 border-slate-700 pb-2">{TEAM_NAMES[teamId]}</h3>
              
              {selectedGod && (
                <div className="mb-3 p-2 bg-slate-700 rounded">
                  <p className="text-sm font-semibold text-amber-300">God: {selectedGod.name}</p>
                </div>
              )}
              {!selectedGod && (
                 <div className="mb-3 p-2 bg-slate-700 rounded">
                  <p className="text-sm text-slate-400 italic">No God selected.</p>
                </div>
              )}

              {heroesToDisplay.length > 0 ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2">
                  {heroesToDisplay.map(hero => (
                    <HeroCard key={hero.id} hero={hero} />
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">No heroes assigned to this team.</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center mt-12">
        <button
          onClick={handleNavigateToPlanner}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors duration-150"
        >
          Create Your Own Team Plan!
        </button>
      </div>
    </div>
  );
};

export default ViewCompositionPage;
