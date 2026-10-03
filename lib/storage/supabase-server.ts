import { createClient, type SupabaseClient } from "@supabase/supabase-js"

export const LAND_BUCKET = "lands"

export const LEASE_AGREEMENTS_BUCKET = "lease-agreements"

function createSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured")
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured")
  }

  return createClient(url, serviceRoleKey)
}

export const supabaseAdmin = new Proxy(
  {} as SupabaseClient,
  {
    get(_target, property, receiver) {
      const client = createSupabaseAdmin()
      return Reflect.get(client, property, receiver)
    },
  }
)