import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ViewState, DayPlan, WorkoutLog, Exercise, SetPerformance } from './types';
import { TEButton, TECard, TEInput, TEValueDisplay, TEIcon, TENumberInput } from './components/TEComponents';
import { parseCSV, SAMPLE_CSV } from './services/parser';
import { Timer } from './components/Timer';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { GoogleGenAI } from "@google/genai";

// --- Sub-components for cleaner App.tsx ---

// 1. SETTINGS VIEW
const SettingsView: React.FC<{ 
  onImport: (data: DayPlan[]) => void, 
  onClear: () => void,
  hasData: boolean 
}> = ({ onImport, onClear, hasData }) => {
  const [csvContent, setCsvContent] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [userGoal, setUserGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvContent(text);
      };
      reader.readAsText(file);
    }
  };

  const processImport = () => {
    if (!csvContent) return;
    const plans = parseCSV(csvContent);
    if (plans.length > 0) {
        onImport(plans);
        alert(`${plans.length} programmes importés avec succès !`);
    } else {
        alert("Erreur: Impossible de lire le CSV. Vérifiez le format.");
    }
  };

  const generateWithAI = async () => {
    if (!userGoal.trim()) return;
    
    // SAFE API KEY ACCESS FOR VERCEL/VITE
    let apiKey = '';
    try {
        // @ts-ignore
        if (import.meta && import.meta.env && import.meta.env.VITE_API_KEY) {
            // @ts-ignore
            apiKey = import.meta.env.VITE_API_KEY;
        } else if (process.env.API_KEY) {
            apiKey = process.env.API_KEY;
        }
    } catch (e) {
        console.warn("Could not read env vars directly, checking process...");
        if (typeof process !== 'undefined' && process.env) {
            apiKey = process.env.API_KEY || '';
        }
    }

    if (!apiKey) {
        alert("Clé API manquante. Veuillez configurer VITE_API_KEY sur Vercel.");
        return;
    }

    setIsGenerating(true);
    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        const csvStructure = `Type,Durée,Echauffement,Exercices échauffement,Exercice 1,Série Ex 1,Exercice 2,Série Ex 2,Exercice 3,Série Ex 3,Exercice 4,Série Ex 4,Exercice 5,Série Ex 5,Exercice 6,Série Ex 6,Abdominaux`;
        
        const prompt = `
        Génère un programme sportif au format CSV correspondant à cette demande : "${userGoal}".
        
        RÈGLES STRICTES :
        1. Le CSV DOIT avoir exactement ces colonnes, séparées par des virgules : ${csvStructure}
        2. Ne mets PAS de code block markdown (pas de \`\`\`). Renvoie UNIQUEMENT le texte CSV brut.
        3. Langue : Français.
        4. Inclus au moins un échauffement, 3 à 6 exercices, et des abdos.
        5. Pour les séries (Colonnes "Série Ex X"), utilise le format : "3 séries de 10 répétitions" ou "3 séries de 10 reps (1min récup)".
        6. Si c'est du vélo, utilise dans le titre (Colonne "Type") le mot "Vélo" ou "Hometrainer".
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const text = response.text;
        if (text) {
            setCsvContent(text.trim());
            setShowAiModal(false);
            setUserGoal('');
        }
    } catch (error) {
        console.error("AI Error", error);
        alert("Erreur lors de la génération. Veuillez réessayer.");
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 relative">
      
      {/* AI MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-te-dark/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-te-base w-full max-w-md rounded-2xl p-6 shadow-neu-out border border-white/20">
                <div className="flex items-center gap-3 mb-6 text-te-orange">
                    <TEIcon.Magic size={24} />
                    <h3 className="font-bold text-lg uppercase tracking-wider">Coach IA</h3>
                </div>
                
                <div className="space-y-4 mb-6">
                    <p className="text-xs font-mono text-te-dim">Décrivez votre objectif (ex: Prise de masse sur 3 jours, Séance HIIT 20min, Cardio vélo débutant...)</p>
                    <textarea 
                        autoFocus
                        className="w-full h-24 bg-te-base shadow-neu-pressed rounded-xl p-4 font-mono text-sm outline-none focus:text-te-orange"
                        placeholder="Votre demande..."
                        value={userGoal}
                        onChange={(e) => setUserGoal(e.target.value)}
                    />
                </div>

                <div className="flex flex-col gap-3">
                    <TEButton 
                        onClick={generateWithAI} 
                        disabled={!userGoal || isGenerating}
                        className="w-full relative overflow-hidden"
                    >
                        {isGenerating ? (
                            <span className="animate-pulse">Génération en cours...</span>
                        ) : (
                            <span className="flex items-center gap-2">Générer le programme <TEIcon.Magic size={16}/></span>
                        )}
                    </TEButton>
                    
                    <button 
                        onClick={() => {
                            setCsvContent(SAMPLE_CSV);
                            setShowAiModal(false);
                        }}
                        className="text-[10px] text-te-dim uppercase hover:text-te-dark underline decoration-dotted"
                    >
                        Ou charger l'exemple par défaut
                    </button>
                    
                    <button 
                        onClick={() => setShowAiModal(false)}
                        className="py-2 text-xs font-mono text-te-dim hover:text-red-500 transition-colors"
                    >
                        Annuler
                    </button>
                </div>
            </div>
        </div>
      )}

      <TECard title="Import de Données">
        <div className="space-y-6">
          <div className="p-6 bg-te-base shadow-neu-pressed rounded-xl flex justify-center">
            <label className="cursor-pointer group">
              <div className="flex flex-col items-center gap-3 text-te-dim group-hover:text-te-orange transition-colors">
                <div className="w-12 h-12 rounded-full bg-te-base shadow-neu-out-sm flex items-center justify-center group-hover:shadow-neu-pressed transition-all">
                    <TEIcon.Upload size={20} />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider">Choisir CSV</span>
              </div>
              <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
          
          <textarea 
            className="w-full h-32 p-4 bg-te-base shadow-neu-pressed rounded-xl font-mono text-xs text-te-dark resize-none outline-none focus:text-te-dark/80"
            placeholder="Ou coller le contenu CSV ici..."
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
          />
          
          <div className="flex gap-4 justify-end">
            <TEButton variant="secondary" onClick={() => setShowAiModal(true)}>
                <span className="flex items-center gap-2"><TEIcon.Magic size={14}/> Exemple</span>
            </TEButton>
            <TEButton onClick={processImport} disabled={!csvContent}>Importer</TEButton>
          </div>
        </div>
      </TECard>

      {hasData && (
        <TECard title="Zone de Danger">
          <TEButton variant="secondary" className="w-full text-red-500 hover:text-red-600 shadow-neu-out-sm active:shadow-neu-pressed-sm" onClick={onClear}>
            Réinitialiser les programmes CSV
          </TEButton>
          <p className="mt-4 text-center text-[10px] text-te-dim uppercase">Note: Cela supprimera uniquement les programmes importés. L'historique des séances sera conservé.</p>
        </TECard>
      )}
    </div>
  );
};

// 2. STATS VIEW
const StatsView: React.FC<{ logs: WorkoutLog[] }> = ({ logs }) => {
  const chartData = useMemo(() => {
    if (logs.length === 0) return [];
    
    return logs.slice(-7).map(log => {
        let volume = 0;
        log.exercises.forEach(ex => {
            ex.sets.forEach(s => {
                if(s.completed) volume += (s.weight * s.reps);
            });
        });

        return {
            date: new Date(log.date).toLocaleDateString('fr-FR', { weekday: 'short' }),
            volume: volume,
            duration: Math.round(log.durationSeconds / 60)
        };
    });
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-te-dim font-mono text-sm text-center">
        <div className="w-20 h-20 rounded-full bg-te-base shadow-neu-out mb-6 flex items-center justify-center">
            <TEIcon.Stats size={32} className="opacity-30" />
        </div>
        <p>AUCUNE DONNÉE ENREGISTRÉE</p>
        <p className="text-xs mt-2 opacity-50">TERMINEZ UNE SÉANCE POUR VOIR VOS STATS</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-2 gap-6">
        <TECard>
           <TEValueDisplay label="Total Séances" value={logs.length} />
        </TECard>
        <TECard>
           <TEValueDisplay label="Dernière" value={new Date(logs[logs.length-1].date).toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit'})} />
        </TECard>
      </div>

      <TECard title="Volume (kg)">
        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#CDCAC2" opacity={0.4} vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{fontSize: 10, fontFamily: 'DM Mono', fill: '#8A8680'}} 
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{backgroundColor: '#EFEBE2', border: 'none', borderRadius: '12px', boxShadow: '5px 5px 10px rgb(205,202,194,0.6)', fontFamily: 'DM Mono', fontSize: '12px', color: '#2D3238'}}
                itemStyle={{color: '#FF5800'}}
                cursor={{stroke: '#FF5800', strokeWidth: 1}}
              />
              <Line 
                type="monotone" 
                dataKey="volume" 
                stroke="#FF5800" 
                strokeWidth={3} 
                dot={{fill: '#EFEBE2', stroke: '#FF5800', strokeWidth: 3, r: 4}} 
                activeDot={{r: 6, fill: '#FF5800', stroke: '#fff', strokeWidth: 2}}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </TECard>
    </div>
  );
};

// 3. WORKOUT SESSION VIEW
const WorkoutSessionView: React.FC<{ 
  plan: DayPlan, 
  onFinish: (log: WorkoutLog) => void,
  onCancel: () => void 
}> = ({ plan, onFinish, onCancel }) => {
  const [startTime] = useState(Date.now());
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  
  // sessionData: { [exerciseIndex]: SetPerformance[] }
  const [sessionData, setSessionData] = useState<{ [key: number]: SetPerformance[] }>({});
  const activeExerciseRef = useRef<HTMLDivElement>(null);

  // Initialize data
  useEffect(() => {
    const initialData: { [key: number]: SetPerformance[] } = {};
    plan.exercises.forEach((ex, idx) => {
        let defaultWeight = 8; // User Default: 8kg
        let defaultReps = 10; // User Default: 10 reps
        let defaultCadence = undefined;

        if (ex.mode === 'bike') {
            // Bike defaults
            defaultCadence = ex.targetCadence ? parseFloat(ex.targetCadence) : undefined;
            defaultReps = ex.targetDuration ? parseFloat(ex.targetDuration) : 0; 
            if (!ex.targetDuration && ex.reps.includes('min')) {
                defaultReps = parseFloat(ex.reps);
            }
        } else {
            // Standard
            const weightMatch = ex.description?.match(/(\d+)kg/i);
            if (weightMatch) defaultWeight = parseFloat(weightMatch[1]);
            
            const parsedReps = parseInt(ex.reps);
            if (!isNaN(parsedReps)) defaultReps = parsedReps;
        }

      initialData[idx] = Array.from({ length: ex.sets }).map((_, i) => ({
        setNumber: i + 1,
        weight: defaultWeight,
        reps: defaultReps,
        cadence: defaultCadence,
        completed: false
      }));
    });
    setSessionData(initialData);
  }, [plan]);

  // Scroll active exercise into view
  useEffect(() => {
    if (activeExerciseRef.current) {
      setTimeout(() => {
        activeExerciseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [currentExerciseIdx]);

  const updateSet = (exerciseIdx: number, setIdx: number, field: keyof SetPerformance, value: any) => {
    setSessionData(prev => {
      const exerciseSets = [...prev[exerciseIdx]];
      exerciseSets[setIdx] = { ...exerciseSets[setIdx], [field]: value };
      return { ...prev, [exerciseIdx]: exerciseSets };
    });
  };

  const completeSet = (exerciseIdx: number, setIdx: number) => {
    const updatedSets = [...sessionData[exerciseIdx]];
    updatedSets[setIdx] = { ...updatedSets[setIdx], completed: true };
    const newSessionData = { ...sessionData, [exerciseIdx]: updatedSets };
    
    setSessionData(newSessionData);
    
    const isLastSet = setIdx === updatedSets.length - 1;
    const isLastExercise = exerciseIdx === plan.exercises.length - 1;
    
    if (isLastSet) {
        if (isLastExercise) {
            const duration = (Date.now() - startTime) / 1000;
            const exerciseLogs = plan.exercises.map((ex, idx) => ({
                exerciseId: ex.id,
                exerciseName: ex.name,
                sets: newSessionData[idx] || []
            }));
        
            const log: WorkoutLog = {
                id: Date.now().toString(),
                date: Date.now(),
                dayPlanId: plan.id,
                exercises: exerciseLogs,
                durationSeconds: duration
            };
        
            setTimeout(() => {
                onFinish(log);
            }, 300);

        } else if (exerciseIdx < plan.exercises.length - 1) {
            setTimeout(() => setCurrentExerciseIdx(i => i + 1), 600);
        }
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Header Sticky */}
      <div className="sticky top-0 z-30 bg-te-base/95 backdrop-blur-sm pb-4 pt-2 border-b border-white/20 mb-6 transition-all">
        <div className="flex justify-between items-center mb-4">
            <button onClick={onCancel} className="p-2 -ml-2 text-te-dim hover:text-te-dark transition-colors">
                <TEIcon.Back size={20} />
            </button>
            <div className="text-center">
                <h1 className="font-bold text-sm text-te-dark uppercase tracking-tight">{plan.name}</h1>
                <span className="text-[10px] text-te-dim font-mono">{plan.duration}</span>
            </div>
            <div className="w-8"></div>
        </div>
        <div className="flex justify-center">
            <Timer />
        </div>
      </div>

      {/* Main Scrollable List */}
      <div className="flex-1 space-y-6 pb-20">
        {plan.exercises.map((exercise, exIdx) => {
            const isActive = exIdx === currentExerciseIdx;
            const isPast = exIdx < currentExerciseIdx;
            const isFuture = exIdx > currentExerciseIdx;
            const sets = sessionData[exIdx] || [];
            
            // Icon Logic
            let ExerciseIcon = TEIcon.Dumbbell;
            if (exercise.mode === 'bike') ExerciseIcon = TEIcon.Bike;
            if (exercise.category === 'warmup') ExerciseIcon = TEIcon.Flame;
            if (exercise.category === 'abs') ExerciseIcon = TEIcon.Shield;

            const isBike = exercise.mode === 'bike';

            // --- 1. PAST EXERCISE (Collapsed) ---
            if (isPast) {
                return (
                    <div key={exercise.id} className="opacity-50 grayscale transition-all duration-500">
                        <div className="bg-te-base/50 border border-te-dim/10 rounded-xl p-4 flex justify-between items-center shadow-inner">
                            <div className="flex items-center gap-3">
                                <ExerciseIcon size={14} className="text-te-dim" />
                                <span className="font-mono text-xs text-te-dark uppercase font-bold line-through decoration-te-orange decoration-2">
                                    {exercise.name}
                                </span>
                            </div>
                            <div className="text-te-orange"><TEIcon.Check size={16} /></div>
                        </div>
                    </div>
                );
            }

            // --- 2. ACTIVE EXERCISE (Expanded) ---
            if (isActive) {
                // === BIKE MODE SPECIFIC UI ===
                if (isBike) {
                    return (
                        <div key={exercise.id} ref={activeExerciseRef} className="scroll-mt-40 transition-all duration-500">
                             <TECard className="border-2 border-te-orange/20 shadow-neu-out bg-te-base">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-te-orange/10 flex items-center justify-center text-te-orange">
                                            <TEIcon.Bike size={20} />
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-xl text-te-dark uppercase leading-none">{exercise.name}</h2>
                                            <span className="text-[10px] text-te-dim font-mono uppercase tracking-wider">
                                                {exercise.category === 'warmup' ? 'Échauffement' : 'Séance'}
                                            </span>
                                        </div>
                                    </div>
                                    {exercise.targetCadence && (
                                        <div className="flex flex-col items-end">
                                             <span className="text-[8px] text-te-dim uppercase">Cible</span>
                                             <div className="flex items-center gap-1 text-te-orange font-bold font-mono">
                                                 <TEIcon.Gauge size={12} />
                                                 {exercise.targetCadence} <span className="text-[10px]">RPM</span>
                                             </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-te-base shadow-neu-pressed rounded-xl font-mono text-sm text-te-dark mb-6 leading-relaxed">
                                    {exercise.description}
                                </div>

                                {/* BIKE WARMUP DASHBOARD */}
                                {exercise.category === 'warmup' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[10px] uppercase text-te-dim font-mono flex items-center gap-1"><TEIcon.Timer size={10}/> Durée</label>
                                                <TENumberInput
                                                    value={sets[0]?.reps || 0}
                                                    onChange={(val) => updateSet(exIdx, 0, 'reps', val)}
                                                    label="MIN"
                                                    size="lg"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[10px] uppercase text-te-dim font-mono flex items-center gap-1"><TEIcon.Gauge size={10}/> Cadence</label>
                                                <TENumberInput
                                                    value={sets[0]?.cadence || 0}
                                                    onChange={(val) => updateSet(exIdx, 0, 'cadence', val)}
                                                    label="RPM"
                                                    size="lg"
                                                />
                                            </div>
                                        </div>
                                        <TEButton className="w-full py-4 text-lg" onClick={() => completeSet(exIdx, 0)}>
                                            Valider l'échauffement <TEIcon.Check size={18} className="ml-2"/>
                                        </TEButton>
                                    </div>
                                )}

                                {/* BIKE INTERVALS/MAIN SESSION - SINGLE CARD 4 INPUTS */}
                                {exercise.category === 'strength' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                            {/* Speed */}
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[10px] uppercase text-te-dim font-mono flex items-center gap-1"><TEIcon.Speed size={10}/> Vitesse</label>
                                                <TENumberInput
                                                    value={sets[0]?.speed || 0}
                                                    onChange={(val) => updateSet(exIdx, 0, 'speed', val)}
                                                    label="KM/H"
                                                    size="lg"
                                                />
                                            </div>
                                            {/* Distance */}
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[10px] uppercase text-te-dim font-mono flex items-center gap-1"><TEIcon.MapPin size={10}/> Distance</label>
                                                <TENumberInput
                                                    value={sets[0]?.distance || 0}
                                                    onChange={(val) => updateSet(exIdx, 0, 'distance', val)}
                                                    label="KM"
                                                    size="lg"
                                                />
                                            </div>
                                            {/* BPM */}
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[10px] uppercase text-te-dim font-mono flex items-center gap-1"><TEIcon.Heart size={10}/> BPM</label>
                                                <TENumberInput
                                                    value={sets[0]?.heartRate || 0}
                                                    onChange={(val) => updateSet(exIdx, 0, 'heartRate', val)}
                                                    label="BPM"
                                                    size="lg"
                                                />
                                            </div>
                                            {/* RPM */}
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[10px] uppercase text-te-dim font-mono flex items-center gap-1"><TEIcon.Gauge size={10}/> RPM</label>
                                                <TENumberInput
                                                    value={sets[0]?.cadence || 0}
                                                    onChange={(val) => updateSet(exIdx, 0, 'cadence', val)}
                                                    label="RPM"
                                                    size="lg"
                                                />
                                            </div>
                                        </div>

                                        <TEButton className="w-full py-4 text-lg" onClick={() => completeSet(exIdx, 0)}>
                                            Valider la séance <TEIcon.Check size={18} className="ml-2"/>
                                        </TEButton>
                                    </div>
                                )}
                             </TECard>
                        </div>
                    );
                }

                // === STANDARD STRENGTH / WARMUP (NON-BIKE) ===
                if (exercise.category === 'warmup' || exercise.category === 'abs') {
                    return (
                        <div key={exercise.id} ref={activeExerciseRef} className="scroll-mt-40 transition-all duration-500">
                             <TECard className="border-2 border-te-orange/20 shadow-neu-out bg-te-base">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-te-orange/10 flex items-center justify-center text-te-orange">
                                        <ExerciseIcon size={20} />
                                    </div>
                                    <h2 className="font-bold text-xl text-te-dark uppercase leading-none">{exercise.name}</h2>
                                </div>
                                <div className="p-4 bg-te-base shadow-neu-pressed rounded-xl font-mono text-sm text-te-dark mb-6 leading-relaxed">
                                    {exercise.description}
                                </div>
                                <TEButton 
                                    className="w-full" 
                                    onClick={() => completeSet(exIdx, 0)}
                                >
                                    Valider {exercise.category === 'warmup' ? "l'échauffement" : "les abdominaux"} <TEIcon.Check size={16} className="ml-2"/>
                                </TEButton>
                             </TECard>
                        </div>
                    );
                }

                // STANDARD STRENGTH (SEQUENTIAL)
                return (
                    <div key={exercise.id} ref={activeExerciseRef} className="scroll-mt-40 transition-all duration-500">
                        <TECard className="border-2 border-te-orange/20 shadow-neu-out">
                            {/* Exercise Header */}
                            <div className="mb-6">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <ExerciseIcon size={18} className="text-te-orange" />
                                        <h2 className="font-bold text-xl text-te-dark uppercase leading-none">{exercise.name}</h2>
                                    </div>
                                    <div className="bg-te-orange/10 text-te-orange px-2 py-1 rounded-md font-mono text-[10px] font-bold">
                                        {sets.length} SÉRIES
                                    </div>
                                </div>
                                {exercise.description && (
                                    <p className="font-mono text-[10px] text-te-dim leading-tight">{exercise.description}</p>
                                )}
                            </div>

                            {/* Sets Table/List */}
                            <div className="space-y-3">
                                {sets.map((set, setIdx) => {
                                    const isSetEnabled = setIdx === 0 || sets[setIdx - 1].completed;
                                    const isSetCompleted = set.completed;
                                    
                                    return (
                                        <div 
                                            key={setIdx} 
                                            className={`relative grid grid-cols-[auto_1fr_1fr_auto] gap-1.5 sm:gap-2 items-center p-2 rounded-xl transition-all duration-300 ${
                                                isSetEnabled && !isSetCompleted 
                                                ? 'bg-te-base shadow-neu-pressed border-l-4 border-l-te-orange' 
                                                : 'bg-transparent border border-transparent'
                                            } ${!isSetEnabled ? 'opacity-40 grayscale pointer-events-none' : ''}`}
                                        >
                                            {/* Label */}
                                            <div className="font-mono text-[10px] uppercase text-te-dim w-6 text-center">
                                                S{set.setNumber}
                                            </div>

                                            {/* Inputs */}
                                            {/* Input 1: Weight */}
                                            <TENumberInput
                                                value={set.weight}
                                                onChange={(val) => updateSet(exIdx, setIdx, 'weight', val)}
                                                label="KG"
                                                disabled={!isSetEnabled || isSetCompleted}
                                                className={isSetCompleted ? 'opacity-50' : ''}
                                                size="sm"
                                            />

                                            {/* Input 2: Reps */}
                                            <TENumberInput
                                                value={set.reps}
                                                onChange={(val) => updateSet(exIdx, setIdx, 'reps', val)}
                                                label="REP"
                                                disabled={!isSetEnabled || isSetCompleted}
                                                className={isSetCompleted ? 'opacity-50' : ''}
                                                size="sm"
                                            />

                                            {/* Checkbox / Action */}
                                            <button 
                                                onClick={() => !isSetCompleted && completeSet(exIdx, setIdx)}
                                                disabled={!isSetEnabled || isSetCompleted}
                                                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                                                    isSetCompleted 
                                                    ? 'bg-te-orange text-white shadow-neu-pressed-sm' 
                                                    : 'bg-te-base shadow-neu-out text-te-dim hover:text-te-orange active:shadow-neu-pressed'
                                                }`}
                                            >
                                                {isSetCompleted ? <TEIcon.Check size={18} strokeWidth={3} /> : <div className="w-4 h-4 rounded-full border-2 border-current opacity-30"></div>}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </TECard>
                    </div>
                );
            }

            // --- 3. FUTURE EXERCISE (Preview) ---
            if (isFuture) {
                return (
                    <div key={exercise.id} className="opacity-70">
                         <div className="bg-te-base border border-white/20 shadow-neu-out-sm rounded-xl p-4 flex justify-between items-center group">
                            <div>
                                <h3 className="font-mono text-sm text-te-dark font-bold uppercase flex items-center gap-2">
                                    <ExerciseIcon size={12} />
                                    {exercise.name}
                                </h3>
                                {exercise.category === 'strength' && (
                                    <div className="text-[10px] text-te-dim mt-1">{exercise.sets} Séries • {exercise.description}</div>
                                )}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-te-base shadow-neu-pressed-sm flex items-center justify-center text-te-dim">
                                <span className="font-mono text-xs">{exIdx + 1}</span>
                            </div>
                        </div>
                    </div>
                );
            }
            return null;
        })}
      </div>
    </div>
  );
};

// 4. HOME VIEW
const HomeView: React.FC<{ 
  plans: DayPlan[], 
  onStart: (plan: DayPlan) => void 
}> = ({ plans, onStart }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pt-4 pb-24">
      <div className="flex items-end justify-between px-2">
         <h1 className="text-2xl font-bold tracking-tight text-te-dark">COMPANION</h1>
         <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-te-orange shadow-[0_0_8px_#FF5800] animate-pulse"></div>
             <span className="font-mono text-[10px] text-te-dim uppercase">Ready</span>
         </div>
      </div>

      {plans.length === 0 ? (
        <div className="border-2 border-dashed border-te-grey/30 rounded-2xl p-12 text-center">
            <p className="text-te-dim mb-4 font-mono text-xs uppercase tracking-widest">Aucun programme</p>
            <div className="text-[10px] text-te-dim/50">Importez un CSV dans les paramètres</div>
        </div>
      ) : (
        <div className="grid gap-6">
            <h2 className="font-mono text-[10px] uppercase text-te-dim tracking-widest pl-2">Vos Programmes</h2>
            {plans.map((plan) => (
                <div 
                    key={plan.id}
                    onClick={() => onStart(plan)}
                    className="group bg-te-base shadow-neu-out rounded-2xl p-6 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/40 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/20 to-transparent rounded-bl-full pointer-events-none"></div>
                    
                    <div className="flex justify-between items-center mb-4 relative z-10">
                        <h3 className="font-bold text-lg text-te-dark group-hover:text-te-orange transition-colors flex items-center gap-2">
                            {/vélo|velo|hometrainer|home-trainer|cycling|cyclisme/i.test(plan.name) ? <TEIcon.Bike size={20} /> : <TEIcon.Dumbbell size={20} />}
                            {plan.name}
                        </h3>
                        <div className="w-10 h-10 rounded-full bg-te-base shadow-neu-out-sm flex items-center justify-center group-hover:text-te-orange transition-colors">
                            <TEIcon.Plus size={18} />
                        </div>
                    </div>
                    <div className="flex gap-3 text-[10px] font-mono text-te-dim uppercase relative z-10">
                        <span className="bg-te-base shadow-neu-pressed-sm px-2 py-1 rounded-md">{plan.exercises.length} ETAPES</span>
                        <span className="bg-te-base shadow-neu-pressed-sm px-2 py-1 rounded-md">{plan.duration}</span>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [plans, setPlans] = useState<DayPlan[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [activePlan, setActivePlan] = useState<DayPlan | null>(null);

  useEffect(() => {
    const savedPlans = localStorage.getItem('companion_plans');
    const savedLogs = localStorage.getItem('companion_logs');
    if (savedPlans) setPlans(JSON.parse(savedPlans));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);

  useEffect(() => {
    localStorage.setItem('companion_plans', JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    localStorage.setItem('companion_logs', JSON.stringify(logs));
  }, [logs]);

  const handleStartWorkout = (plan: DayPlan) => {
    setActivePlan(plan);
    setView(ViewState.WORKOUT);
  };

  const handleFinishWorkout = (log: WorkoutLog) => {
    setLogs(prev => [...prev, log]);
    setActivePlan(null);
    setView(ViewState.STATS);
  };

  const handleClearData = () => {
    if(window.confirm("Êtes-vous sûr de vouloir supprimer tous les programmes importés ?\n\nCette action supprimera tous les exercices du stockage local mais ne touchera PAS à votre historique d'entraînement.")) {
        setPlans([]);
        setActivePlan(null);
    }
  };

  const renderContent = () => {
    switch (view) {
      case ViewState.HOME:
        return <HomeView plans={plans} onStart={handleStartWorkout} />;
      case ViewState.WORKOUT:
        return activePlan ? (
          <WorkoutSessionView 
            plan={activePlan} 
            onFinish={handleFinishWorkout}
            onCancel={() => {
                if(confirm("Quitter la séance ?")) {
                    setActivePlan(null);
                    setView(ViewState.HOME);
                }
            }}
          />
        ) : null;
      case ViewState.STATS:
        return <StatsView logs={logs} />;
      case ViewState.SETTINGS:
        return <SettingsView onImport={setPlans} onClear={handleClearData} hasData={plans.length > 0} />;
      default:
        return <HomeView plans={plans} onStart={handleStartWorkout} />;
    }
  };

  return (
    <div className="min-h-screen bg-te-base text-te-dark font-sans selection:bg-te-orange selection:text-white max-w-2xl mx-auto shadow-[0_0_50px_rgba(0,0,0,0.05)] relative">
      
      <main className="p-4 sm:p-6 min-h-screen box-border">
        {renderContent()}
      </main>

      {/* Tab Bar */}
      {view !== ViewState.WORKOUT && (
        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-te-dark text-te-grey rounded-full px-8 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.3)] border border-white/10 z-40 flex gap-10 items-center backdrop-blur-md">
          <button 
            onClick={() => setView(ViewState.HOME)}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${view === ViewState.HOME ? 'text-te-orange scale-110' : 'hover:text-white'}`}
          >
            <TEIcon.Home size={22} />
          </button>
          
          <div className="w-px h-6 bg-white/10"></div>

          <button 
            onClick={() => setView(ViewState.STATS)}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${view === ViewState.STATS ? 'text-te-orange scale-110' : 'hover:text-white'}`}
          >
            <TEIcon.Stats size={22} />
          </button>

          <div className="w-px h-6 bg-white/10"></div>

          <button 
            onClick={() => setView(ViewState.SETTINGS)}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${view === ViewState.SETTINGS ? 'text-te-orange scale-110' : 'hover:text-white'}`}
          >
            <TEIcon.Settings size={22} />
          </button>
        </nav>
      )}
    </div>
  );
};

export default App;