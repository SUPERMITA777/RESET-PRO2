"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Pencil, Trash } from "lucide-react"

// Mock data for professionals
const initialProfessionals = [
  {
    id: 1,
    name: "Ana García",
    specialty: "Masajista",
    email: "ana.garcia@example.com",
    phone: "123-456-7890",
    schedule: {
      Lunes: ["09:00", "10:00", "11:00", "12:00", "15:00", "16:00", "17:00"],
      Martes: ["09:00", "10:00", "11:00", "12:00", "15:00", "16:00", "17:00"],
      Miércoles: ["09:00", "10:00", "11:00", "12:00", "15:00", "16:00", "17:00"],
      Jueves: ["09:00", "10:00", "11:00", "12:00", "15:00", "16:00", "17:00"],
      Viernes: ["09:00", "10:00", "11:00", "12:00", "15:00", "16:00", "17:00"],
    },
    bio: "Especialista en masajes terapéuticos con más de 5 años de experiencia.",
  },
  {
    id: 2,
    name: "Carlos Rodríguez",
    specialty: "Esteticista",
    email: "carlos.rodriguez@example.com",
    phone: "234-567-8901",
    schedule: {
      Lunes: ["13:00", "14:00", "15:00", "16:00", "17:00"],
      Martes: ["13:00", "14:00", "15:00", "16:00", "17:00"],
      Miércoles: ["13:00", "14:00", "15:00", "16:00", "17:00"],
      Jueves: ["13:00", "14:00", "15:00", "16:00", "17:00"],
      Viernes: ["13:00", "14:00", "15:00", "16:00", "17:00"],
    },
    bio: "Especialista en tratamientos faciales y corporales.",
  },
]

// Days of the week
const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

// Time slots (30 min intervals from 9:00 to 18:00)
const timeSlots = Array.from({ length: 19 }, (_, i) => {
  const hour = Math.floor(i / 2) + 9
  const minute = (i % 2) * 30
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
})

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState(initialProfessionals)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedProfessional, setSelectedProfessional] = useState<any | null>(null)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedTimes, setSelectedTimes] = useState<string[]>([])

  // Handle open professional dialog
  const handleOpenProfessionalDialog = (professional: any = null) => {
    setSelectedProfessional(professional)
    setIsDialogOpen(true)
  }

  // Handle save professional
  const handleSaveProfessional = (e: React.FormEvent) => {
    e.preventDefault()

    const formData = new FormData(e.target as HTMLFormElement)
    const name = formData.get("name") as string
    const specialty = formData.get("specialty") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const bio = formData.get("bio") as string

    if (selectedProfessional) {
      // Update existing professional
      setProfessionals(
        professionals.map((professional) =>
          professional.id === selectedProfessional.id
            ? {
                ...professional,
                name,
                specialty,
                email,
                phone,
                bio,
              }
            : professional,
        ),
      )
    } else {
      // Create new professional
      const newProfessional = {
        id: Date.now(),
        name,
        specialty,
        email,
        phone,
        bio,
        schedule: {},
      }

      setProfessionals([...professionals, newProfessional])
    }

    setIsDialogOpen(false)
  }

  // Handle delete professional
  const handleDeleteProfessional = (id: number) => {
    setProfessionals(professionals.filter((professional) => professional.id !== id))
  }

  // Handle open schedule dialog
  const handleOpenScheduleDialog = (professional: any, day: string) => {
    setSelectedProfessional(professional)
    setSelectedDay(day)
    setSelectedTimes(professional.schedule[day] || [])
    setScheduleDialogOpen(true)
  }

  // Handle toggle time slot
  const handleToggleTimeSlot = (time: string) => {
    if (selectedTimes.includes(time)) {
      setSelectedTimes(selectedTimes.filter((t) => t !== time))
    } else {
      setSelectedTimes([...selectedTimes, time])
    }
  }

  // Handle save schedule
  const handleSaveSchedule = () => {
    if (!selectedProfessional || !selectedDay) return

    setProfessionals(
      professionals.map((professional) => {
        if (professional.id !== selectedProfessional.id) return professional

        return {
          ...professional,
          schedule: {
            ...professional.schedule,
            [selectedDay]: selectedTimes,
          },
        }
      }),
    )

    setScheduleDialogOpen(false)
  }

  // Format schedule for display
  const formatSchedule = (schedule: any) => {
    if (!schedule) return "No disponible"

    const days = Object.keys(schedule)
    if (days.length === 0) return "No disponible"

    return days.map((day) => `${day} (${schedule[day].length} horarios)`).join(", ")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestión de Profesionales</h2>
        <Button onClick={() => handleOpenProfessionalDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Profesional
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Horarios</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {professionals.map((professional) => (
                <TableRow key={professional.id}>
                  <TableCell className="font-medium">{professional.name}</TableCell>
                  <TableCell>{professional.specialty}</TableCell>
                  <TableCell>{professional.email}</TableCell>
                  <TableCell>{professional.phone}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {daysOfWeek.map((day) => (
                        <Button
                          key={day}
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => handleOpenScheduleDialog(professional, day)}
                        >
                          {day.substring(0, 3)}
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenProfessionalDialog(professional)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteProfessional(professional.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Professional Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedProfessional ? "Editar Profesional" : "Nuevo Profesional"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveProfessional}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={selectedProfessional?.name || ""}
                  placeholder="Nombre completo"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="specialty">Especialidad</Label>
                <Input
                  id="specialty"
                  name="specialty"
                  defaultValue={selectedProfessional?.specialty || ""}
                  placeholder="Especialidad"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={selectedProfessional?.email || ""}
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={selectedProfessional?.phone || ""}
                  placeholder="Teléfono de contacto"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bio">Biografía</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  defaultValue={selectedProfessional?.bio || ""}
                  placeholder="Información sobre el profesional"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedProfessional?.name} - Horarios {selectedDay}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((time) => (
                <Button
                  key={time}
                  variant={selectedTimes.includes(time) ? "default" : "outline"}
                  className="text-xs"
                  onClick={() => handleToggleTimeSlot(time)}
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSchedule}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

