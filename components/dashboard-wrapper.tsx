"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { HeaderActions } from "@/components/header-actions";
import { ModeToggle } from "@/components/mode-toggle";
import { DynamicBreadcrumbs } from "@/components/dynamic-breadcrumbs";
import { Separator } from "@/components/ui/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
    useSidebar,
} from "@/components/ui/sidebar";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { NavigationProvider } from "@/components/providers/navigation-provider";

function SidebarController() {
    const { setOpen, isMobile } = useSidebar();

    React.useEffect(() => {
        if (isMobile) return;

        const mql = window.matchMedia("(max-width: 1200px)");
        const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
            if (e.matches) {
                setOpen(false);
            }
        };

        mql.addEventListener("change", onChange);

        // Only run the initial check if the component mounts and it matches
        // But since defaultOpen is false, we might not need this.
        // However, if they refresh while > 1200 and it's closed (default), 
        // then they open it, we don't want it to snap shut unless they RESIZE down.

        return () => mql.removeEventListener("change", onChange);
    }, [setOpen, isMobile]);

    return null;
}

export function DashboardWrapper({
    children,
    user,
}: {
    children: React.ReactNode;
    user: any;
}) {
    return (
        <NavigationProvider>
            <SidebarProvider defaultOpen={false}>
                <SidebarController />
                <AppSidebar user={user} />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                        <div className="flex items-center gap-2 px-4 w-full">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <SidebarTrigger className="-ml-1 cursor-pointer" />
                                </TooltipTrigger>
                                <TooltipContent side="bottom" align="start">
                                    Toggle Sidebar (Ctrl+B)
                                </TooltipContent>
                            </Tooltip>
                            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:inline-flex">
                                <span className="text-xs">Ctrl+B</span>
                            </kbd>
                            <Separator
                                orientation="vertical"
                                className="mr-2 data-[orientation=vertical]:h-4"
                            />
                            <DynamicBreadcrumbs />
                            <div className="ml-auto flex items-center gap-2">
                                <ModeToggle className="cursor-pointer" />
                                <HeaderActions className="cursor-pointer" />
                            </div>
                        </div>
                    </header>
                    {children}
                </SidebarInset>
            </SidebarProvider>
        </NavigationProvider>
    );
}
