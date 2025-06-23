
import { Hero } from '../types';
import { GOOGLE_SHEET_URL_HEROES } from '../constants'; // Updated constant name
import Papa, { ParseResult, ParseError } from 'papaparse'; // Ensure ParseError is imported

// Placeholder data - Updated to use factionBuffValue
const placeholderHeroes: Hero[] = [
  { id: '1', name: '매튜', portrait_url: '', faction1: '빛의 군단', faction2: '주인공', factionBuffValue: '주인공' },
  { id: '2', name: '그레니어', portrait_url: '', faction1: '빛의 군단', factionBuffValue: '' },
  { id: '3', name: '알메다', portrait_url: '', faction1: '주인공', faction2: '공주 연맹', factionBuffValue: '' },
  { id: '4', name: '젤다', portrait_url: '', faction1: '제국의 빛', faction2: '어둠의 윤회', factionBuffValue: '제국의 빛' },
  { id: '5', name: '리아나', portrait_url: '', faction1: '빛의 군단', faction2: '공주 연맹', factionBuffValue: '' },
  { id: '6', name: '쉐리', portrait_url: '', faction1: '빛의 군단', faction2: '공주 연맹', faction3: '주인공', factionBuffValue: '빛의 군단' },
  { id: '7', name: '엘윈', portrait_url: '', faction1: '빛의 군단', faction2: '제국의 빛', faction3: '주인공', factionBuffValue: '주인공' },
  { id: '8', name: '레온', portrait_url: '', faction1: '제국의 빛', faction2: '전략의 대가', factionBuffValue: '제국의 빛' },
  { id: '9', name: '보젤', portrait_url: '', faction1: '어둠의 윤회', factionBuffValue: '어둠의 윤회' },
  { id: '10', name: '라나', portrait_url: '', faction1: '어둠의 윤회', faction2: '공주 연맹', factionBuffValue: '공주 연맹' },
];

export const fetchHeroes = async (): Promise<Hero[]> => { 
  console.log('Fetching heroes from:', GOOGLE_SHEET_URL_HEROES);
  try {
    const response = await fetch(GOOGLE_SHEET_URL_HEROES);
    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`, response);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const csvText = await response.text();
    if (!csvText || csvText.trim() === "") {
        console.warn("Fetched CSV text is empty.");
        throw new Error("Fetched CSV text is empty.");
    }

    return new Promise<Hero[]>((resolve, reject) => {
      Papa.parse<Record<string, any>>(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results: ParseResult<Record<string, any>>) => {
          if (results.errors && results.errors.length > 0) {
            console.warn("PapaParse encountered errors during parsing:", results.errors);
          }

          if (!results.data || results.data.length === 0) {
            console.warn("No data rows found in CSV by PapaParse.");
            reject(new Error("No data rows found in CSV after parsing. The CSV might be empty or malformed."));
            return;
          }

          const actualHeaders = results.meta.fields;
          if (!actualHeaders || actualHeaders.length === 0) {
            console.error("PapaParse could not determine headers from the CSV.");
            reject(new Error("Could not determine CSV headers. Check CSV format."));
            return;
          }

          const expectedHeaders = { 
            id: '번호', 
            name: '영웅', 
            portraitUrl: 'Portrait URL',
            faction1: '진영1',
            faction2: '진영2',
            faction3: '진영3',
            factionBuffValue: '초절' // Changed key and refers to the column with faction name for buff
          };
          let missingHeaderMessages: string[] = [];

          if (!actualHeaders.includes(expectedHeaders.id)) {
            missingHeaderMessages.push(`Expected ID header "${expectedHeaders.id}" not found.`);
          }
          if (!actualHeaders.includes(expectedHeaders.name)) {
            missingHeaderMessages.push(`Expected Name header "${expectedHeaders.name}" not found.`);
          }
          // Faction and 초절 headers are optional for parsing robustness

          if (missingHeaderMessages.length > 0) {
            const fullMessage = `Critical CSV headers missing. ${missingHeaderMessages.join(' ')} Actual headers found: [${actualHeaders.join(', ')}]`;
            console.error(fullMessage);
            reject(new Error(fullMessage));
            return;
          }

          const heroes = results.data.map((row: Record<string, any>) => {
            const idValue = row[expectedHeaders.id];
            const nameValue = row[expectedHeaders.name];
            const portraitUrlValue = actualHeaders.includes(expectedHeaders.portraitUrl) ? row[expectedHeaders.portraitUrl] : null;
            
            const faction1Value = actualHeaders.includes(expectedHeaders.faction1) ? String(row[expectedHeaders.faction1] || "").trim() : undefined;
            const faction2Value = actualHeaders.includes(expectedHeaders.faction2) ? String(row[expectedHeaders.faction2] || "").trim() : undefined;
            const faction3Value = actualHeaders.includes(expectedHeaders.faction3) ? String(row[expectedHeaders.faction3] || "").trim() : undefined;
            const factionBuffValueFromCsv = actualHeaders.includes(expectedHeaders.factionBuffValue) ? String(row[expectedHeaders.factionBuffValue] || "").trim() : "";

            return {
              id: String(idValue || "").trim(),
              name: String(nameValue || "").trim(),
              portrait_url: String(portraitUrlValue || '').trim(),
              faction1: faction1Value,
              faction2: faction2Value,
              faction3: faction3Value,
              factionBuffValue: factionBuffValueFromCsv, // Store the string value from "초절"
            };
          }).filter(hero => {
            return hero.id && hero.id.toLowerCase() !== "undefined" &&
                   hero.name && hero.name.toLowerCase() !== "undefined";
          });

          if (heroes.length === 0 && results.data.length > 0) {
            console.warn(
                "Parsed heroes array is empty after filtering, but CSV data was present.",
                "This could mean all rows missed required data (ID '번호', Name '영웅') or they were empty strings.",
                "First row from CSV before mapping (raw):", JSON.stringify(results.data[0]),
                "Headers used for mapping:", expectedHeaders
            );
            reject(new Error("Hero parsing resulted in an empty list. All rows might be missing critical data or failed validation."));
            return;
          }

          console.log(`Successfully parsed and validated ${heroes.length} heroes from first sheet. Expected headers used: ID='${expectedHeaders.id}', Name='${expectedHeaders.name}', Faction1='${expectedHeaders.faction1}', FactionBuffValue='${expectedHeaders.factionBuffValue}'. Actual CSV headers: [${actualHeaders.join(', ')}]`);
          resolve(heroes);
        },
        error: (err: any, file: any) => { // Changed types of err and file to any
          console.error('Error during Papa.parse CSV:', err.message, err);
          
          // 'file' parameter (the input csvText) is available here if needed for logging context, 
          // but we usually avoid logging the entire potentially large CSV string.
          console.error('Input source: CSV text string (content not logged here for brevity).'); 
          
          let errorMessage = `PapaParse failed: ${err.message}`;
          
          // Access ParseError properties directly as err is now 'any'
          // These properties are expected based on PapaParse's runtime behavior
          if (err.code) { 
            errorMessage += ` (Code: ${err.code})`;
          }
          if (err.row !== undefined) { // row is a 0-based number
            errorMessage += ` (Row: ${err.row})`;
          }
          if (err.type) { 
            errorMessage += ` (Type: ${err.type})`;
          }
          
          reject(new Error(errorMessage));
        }
      });
    });
  } catch (error) {
    console.error("Failed to fetch or parse heroes, using placeholder data as fallback:", error);
    return placeholderHeroes;
  }
};
