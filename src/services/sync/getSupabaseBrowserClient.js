/**
 * Client Supabase navigateur (optionnel).
 * Sans VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY → null (app inchangée).
 *
 * @returns {Promise<import('@supabase/supabase-js').SupabaseClient | null>}
 */
export async function getSupabaseBrowserClient() {
  const url = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
  const anon = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (!url || !anon) return null;

  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  });
}

/**
 * @returns {boolean}
 */
export function isSupabaseConfigured() {
  return Boolean(
    String(import.meta.env.VITE_SUPABASE_URL || '').trim() &&
      String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()
  );
}
