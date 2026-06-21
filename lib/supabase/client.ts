import { createBrowserClient } from '@supabase/ssr';
import { mockSupabaseClient } from './mockClient';

let client: ReturnType<typeof createBrowserClient> | any = null;

export function createClient() {
  const useMock = process.env.NEXT_PUBLIC_USE_LOCAL_MOCK === "true";
  if (useMock) {
    return mockSupabaseClient;
  }

  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}

