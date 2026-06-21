import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { mockSupabaseClient } from './mockClient';

export async function createClient() {
  const useMock = process.env.NEXT_PUBLIC_USE_LOCAL_MOCK === "true";
  if (useMock) {
    return mockSupabaseClient as any;
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
