(() => {
  const SUPABASE_URL = 'https://zkcmclsolhzwmubchimh.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_PLkcwoaWjWwJojjkgz8sYA_pZOFutyr';
  if (!window.supabase?.createClient) {
    console.error('Supabase client library failed to load.');
    return;
  }
  window.NPSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
})();
