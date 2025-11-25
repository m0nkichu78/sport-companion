import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
const getEnv = (key: string) => {
    // @ts-ignore
    if (import.meta && import.meta.env && import.meta.env[key]) {
        // @ts-ignore
        return import.meta.env[key];
    }
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        // @ts-ignore
        return process.env[key];
    }
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key.replace('VITE_', '')]) {
        // @ts-ignore
        return process.env[key.replace('VITE_', '')];
    }
    return undefined;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

let supabase: any;

if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("Supabase initialized successfully");
} else {
    console.warn("Supabase credentials missing. Cloud sync will be disabled.");
}

export { supabase };

// Helper to check availability
export const isSupabaseReady = () => !!supabase;
