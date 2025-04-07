"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Scissors, Clock, ShoppingBag, Settings, LogOut, LayoutDashboard, CalendarCheck } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setIsClient(true)
    const isLoggedIn = localStorage.getItem("isLoggedIn")

    if (!isLoggedIn) {
      router.push("/login")
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn")
    router.push("/login")
  }

  if (!isClient) {
    return null // Prevent rendering on server to avoid hydration mismatch
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8f9fa]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#3d405b] text-white p-4 md:min-h-screen">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-xl font-bold">RESET-pro2</h1>
          <Button variant="ghost" size="icon" className="md:hidden text-white" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        <nav className="space-y-2">
          <Link href="/admin/dashboard">
            <Button
              variant="ghost"
              className={`w-full justify-start ${
                pathname === "/admin/dashboard" ? "bg-[#e07a5f] hover:bg-[#e07a5f]" : "hover:bg-[#4d5070]"
              }`}
            >
              <LayoutDashboard className="mr-2 h-5 w-5" />
              Dashboard
            </Button>
          </Link>
          <Link href="/admin/agenda">
            <Button
              variant="ghost"
              className={`w-full justify-start ${
                pathname === "/admin/agenda" ? "bg-[#e07a5f] hover:bg-[#e07a5f]" : "hover:bg-[#4d5070]"
              }`}
            >
              <Calendar className="mr-2 h-5 w-5" />
              Agenda
            </Button>
          </Link>
          <Link href="/admin/agenda2">
            <Button
              variant="ghost"
              className={`w-full justify-start ${
                pathname === "/admin/agenda2" ? "bg-[#e07a5f] hover:bg-[#e07a5f]" : "hover:bg-[#4d5070]"
              }`}
            >
              <CalendarCheck className="mr-2 h-5 w-5" />
              Agenda 2
            </Button>
          </Link>
          <Link href="/admin/professionals">
            <Button
              variant="ghost"
              className={`w-full justify-start ${
                pathname === "/admin/professionals" ? "bg-[#e07a5f] hover:bg-[#e07a5f]" : "hover:bg-[#4d5070]"
              }`}
            >
              <Users className="mr-2 h-5 w-5" />
              Profesionales
            </Button>
          </Link>
          <Link href="/admin/treatments">
            <Button
              variant="ghost"
              className={`w-full justify-start ${
                pathname === "/admin/treatments" ? "bg-[#e07a5f] hover:bg-[#e07a5f]" : "hover:bg-[#4d5070]"
              }`}
            >
              <Scissors className="mr-2 h-5 w-5" />
              Tratamientos
            </Button>
          </Link>
          <Link href="/admin/appointments">
            <Button
              variant="ghost"
              className={`w-full justify-start ${
                pathname === "/admin/appointments" ? "bg-[#e07a5f] hover:bg-[#e07a5f]" : "hover:bg-[#4d5070]"
              }`}
            >
              <Clock className="mr-2 h-5 w-5" />
              Turnos
            </Button>
          </Link>
          <Link href="/admin/clients">
            <Button
              variant="ghost"
              className={`w-full justify-start ${
                pathname === "/admin/clients" ? "bg-[#e07a5f] hover:bg-[#e07a5f]" : "hover:bg-[#4d5070]"
              }`}
            >
              <Users className="mr-2 h-5 w-5" />
              Clientes
            </Button>
          </Link>
          <Link href="/admin/products">
            <Button
              variant="ghost"
              className={`w-full justify-start ${
                pathname === "/admin/products" ? "bg-[#e07a5f] hover:bg-[#e07a5f]" : "hover:bg-[#4d5070]"
              }`}
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              Productos
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button
              variant="ghost"
              className={`w-full justify-start ${
                pathname === "/admin/settings" ? "bg-[#e07a5f] hover:bg-[#e07a5f]" : "hover:bg-[#4d5070]"
              }`}
            >
              <Settings className="mr-2 h-5 w-5" />
              Configuración
            </Button>
          </Link>
        </nav>

        <div className="mt-auto pt-8 hidden md:block">
          <Button variant="ghost" className="w-full justify-start hover:bg-[#4d5070]" onClick={handleLogout}>
            <LogOut className="mr-2 h-5 w-5" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        <header className="mb-6 pb-4 border-b">
          <h1 className="text-2xl font-bold text-[#3d405b]">
            {pathname === "/admin/dashboard" && "Dashboard"}
            {pathname === "/admin/agenda" && "Agenda"}
            {pathname === "/admin/professionals" && "Profesionales"}
            {pathname === "/admin/treatments" && "Tratamientos"}
            {pathname === "/admin/appointments" && "Turnos"}
            {pathname === "/admin/clients" && "Clientes"}
            {pathname === "/admin/products" && "Productos"}
            {pathname === "/admin/settings" && "Configuración"}
          </h1>
        </header>

        {children}
      </main>
    </div>
  )
}

