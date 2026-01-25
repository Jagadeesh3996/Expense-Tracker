'use server'

import { createClient } from '@/lib/supabase/server'

export async function signup(prevState: any, formData: FormData) {
    const rawEmail = formData.get('email') as string || ''
    const rawPassword = formData.get('password') as string || ''
    const rawConfirmPassword = formData.get('confirm-password') as string || ''
    const rawName = formData.get('name') as string || ''

    const email = rawEmail.trim()
    const password = rawPassword.trim()
    const confirmPassword = rawConfirmPassword.trim()
    const name = rawName.trim()

    const fields = {
        email: email,
        password: password,
        'confirm-password': confirmPassword,
        name: name
    }

    if (!email || !password || !confirmPassword || !name) {
        return { error: 'All fields are required', fields }
    }

    if (password !== confirmPassword) {
        return { error: 'Passwords do not match', fields }
    }

    if (password.length < 6) {
        return { error: 'Password must be at least 6 characters', fields }
    }

    const supabase = await createClient()

    const { data: { user, session }, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: name,
            },
        },
    })

    if (error) {
        return { error: error.message, fields }
    }

    // specific check for existing user when email enumeration protection is enabled
    if (user && user.identities && user.identities.length === 0) {
        return { error: 'Email already exists', fields }
    }

    // checks for existing user when email enumeration protection is disabled (Supabase returns error above)
    // or if the session is null, it might require email confirmation, but usually implies success in creation or fake success.
    // If we want to be strict about 'email exists', the identities check is the key.

    return { success: true }
}
