"use client"

import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  CreditCard,
  Tag,
  LayoutDashboard,
  Receipt,
  BarChart,
  SquareChartGantt,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "ERP",
      logo: GalleryVerticalEnd,
      plan: "by varamio",
    },
  ],
  navMain: [
    {
      title: "Transactions",
      url: "/transactions",
      icon: SquareChartGantt,
    },
    {
      title: "Report",
      url: "/report",
      icon: BarChart,
    },
  ],
  projects: [
    {
      name: "Payment Modes",
      url: "/master/payment-modes",
      icon: CreditCard,
    },
    {
      name: "Categories",
      url: "/master/categories",
      icon: Tag,
    },
  ],
}

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user?: { name: string; email: string; avatar: string } }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user || data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}