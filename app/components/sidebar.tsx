"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Calendar, 
  CalendarCheck, 
  Users, 
  UserCheck, 
  Settings, 
  ShoppingBasket, 
  Stethoscope 
} from "lucide-react"

interface SidebarLink {
  title: string
  href: string
  icon: React.ReactNode
}

export const adminLinks: SidebarLink[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: "Agenda",
    href: "/admin/agenda",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    title: "Agenda 2",
    href: "/admin/agenda2",
    icon: <CalendarCheck className="h-5 w-5" />,
  },
  {
    title: "Tratamientos",
    href: "/admin/treatments",
    icon: <Stethoscope className="h-5 w-5" />,
  },
  {
    title: "Clientes",
    href: "/admin/clients",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Profesionales",
    href: "/admin/professionals",
    icon: <UserCheck className="h-5 w-5" />,
  },
  {
    title: "Productos",
    href: "/admin/products",
    icon: <ShoppingBasket className="h-5 w-5" />,
  },
  {
    title: "Ajustes",
    href: "/admin/settings",
    icon: <Settings className="h-5 w-5" />,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col border-r bg-white">
      <div className="p-4">
        <Link href="/admin" className="flex items-center gap-2 font-bold">
          RESET PRO
        </Link>
      </div>
      <nav className="flex-1 overflow-auto p-3">
        <ul className="flex flex-col gap-1">
          {adminLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  pathname === link.href
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                {link.icon}
                {link.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
} 