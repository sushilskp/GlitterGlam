/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Access Supabase from environment metadata supporting both VITE_ and NEXT_PUBLIC_ prefixes
const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Initialize Supabase if keys exist
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// User Session Roles
export type UserRole = 'Super Admin' | 'Admin' | 'Manager' | 'Staff' | 'Customer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export function addAuditLog(action: string, description: string) {
  // Simplified for production
  if (supabase) {
    supabase.from('audit_logs').insert({
      action: action,
      description: description,
      user_name: 'Admin',
      ip_address: '127.0.0.1'
    }).then(({error}) => {
      if (error) console.error("Cloud logging failed:", error);
    });
  }
}
