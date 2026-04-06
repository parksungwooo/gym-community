import { supabase } from '../lib/supabaseClient'

export async function getCurrentUser() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    throw sessionError
  }

  return sessionData.session?.user ?? null
}

export async function signInWithOAuth(provider) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin,
      skipBrowserRedirect: false,
    },
  })

  if (error) {
    throw error
  }
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}
