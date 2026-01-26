'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const rawEmail = formData.get('email') as string || ''
    const rawPassword = formData.get('password') as string || ''

    // We don't necessarily need to trim for the *attempt* sent to Supabase if Supabase handles it, 
    // but typically we should trim email. Passwords might be sensitive to whitespace though? 
    // Usually trim email, keep password raw? The user's previous request asked to "validate all fields with white sapce, remove white space at front and back".
    // I will trim both as per previous instruction context which seemed general.
    const email = rawEmail.trim()
    const password = rawPassword.trim()

    const fields = { email: rawEmail, password: rawPassword }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message, fields }
    }

    return { success: true }
}

// Note: Session limits (max 2 per user) are enforced by a database trigger.
// See supabase/migrations/20260108_limit_user_sessions.sql

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()

    revalidatePath('/', 'layout')
    redirect('/')
}
