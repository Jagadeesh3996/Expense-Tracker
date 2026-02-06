"use client"

import React, { createContext, useContext, useTransition } from "react"
import { useRouter } from "next/navigation"

interface NavigationContextType {
    isPending: boolean
    navigate: (url: string) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: React.ReactNode }) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const navigate = (url: string) => {
        startTransition(() => {
            router.push(url)
        })
    }

    return (
        <NavigationContext.Provider value={{ isPending, navigate }}>
            {children}
        </NavigationContext.Provider>
    )
}

export function useNavigation() {
    const context = useContext(NavigationContext)
    if (context === undefined) {
        throw new Error("useNavigation must be used within a NavigationProvider")
    }
    return context
}
