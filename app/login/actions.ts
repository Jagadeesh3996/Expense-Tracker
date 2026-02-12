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

export async function signInWithGoogle() {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        },
    })

    if (error) {
        return { error: error.message }
    }

    if (data.url) {
        redirect(data.url)
    }
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function sendResetLink(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const rawEmail = formData.get('email') as string || ''
    const email = rawEmail.trim()

    if (!email) {
        return { error: 'Email is required' }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/reset-password`,
    })

    if (error) {
        return { error: error.message }
    }

    return { success: 'Password reset link sent to your email.' }
}

export async function updatePassword(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const password = (formData.get('password') as string || '').trim()
    const confirmPassword = (formData.get('confirmPassword') as string || '').trim()

    if (!password) {
        return { error: 'Password is required' }
    }

    if (password !== confirmPassword) {
        return { error: 'Passwords do not match' }
    }

    const { error } = await supabase.auth.updateUser({
        password: password,
    })

    if (error) {
        return { error: error.message }
    }

    return { success: 'Password updated successfully' }
}
