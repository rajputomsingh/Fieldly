import { createClient } from "@supabase/supabase-js";

export const LAND_BUCKET = "lands";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase image storage configuration is missing");
  }

  return createClient(url, anonKey);
}

export function getSupabaseImageUrl(
  path: string | null | undefined,
): string | null {
  if (!path) return null;

  if (path.includes("supabase.co/storage/v1/object/public/")) {
    return path;
  }

  try {
    const supabase = getSupabase();

    const { data } = supabase.storage.from(LAND_BUCKET).getPublicUrl(path);

    return data.publicUrl;
  } catch (error) {
    console.error("Error constructing Supabase URL for path:", path, error);

    return null;
  }
}

export const getImageUrl = getSupabaseImageUrl;
