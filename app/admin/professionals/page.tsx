"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Pencil, Trash, Search } from "lucide-react"
import { createSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

interface Professional {
  id: number
  name: string
  specialty: string
  email: string
  phone: string
  bio: string
  schedule: {
    [key: string]: string[]
  }
}

// Days of the week
const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

// Time slots (30 min intervals from 9:00 to 18:00)
const timeSlots = Array.from({ length: 19 }, (_, i) => {
  const hour = Math.floor(i / 2) + 9
  const minute = (i % 2) * 30
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
})

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedTimes, setSelectedTimes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Load data
  useEffect(() => {
    loadProfessionals()
  }, [])

  // Load professionals from Supabase
  const loadProfessionals = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
      
      if (error) throw error

      setProfessionals(data || [])
      setFilteredProfessionals(data || [])
    } catch (error) {
      console.error('Error loading professionals:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los profesionales",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter professionals
  useEffect(() => {
    if (!searchTerm) {
      setFilteredProfessionals(professionals)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = professionals.filter(
      (professional) =>
        professional.name.toLowerCase().includes(term) ||
        professional.specialty.toLowerCase().includes(term) ||
        professional.email.toLowerCase().includes(term) ||
        professional.phone.includes(term)
    )
    setFilteredProfessionals(filtered)
  }, [professionals, searchTerm])

  // Handle open dialog
  const handleOpenDialog = (professional?: Professional) => {
    setSelectedProfessional(professional || null)
    setIsDialogOpen(true)
  }

  // Handle save professional
  const handleSaveProfessional = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createSupabaseClient()
      const formData = new FormData(e.target as HTMLFormElement)
      const professionalData = {
        name: formData.get("name") as string,
        specialty: formData.get("specialty") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        bio: formData.get("bio") as string,
        schedule: {
          Lunes: [],
          Martes: [],
          Miércoles: [],
          Jueves: [],
          Viernes: []
        }
      }

      if (selectedProfessional) {
        // Update existing professional
        const { error } = await supabase
          .from('professionals')
          .update(professionalData)
          .eq('id', selectedProfessional.id)

        if (error) throw error

        // Update local state
        setProfessionals(professionals.map(professional => 
          professional.id === selectedProfessional.id ? { ...professional, ...professionalData } : professional
        ))

        toast({
          title: "Éxito",
          description: "Profesional actualizado correctamente",
        })
      } else {
        // Create new professional
        const { data, error } = await supabase
          .from('professionals')
          .insert(professionalData)
          .select()
          .single()

        if (error) throw error

        // Update local state
        setProfessionals([...professionals, data])

        toast({
          title: "Éxito",
          description: "Profesional creado correctamente",
        })
      }

      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving professional:', error)
      toast({
        title: "Error",
        description: "No se pudo guardar el profesional",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle delete professional
  const handleDeleteProfessional = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este profesional?")) return
    setIsLoading(true)

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('professionals')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Update local state
      setProfessionals(professionals.filter(professional => professional.id !== id))

      toast({
        title: "Éxito",
        description: "Profesional eliminado correctamente",
      })
    } catch (error) {
      console.error('Error deleting professional:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el profesional",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle open schedule dialog
  const handleOpenScheduleDialog = (professional: any, day: string) => {
    setSelectedProfessional(professional)
    setSelectedDay(day)
    setSelectedTimes(professional.schedule?.[day] || [])
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
  const handleSaveSchedule = async () => {
    if (!selectedProfessional || !selectedDay) return

    try {
      const supabase = createSupabaseClient()
      const schedule = {
        ...selectedProfessional.schedule,
        [selectedDay]: selectedTimes,
      }

      const { error } = await supabase
        .from('professionals')
        .update({ schedule })
        .eq('id', selectedProfessional.id)

      if (error) throw error

      // Actualizar el estado local
      setProfessionals(professionals.map(p => 
        p.id === selectedProfessional.id ? { ...p, schedule } : p
      ))

      setScheduleDialogOpen(false)
      toast({
        title: "Éxito",
        description: "Horario actualizado correctamente",
      })
    } catch (error) {
      console.error('Error saving schedule:', error)
      toast({
        title: "Error",
        description: "No se pudo guardar el horario",
        variant: "destructive",
      })
    }
  }

  // Format schedule for display
  const formatSchedule = (schedule: any) => {
    if (!schedule) return "No disponible"

    const days = Object.keys(schedule)
    if (days.length === 0) return "No disponible"

    return days.map((day) => `${day} (${schedule[day].length} horarios)`).join(", ")
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestión de Profesionales</h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Buscar profesional..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Profesional
          </Button>
        </div>
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
                <TableHead>Biografía</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfessionals.map((professional) => (
                <TableRow key={professional.id}>
                  <TableCell>{professional.name}</TableCell>
                  <TableCell>{professional.specialty}</TableCell>
                  <TableCell>{professional.email}</TableCell>
                  <TableCell>{professional.phone}</TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={professional.bio}>
                      {professional.bio}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(professional)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteProfessional(professional.id)}
                      >
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedProfessional ? "Editar Profesional" : "Nuevo Profesional"}</DialogTitle>
            <DialogDescription>
              {selectedProfessional ? "Modifica los datos del profesional" : "Ingresa los datos del nuevo profesional"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProfessional}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={selectedProfessional?.name}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="specialty">Especialidad</Label>
                <Input
                  id="specialty"
                  name="specialty"
                  defaultValue={selectedProfessional?.specialty}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={selectedProfessional?.email}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={selectedProfessional?.phone}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bio">Biografía</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  defaultValue={selectedProfessional?.bio}
                  placeholder="Biografía del profesional"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
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
            <DialogDescription>
              Selecciona los horarios disponibles para este día
            </DialogDescription>
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

