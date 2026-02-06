"use client"

import React from "react"
import { useNavigation } from "@/components/providers/navigation-provider"
import { cn } from "@/lib/utils"

interface SilentLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string
    children: React.ReactNode
    className?: string
}

export function SilentLink({ href, children, className, ...props }: SilentLinkProps) {
    const { navigate } = useNavigation()

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        // Only handle left clicks without modifier keys
        if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
            e.preventDefault()
            navigate(href)
        }
    }

    return (
        <a
            href={href}
            onClick={handleClick}
            className={cn("cursor-pointer", className)}
            {...props}
        >
            {children}
        </a>
    )
}
