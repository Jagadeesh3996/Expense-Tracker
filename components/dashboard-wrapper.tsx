import { AppSidebar } from "@/components/app-sidebar";
import { HeaderActions } from "@/components/header-actions";
import { ModeToggle } from "@/components/mode-toggle";
import { DynamicBreadcrumbs } from "@/components/dynamic-breadcrumbs";
import { Separator } from "@/components/ui/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { NavigationProvider } from "@/components/providers/navigation-provider";

export function DashboardWrapper({
    children,
    user,
}: {
    children: React.ReactNode;
    user: any;
}) {
    return (
        <NavigationProvider>
            <SidebarProvider>
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
