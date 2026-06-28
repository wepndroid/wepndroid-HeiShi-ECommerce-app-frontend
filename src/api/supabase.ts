import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env?.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export function isSupabaseAuthConfigured(): boolean {
  return Boolean(supabaseUrl.trim() && supabaseAnonKey.trim());
}

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!isSupabaseAuthConfigured()) {
    throw new Error('Supabase Auth is not configured');
  }
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

export async function getSupabaseAccessToken(): Promise<string | null> {
  if (!isSupabaseAuthConfigured()) return null;
  const { data } = await getSupabaseClient().auth.getSession();
  return data.session?.access_token ?? null;
}