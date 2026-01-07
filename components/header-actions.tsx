"use client"

import { Bell, User, LogOut, Settings, CreditCard } from "lucide-react"
import { useState } from "react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const notifications = [
    {
        id: 1,
        title: "New Order Received",
        description: "You have a new order from John Doe.",
        time: "2 min ago",
        unread: true,
    },
    {
        id: 2,
        title: "System Update",
        description: "Server maintenance scheduled for tomorrow.",
        time: "1 hour ago",
        unread: true,
    },
    {
        id: 3,
        title: "Payment Successful",
        description: "Subscription payment for Enterprise plan was successful.",
        time: "5 hours ago",
        unread: false,
    },
]

export function HeaderActions({ className }: { className?: string }) {
    const [unreadCount, setUnreadCount] = useState(notifications.filter(n => n.unread).length)
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.replace('/')
    }

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {/* Notifications Popover */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-9 w-9">
                        <Bell className="h-5 w-5 cursor-pointer" />
                        {unreadCount > 0 && (
                            <Badge
                                variant="destructive"
                                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                            >
                                {unreadCount}
                            </Badge>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <h4 className="text-sm font-semibold">Notifications</h4>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
                            onClick={() => setUnreadCount(0)}
                        >
                            Mark all as read
                        </Button>
                    </div>
                    <ScrollArea className="h-80">
                        <div className="flex flex-col">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={cn(
                                        "flex flex-col gap-1 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer",
                                        n.unread && "bg-muted/30"
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-medium">{n.title}</span>
                                        <span className="text-[10px] text-muted-foreground">{n.time}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {n.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <div className="border-t px-4 py-2 text-center">
                        <Button variant="ghost" size="sm" className="w-full text-xs">
                            View all notifications
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>

            {/* User Profiles Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src="/avatars/01.png" alt="@admin" />
                            <AvatarFallback className="bg-secondary text-secondary-foreground">AD</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">Admin User</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                admin@erp-system.com
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4 cursor-pointer" />
                            <span>Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <CreditCard className="mr-2 h-4 w-4 cursor-pointer" />
                            <span>Billing</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4 cursor-pointer" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4 cursor-pointer" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
