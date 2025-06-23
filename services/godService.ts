
import { God } from '../types';
// GOOGLE_SHEET_URL_GODS and PapaParse are no longer needed for gods

// New hardcoded list of Gods
const hardcodedGods: God[] = [
    { id: 'g1', name: '토르' },
    { id: 'g2', name: '프레이야' },
    { id: 'g3', name: '헤임달' },
    { id: 'g4', name: '발두르' },
    { id: 'g5', name: '오딘' },
    { id: 'g6', name: '프리가' },
    { id: 'g7', name: '티르' },
    { id: 'g8', name: '로키' },
    { id: 'g9', name: '비다르' },
];

export const fetchGods = async (): Promise<God[]> => {
  console.log('Using hardcoded God list.');
  // Simulate async operation for consistency, though it's now synchronous data
  return Promise.resolve(hardcodedGods); 
};
