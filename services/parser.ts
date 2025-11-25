
import { DayPlan, Exercise, ExerciseMode } from '../types';

// Helper to extract number of sets
const parseSetsCount = (detailString: string, defaultSets: number = 3): number => {
  const match = detailString.match(/(\d+)\s*(?:série|serie|séries|series)/i);
  return match ? parseInt(match[1]) : defaultSets;
};

// Helper to extract reps or duration string
const parseReps = (detailString: string): string => {
  // Check for time first (e.g. "10min")
  const timeMatch = detailString.match(/(\d+)\s*(?:min|minutes)/i);
  if (timeMatch) return `${timeMatch[1]}min`;

  // Fallback to reps
  const repMatch = detailString.match(/(\d+(?:-\d+)?)\s*(?:répétition|rep|repetition)/i);
  return repMatch ? repMatch[1] : '10';
};

const parseCadence = (detailString: string): string | undefined => {
    const match = detailString.match(/(\d+)\s*rpm/i);
    return match ? match[1] : undefined;
};

export const parseCSV = (csvText: string): DayPlan[] => {
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  const plans: DayPlan[] = [];

  const startIdx = lines[0].toLowerCase().includes('type') ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    
    if (cols.length < 5) continue;

    const planName = cols[0] || `Programme ${i}`;
    const duration = cols[1] || '1h';
    const warmupDetails = cols[3] || 'Aucun échauffement précisé';
    const absDetails = cols[16] || '';
    
    // Detect Bike Mode (Robust regex)
    const isBike = /vélo|velo|hometrainer|home-trainer|cycling|cyclisme/i.test(planName);
    const mode: ExerciseMode = isBike ? 'bike' : 'standard';

    const exercises: Exercise[] = [];
    const planId = planName.toLowerCase().replace(/\s+/g, '-') + `-${i}`;

    // 1. WARMUP
    // For bike, we treat warmup almost like an exercise if inputs are needed
    exercises.push({
        id: `${planId}-warmup`,
        name: "Échauffement",
        category: 'warmup',
        mode: mode,
        sets: 1,
        reps: isBike ? '10min' : '0',
        targetDuration: isBike ? '10' : undefined,
        targetCadence: isBike ? parseCadence(warmupDetails) : undefined,
        description: warmupDetails
    });

    // 2. EXERCISES 1 to 6
    for (let j = 0; j < 6; j++) {
        const nameIdx = 4 + (j * 2);
        const detailIdx = 5 + (j * 2);

        if (cols[nameIdx] && cols[nameIdx].trim() !== '') {
            const exName = cols[nameIdx];
            const exDetails = cols[detailIdx] || '';
            
            // For Bike mode, even if description says "4 series", we want 1 single input card
            // So we force sets: 1 for logic, but keep description for info.
            const setsCount = isBike ? 1 : parseSetsCount(exDetails, 3);

            exercises.push({
                id: `${planId}-ex-${j+1}`,
                name: exName,
                category: 'strength',
                mode: mode,
                sets: setsCount, 
                reps: parseReps(exDetails),
                targetCadence: isBike ? parseCadence(exDetails) : undefined,
                description: exDetails
            });
        }
    }

    // 3. ABS
    if (absDetails && absDetails.trim() !== '') {
        exercises.push({
            id: `${planId}-abs`,
            name: "Abdominaux",
            category: 'abs',
            mode: 'standard', // Abs are always standard valid/check
            sets: 1,
            reps: 'Max',
            description: absDetails
        });
    }

    plans.push({
        id: planId,
        name: planName,
        duration: duration,
        exercises: exercises
    });
  }

  return plans;
};

export const SAMPLE_CSV = `Type,Durée,Echauffement,Exercices échauffement,Exercice 1,Série Ex 1,Exercice 2,Série Ex 2,Exercice 3,Série Ex 3,Exercice 4,Série Ex 4,Exercice 5,Série Ex 5,Exercice 6,Série Ex 6,Abdominaux
Musculation 1,1h15,Echauffement,Rameur 10min + Mobilisations articulaires,Développé Couché,3 séries de 10 répétitions (1min récup),Squat,3 séries de 10 répétitions (1m30 récup),Tirage Poitrine,3 séries de 12 répétitions (1min récup),Développé Militaire,3 séries de 10 répétitions (1min récup),Leg Extension,3 séries de 15 répétitions,Curl Biceps,3 séries de 12 répétitions,Gainage face + côtés (3 tours)
Hometrainer Force,50min,Echauffement,10min souple à 90rpm,Force sous-max,4 séries de 5min à 60rpm,Vélocité,4 séries de 2min à 110rpm,,,,,,,,Abdos crunchs 3x20
Vélo Route,1h30,Echauffement,20min progressif,Endurance,1h à 140bpm,,,,,,,,,,Etirements`;
