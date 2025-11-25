import React from 'react';

// --- TE Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  active?: boolean;
}

export const TEButton: React.FC<ButtonProps> = ({ children, className = '', variant = 'primary', active, ...props }) => {
  const baseStyle = "font-mono uppercase text-xs tracking-wider transition-all duration-200 flex items-center justify-center outline-none active:scale-[0.98]";
  
  const variants = {
    primary: "bg-te-orange text-white shadow-[5px_5px_10px_rgba(205,202,194,0.4),-5px_-5px_10px_rgba(255,255,255,0.4)] hover:brightness-110 active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.2)] rounded-xl px-6 py-4 font-bold border border-white/10",
    secondary: "bg-te-base text-te-dark shadow-neu-out-sm hover:text-te-orange active:shadow-neu-pressed-sm rounded-xl px-5 py-3 border border-white/20",
    ghost: "bg-transparent text-te-dim hover:text-te-orange px-3 py-2 rounded-lg",
    icon: `w-12 h-12 rounded-full flex items-center justify-center transition-all ${active 
      ? 'bg-te-base text-te-orange shadow-neu-pressed border border-te-base' 
      : 'bg-te-base text-te-dark shadow-neu-out-sm border border-white/20 active:shadow-neu-pressed-sm'}`
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// --- TE Card ---
interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export const TECard: React.FC<CardProps> = ({ children, className = '', title, action }) => {
  return (
    <div className={`bg-te-base shadow-neu-out rounded-2xl border border-white/40 ${className}`}>
      {(title || action) && (
        <div className="px-6 py-4 flex justify-between items-center mb-2">
          {title && <h3 className="font-mono text-[10px] uppercase font-bold text-te-dim tracking-[0.2em]">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={`px-6 pb-6 ${!title && !action ? 'pt-6' : ''}`}>
        {children}
      </div>
    </div>
  );
};

// --- TE Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const TEInput: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && <label className="font-mono text-[10px] uppercase text-te-dim tracking-wider ml-1">{label}</label>}
      <input 
        className={`bg-te-base shadow-neu-pressed rounded-xl px-4 py-3 font-mono text-sm text-te-dark placeholder-te-dim/50 outline-none focus:text-te-orange transition-colors ${className}`}
        {...props}
      />
    </div>
  );
};

// --- TE Value Display ---
interface ValueDisplayProps {
  label: string;
  value: string | number;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TEValueDisplay: React.FC<ValueDisplayProps> = ({ label, value, unit, size = 'md' }) => {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl"
  };

  return (
    <div className="flex flex-col p-2">
      <span className="font-mono text-[10px] uppercase text-te-dim mb-1">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`font-mono font-medium text-te-dark tracking-tighter drop-shadow-sm ${sizeClasses[size]}`}>
          {value}
        </span>
        {unit && <span className="font-mono text-xs text-te-dim">{unit}</span>}
      </div>
    </div>
  );
};

// --- TE ICONS (Material Symbols Sharp) ---
// Docs: https://fonts.google.com/icons?icon.set=Material+Symbols&icon.style=Sharp
export interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number; // Ignored for Material Symbols but kept for API compatibility
}

const MaterialIcon: React.FC<IconProps & { name: string }> = ({ size = 20, className = '', name }) => (
  <span 
    className={`material-symbols-sharp select-none ${className}`} 
    style={{ fontSize: `${size}px` }}
  >
    {name}
  </span>
);

export const TEIcon = {
  // Tab Bar
  Home: (props: IconProps) => <MaterialIcon name="home" {...props} />,
  Stats: (props: IconProps) => <MaterialIcon name="bar_chart" {...props} />,
  Settings: (props: IconProps) => <MaterialIcon name="settings" {...props} />,

  // Actions
  Plus: (props: IconProps) => <MaterialIcon name="add" {...props} />,
  Check: (props: IconProps) => <MaterialIcon name="check" {...props} />,
  Back: (props: IconProps) => <MaterialIcon name="arrow_back" {...props} />,
  Upload: (props: IconProps) => <MaterialIcon name="upload_file" {...props} />,
  Magic: (props: IconProps) => <MaterialIcon name="auto_awesome" {...props} />,
  
  // Player / Timer
  Play: (props: IconProps) => <MaterialIcon name="play_arrow" {...props} />,
  Pause: (props: IconProps) => <MaterialIcon name="pause" {...props} />,
  Reset: (props: IconProps) => <MaterialIcon name="replay" {...props} />,
  Timer: (props: IconProps) => <MaterialIcon name="timer" {...props} />,

  // Workout Types
  Dumbbell: (props: IconProps) => <MaterialIcon name="fitness_center" {...props} />,
  Bike: (props: IconProps) => <MaterialIcon name="directions_bike" {...props} />,
  Flame: (props: IconProps) => <MaterialIcon name="local_fire_department" {...props} />,
  Shield: (props: IconProps) => <MaterialIcon name="shield" {...props} />,
  
  // Dashboard Metrics
  Gauge: (props: IconProps) => <MaterialIcon name="av_timer" {...props} />, // RPM / Cadence
  Heart: (props: IconProps) => <MaterialIcon name="favorite" {...props} />,
  MapPin: (props: IconProps) => <MaterialIcon name="location_on" {...props} />,
  Speed: (props: IconProps) => <MaterialIcon name="speed" {...props} />
};