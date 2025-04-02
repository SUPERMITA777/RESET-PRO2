"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, Users } from "lucide-react"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js"
import { Bar, Doughnut } from "react-chartjs-2"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getSupabaseClient } from "@/lib/supabase/client"
import { ConnectionStatus } from "@/components/connection-status"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false)
  const [appointments, setAppointments] = useState([])
  const [professionals, setProfessionals] = useState([])
  const [totalAppointments, setTotalAppointments] = useState(0)
  const [pendingAppointments, setPendingAppointments] = useState(0)

  useEffect(() => {
    setIsClient(true)

    // Cargar datos de Supabase
    async function loadData() {
      const supabase = getSupabaseClient()

      // Cargar citas
      const { data: appointmentsData, error: appointmentsError } = await supabase.from("appointments").select("*")

      if (!appointmentsError && appointmentsData) {
        setAppointments(appointmentsData)
        setTotalAppointments(appointmentsData.length)
        setPendingAppointments(appointmentsData.filter((app) => app.status === "pending").length)
      }

      // Cargar profesionales
      const { data: professionalsData, error: professionalsError } = await supabase.from("professionals").select("*")

      if (!professionalsError && professionalsData) {
        setProfessionals(professionalsData)
      }
    }

    loadData()
  }, [])

  // Mock data for charts
  const barChartData = {
    labels: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
    datasets: [
      {
        label: "Turnos",
        data: [12, 19, 8, 15, 20, 10],
        backgroundColor: "#e07a5f",
      },
    ],
  }

  const doughnutChartData = {
    labels: ["Masajes", "Faciales", "Manicura", "Pedicura", "Otros"],
    datasets: [
      {
        data: [30, 25, 15, 20, 10],
        backgroundColor: ["#e07a5f", "#81b29a", "#f2cc8f", "#3d405b", "#e5e5e5"],
        borderWidth: 1,
      },
    ],
  }

  if (!isClient) {
    return null // Prevent rendering on server to avoid hydration mismatch
  }

  return (
    <div>
      <header className="mb-6 pb-4 border-b">
        <h1 className="text-2xl font-bold text-[#3d405b]">Dashboard</h1>
      </header>

      <ConnectionStatus />

      <div className="space-y-6 mt-4">
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Turnos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAppointments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Turnos Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingAppointments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Profesionales</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{professionals.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Añadir después de las tarjetas de estadísticas y antes de los gráficos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Turnos por Profesional</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profesional</TableHead>
                  <TableHead>Total de Turnos</TableHead>
                  <TableHead>Turnos Pendientes</TableHead>
                  <TableHead>Turnos Completados</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {professionals.map((professional) => {
                  const professionalAppointments = appointments.filter((app) => app.professional_id === professional.id)
                  const pendingCount = professionalAppointments.filter((app) => app.status === "pending").length
                  const completedCount = professionalAppointments.filter((app) => app.status === "completed").length

                  return (
                    <TableRow key={professional.id}>
                      <TableCell className="font-medium">{professional.name}</TableCell>
                      <TableCell>{professionalAppointments.length}</TableCell>
                      <TableCell>{pendingCount}</TableCell>
                      <TableCell>{completedCount}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Turnos por Día</CardTitle>
            </CardHeader>
            <CardContent>
              <Bar
                data={barChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: "top" as const,
                    },
                  },
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tratamientos Populares</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex justify-center">
                <Doughnut
                  data={doughnutChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "right" as const,
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <div className="flex-1">
                  <p className="text-sm">Nuevo turno: Masaje Descontracturante - María González</p>
                  <p className="text-xs text-muted-foreground">Hoy, 10:30 AM</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                <div className="flex-1">
                  <p className="text-sm">Turno completado: Tratamiento Facial - Carlos Rodríguez</p>
                  <p className="text-xs text-muted-foreground">Hoy, 9:15 AM</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                <div className="flex-1">
                  <p className="text-sm">Pago recibido: $9,000 - Laura Martínez</p>
                  <p className="text-xs text-muted-foreground">Ayer, 4:45 PM</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                <div className="flex-1">
                  <p className="text-sm">Nuevo cliente registrado: Javier López</p>
                  <p className="text-xs text-muted-foreground">Ayer, 2:30 PM</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                <div className="flex-1">
                  <p className="text-sm">Turno cancelado: Manicura - Ana Sánchez</p>
                  <p className="text-xs text-muted-foreground">Ayer, 11:00 AM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

