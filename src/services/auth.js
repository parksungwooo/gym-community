import { supabase } from '../lib/supabaseClient'
import { assertServiceSuccess } from './serviceErrors'

export const AUTH_PROVIDERS = {
  GOOGLE: 'google',
  KAKAO: 'kakao',
  NAVER: 'naver',
}

export async function getCurrentUser() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

  assertServiceSuccess(sessionError, 'auth.get_session')

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

  assertServiceSuccess(error, `auth.sign_in.${provider}`)
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut()

  assertServiceSuccess(error, 'auth.sign_out')
}
