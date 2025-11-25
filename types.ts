
export enum ViewState {
  HOME = 'HOME',
  WORKOUT = 'WORKOUT',
  STATS = 'STATS',
  SETTINGS = 'SETTINGS'
}

export type ExerciseCategory = 'warmup' | 'strength' | 'abs';
export type ExerciseMode = 'standard' | 'bike';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  mode: ExerciseMode;
  sets: number;
  reps: string; // "10", "Max", "10min"
  weightRecommendation?: string; 
  targetCadence?: string; // e.g. "90rpm"
  targetDuration?: string; // e.g. "10min"
  description?: string;
}

export interface DayPlan {
  id: string;
  name: string;
  duration: string;
  exercises: Exercise[];
}

export interface WorkoutLog {
  id: string;
  date: number;
  dayPlanId: string;
  exercises: ExerciseLog[];
  durationSeconds: number;
  notes?: string;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  sets: SetPerformance[];
}

export interface SetPerformance {
  setNumber: number;
  weight: number; // Used for generic load
  reps: number;   // Used for generic reps/duration
  
  // Specific fields
  cadence?: number; // RPM
  speed?: number;   // km/h
  distance?: number; // km
  heartRate?: number; // BPM
  
  completed: boolean;
}

export interface AppState {
  view: ViewState;
  plans: DayPlan[];
  logs: WorkoutLog[];
  activeWorkout: ActiveWorkoutState | null;
}

export interface ActiveWorkoutState {
  startTime: number;
  dayPlanId: string;
  currentExerciseIndex: number;
  logs: ExerciseLog[];
}