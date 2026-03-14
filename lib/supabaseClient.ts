import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const missingEnvMessage =
  "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.";

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createBrowserClient(supabaseUrl, supabaseAnonKey)
    : (new Proxy(
        {},
        {
          get() {
            if (typeof window !== "undefined") {
              throw new Error(missingEnvMessage);
            }
            throw new Error(missingEnvMessage);
          },
        }
      ) as ReturnType<typeof createBrowserClient>);
