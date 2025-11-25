import React, { useState, useEffect, useCallback } from 'react';
import { TEIcon } from './TEComponents';

export const Timer: React.FC = () => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, seconds]);

  const toggle = useCallback(() => setIsActive(!isActive), [isActive]);
  const reset = useCallback(() => {
    setSeconds(0);
    setIsActive(false);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-te-base shadow-neu-out-sm rounded-xl p-2 flex items-center gap-3 border border-white/20">
        <div className="bg-te-base shadow-neu-pressed rounded-lg px-3 py-1 font-mono text-te-orange text-lg tracking-widest tabular-nums w-20 text-center">
            {formatTime(seconds)}
        </div>
        <div className="flex gap-2">
            <button 
                onClick={toggle}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-te-dark transition-all ${
                    isActive 
                    ? 'bg-te-base shadow-neu-pressed text-te-orange' 
                    : 'bg-te-base shadow-neu-out-sm hover:text-te-orange active:shadow-neu-pressed'
                }`}
            >
                {isActive ? <TEIcon.Pause size={14} /> : <TEIcon.Play size={14} />}
            </button>
            <button 
                onClick={reset}
                className="w-8 h-8 rounded-full bg-te-base shadow-neu-out-sm flex items-center justify-center text-te-dim hover:text-te-dark active:shadow-neu-pressed transition-all"
            >
                <TEIcon.Reset size={14} />
            </button>
        </div>
    </div>
  );
};