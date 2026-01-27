import { supabase } from '@/integrations/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Helper to bypass TypeScript type checking for Supabase queries
 * when the auto-generated types don't match the actual database schema.
 * 
 * This is needed because the auto-generated types.ts is empty,
 * but the actual database has tables.
 */
export function fromTable(tableName: string): ReturnType<SupabaseClient<any, any, any>['from']> {
  return (supabase as SupabaseClient<any, any, any>).from(tableName);
}
