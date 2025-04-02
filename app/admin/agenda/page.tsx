"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Mock data for boxes
const boxes = ["Box 1", "Box 2", "Box 3", "Box 4", "Box 5"]

// Time slots (30 min intervals from 8:00 to 20:00)
const timeSlots = Array.from({ length: 25 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8
  const minute = (i % 2) * 30
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
})

// Status color mapping
const statusColors = {
  available: "bg-green-100 hover:bg-green-200",
  pending: "bg-yellow-100 hover:bg-yellow-200",
  confirmed: "bg-blue-100 hover:bg-blue-200",
  completed: "bg-gray-100 hover:bg-gray-200",
  canceled: "bg-red-100 hover:bg-red-200",
}

// Tipos de datos
interface Appointment {
  id: number
  date: string
  time: string
  client_id: number
  professional_id: number
  treatment_id: number
  subtreatment_id: number
  box: string
  status: string
  deposit: number
  price: number
  notes: string
}

interface Treatment {
  id: number
  name: string
  description: string
  duration: number
}

interface Subtreatment {
  id: number
  treatment_id: number
  name: string
  description: string
  duration: number
  price: number
}

interface TreatmentAvailability {
  id: number
  treatment_id: number
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  box: string
}

interface Client {
  id: number
  name: string
  phone: string
  email: string
  history: string
  last_visit: string
}

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [subtreatments, setSubtreatments] = useState<Subtreatment[]>([])
  const [availabilities, setAvailabilities] = useState<TreatmentAvailability[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ box: string; time: string } | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [selectedTreatment, setSelectedTreatment] = useState<string>("")
  const [selectedSubtreatment, setSelectedSubtreatment] = useState<string>("")
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCreateAnywhereDialogOpen, setIsCreateAnywhereDialogOpen] = useState(false)
  const [newAppointmentTime, setNewAppointmentTime] = useState("09:00")
  const [newAppointmentBox, setNewAppointmentBox] = useState(boxes[0])
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false)
  const [newClientName, setNewClientName] = useState("")
  const [newClientPhone, setNewClientPhone] = useState("")
  const [newClientEmail, setNewClientEmail] = useState("")

  const supabase = getSupabaseClient()

  // Cargar datos iniciales
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        // Cargar tratamientos
        const { data: treatmentsData, error: treatmentsError } = await supabase.from("treatments").select("*")

        if (treatmentsError) throw treatmentsError
        setTreatments(treatmentsData || [])

        // Cargar subtratamientos
        const { data: subtreatmentsData, error: subtreatmentsError } = await supabase.from("subtreatments").select("*")

        if (subtreatmentsError) throw subtreatmentsError
        setSubtreatments(subtreatmentsData || [])

        // Cargar clientes
        const { data: clientsData, error: clientsError } = await supabase.from("clients").select("*")

        if (clientsError) throw clientsError
        setClients(clientsData || [])

        // Cargar disponibilidades
        const { data: availabilitiesData, error: availabilitiesError } = await supabase
          .from("treatment_availabilities")
          .select("*")

        if (availabilitiesError) throw availabilitiesError
        setAvailabilities(availabilitiesData || [])
      } catch (error) {
        console.error("Error loading data:", error)
        setError("Error al cargar los datos. Por favor, recarga la página.")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  // Cargar citas para la fecha actual
  useEffect(() => {
    async function loadAppointments() {
      const formattedDate = currentDate.toISOString().split("T")[0]

      try {
        const { data, error } = await supabase.from("appointments").select("*").eq("date", formattedDate)

        if (error) throw error
        setAppointments(data || [])
      } catch (error) {
        console.error("Error loading appointments:", error)
        setError("Error al cargar las citas. Por favor, recarga la página.")
      }
    }

    loadAppointments()
  }, [currentDate, supabase])

  // Format date for display
  const formattedDate = currentDate.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Format date for API
  const apiFormattedDate = currentDate.toISOString().split("T")[0]

  // Navigate to previous day
  const goToPreviousDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 1)
    setCurrentDate(newDate)
  }

  // Navigate to next day
  const goToNextDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 1)
    setCurrentDate(newDate)
  }

  const isSlotAvailable = (box: string, time: string): boolean => {
    // Si no hay disponibilidades cargadas, consideramos que el slot está disponible
    if (availabilities.length === 0) return true

    // Verificar si hay alguna disponibilidad para este box y hora
    return availabilities.some((availability) => {
      // Verificar si la fecha actual está dentro del rango de fechas de disponibilidad
      const currentDateStr = apiFormattedDate
      const startDateInRange = availability.start_date <= currentDateStr
      const endDateInRange = availability.end_date >= currentDateStr

      // Verificar si el box coincide
      const boxMatches = availability.box === box

      // Verificar si la hora está dentro del rango de horas
      const timeInRange = availability.start_time <= time && availability.end_time >= time

      return startDateInRange && endDateInRange && boxMatches && timeInRange
    })
  }

  // Handle slot click
  const handleSlotClick = (box: string, time: string) => {
    // Check if there's an existing appointment
    const existingAppointment = appointments.find(
      (app) => app.box === box && app.time === time && app.date === apiFormattedDate,
    )

    if (existingAppointment) {
      setSelectedAppointment(existingAppointment)
    } else {
      setSelectedAppointment(null)
      setSelectedTreatment("")
      setSelectedSubtreatment("")
      setSelectedClient("")
    }

    setSelectedSlot({ box, time })
    setIsDialogOpen(true)
    setError(null)
  }

  // Get appointment for a specific slot
  const getAppointment = (box: string, time: string) => {
    return appointments.find((app) => app.box === box && app.time === time && app.date === apiFormattedDate)
  }

  // Get status class for a slot
  const getStatusClass = (box: string, time: string) => {
    const appointment = getAppointment(box, time)
    if (!appointment) {
      // Verificar si el slot está disponible
      return isSlotAvailable(box, time) ? statusColors.available : "bg-gray-50"
    }
    return statusColors[appointment.status as keyof typeof statusColors] || "bg-gray-50"
  }

  // Get treatment name for a slot
  const getTreatmentName = (box: string, time: string) => {
    // Si hay una cita, mostrar el nombre del tratamiento
    const appointment = getAppointment(box, time)
    if (appointment) {
      const treatment = treatments.find((t) => t.id === appointment.treatment_id)
      return treatment ? treatment.name : ""
    }

    // Si no hay cita pero el slot está disponible, mostrar los tratamientos disponibles
    if (isSlotAvailable(box, time)) {
      // Obtener los IDs de tratamientos disponibles para este slot
      const availableTreatmentIds = availabilities
        .filter(
          (a) =>
            a.box === box &&
            a.start_time <= time &&
            a.end_time >= time &&
            a.start_date <= apiFormattedDate &&
            a.end_date >= apiFormattedDate,
        )
        .map((a) => a.treatment_id)

      // Obtener los nombres de los tratamientos
      const availableTreatmentNames = treatments.filter((t) => availableTreatmentIds.includes(t.id)).map((t) => t.name)

      if (availableTreatmentNames.length === 0) return ""
      if (availableTreatmentNames.length === 1) return availableTreatmentNames[0]
      return `${availableTreatmentNames.length} tratamientos`
    }

    return ""
  }

  // Get available treatments for the selected slot
  const getAvailableTreatmentsForSlot = () => {
    if (!selectedSlot) return []

    // Obtener los IDs de tratamientos disponibles para este slot
    const availableTreatmentIds = availabilities
      .filter(
        (a) =>
          a.box === selectedSlot.box &&
          a.start_time <= selectedSlot.time &&
          a.end_time >= selectedSlot.time &&
          a.start_date <= apiFormattedDate &&
          a.end_date >= apiFormattedDate,
      )
      .map((a) => a.treatment_id)

    // Obtener los tratamientos completos
    return treatments.filter((t) => availableTreatmentIds.includes(t.id))
  }

  // Get subtreatments for selected treatment
  const getSubtreatments = () => {
    if (!selectedTreatment) return []
    return subtreatments.filter((s) => s.treatment_id === Number.parseInt(selectedTreatment))
  }

  // Get price for selected subtreatment
  const getSubtreatmentPrice = () => {
    if (!selectedSubtreatment) return 0
    const subtreatment = subtreatments.find((s) => s.id === Number.parseInt(selectedSubtreatment))
    return subtreatment ? subtreatment.price : 0
  }

  // Handle save appointment
  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedSlot) return

    const formData = new FormData(e.target as HTMLFormElement)
    const clientId = Number.parseInt(formData.get("clientName") as string)
    const clientPhone = formData.get("clientPhone") as string
    const treatmentId = Number.parseInt(formData.get("treatmentId") as string)
    const subtreatmentId = Number.parseInt(formData.get("subtreatmentId") as string)
    const notes = formData.get("notes") as string
    const deposit = Number.parseFloat(formData.get("deposit") as string) || 0
    const status = formData.get("status") as string

    // Validar que el slot esté disponible
    if (!isSlotAvailable(selectedSlot.box, selectedSlot.time)) {
      setError("Este horario no está disponible para reservas.")
      return
    }

    // Obtener el precio del subtratamiento
    const subtreatment = subtreatments.find((s) => s.id === subtreatmentId)
    const price = subtreatment ? subtreatment.price : 0

    try {
      if (selectedAppointment) {
        // Actualizar cita existente
        const { error } = await supabase
          .from("appointments")
          .update({
            client_id: clientId,
            treatment_id: treatmentId,
            subtreatment_id: subtreatmentId,
            notes,
            deposit,
            price,
            status,
          })
          .eq("id", selectedAppointment.id)

        if (error) throw error

        // Actualizar el estado local
        setAppointments(
          appointments.map((app) =>
            app.id === selectedAppointment.id
              ? {
                  ...app,
                  client_id: clientId,
                  treatment_id: treatmentId,
                  subtreatment_id: subtreatmentId,
                  notes,
                  deposit,
                  price,
                  status,
                }
              : app,
          ),
        )
      } else {
        // Crear nueva cita
        const { data, error } = await supabase
          .from("appointments")
          .insert({
            date: apiFormattedDate,
            time: selectedSlot.time,
            client_id: clientId,
            professional_id: 1, // Por defecto asignamos al primer profesional
            treatment_id: treatmentId,
            subtreatment_id: subtreatmentId,
            box: selectedSlot.box,
            status,
            deposit,
            price,
            notes,
          })
          .select()

        if (error) throw error

        // Actualizar el estado local
        if (data && data.length > 0) {
          setAppointments([...appointments, data[0]])
        }
      }

      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error saving appointment:", error)
      setError("Error al guardar la cita. Por favor, inténtalo de nuevo.")
    }
  }

  // Crear nuevo cliente
  const handleCreateClient = async (name: string, phone: string, email = "") => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .insert({
          name,
          phone,
          email,
          history: "",
          last_visit: apiFormattedDate,
        })
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        // Actualizar la lista de clientes
        setClients([...clients, data[0]])
        return data[0]
      }

      return null
    } catch (error) {
      console.error("Error creating client:", error)
      setError("Error al crear el cliente. Por favor, inténtalo de nuevo.")
      return null
    }
  }

  // Handle delete appointment
  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return
    setError(null)

    try {
      const { error } = await supabase.from("appointments").delete().eq("id", selectedAppointment.id)

      if (error) throw error

      // Actualizar el estado local
      setAppointments(appointments.filter((app) => app.id !== selectedAppointment.id))
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error deleting appointment:", error)
      setError("Error al eliminar la cita. Por favor, inténtalo de nuevo.")
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Date navigation */}
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={goToPreviousDay}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Día Anterior
        </Button>

        <div className="flex flex-col items-center">
          <h2 className="text-xl font-semibold capitalize">{formattedDate}</h2>
          <Button
            variant="default"
            className="mt-2 bg-[#e07a5f] hover:bg-[#c85a3f]"
            onClick={() => {
              setSelectedAppointment(null)
              setSelectedTreatment("")
              setSelectedSubtreatment("")
              setSelectedClient("")
              setSelectedSlot(null)
              setIsCreateAnywhereDialogOpen(true)
            }}
          >
            Crear Turno Libre
          </Button>
        </div>

        <Button variant="outline" onClick={goToNextDay}>
          Día Siguiente
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Agenda grid */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-[100px_repeat(5,1fr)] gap-2">
            {/* Time column */}
            <div className="font-semibold">Hora</div>

            {/* Box headers */}
            {boxes.map((box) => (
              <div key={box} className="font-semibold text-center">
                {box}
              </div>
            ))}

            {/* Time slots */}
            {timeSlots.map((time) => (
              <React.Fragment key={time}>
                <div className="py-2 text-sm">{time}</div>

                {/* Box slots */}
                {boxes.map((box) => {
                  const appointment = getAppointment(box, time)
                  const treatmentName = getTreatmentName(box, time)
                  const isAvailable = isSlotAvailable(box, time)

                  return (
                    <div
                      key={`${box}-${time}`}
                      className={`p-2 text-xs rounded ${isAvailable ? "cursor-pointer" : "cursor-not-allowed opacity-50"} min-h-[40px] ${getStatusClass(box, time)}`}
                      onClick={() => isAvailable && handleSlotClick(box, time)}
                      title={isAvailable ? "Disponible para reserva" : "No disponible"}
                    >
                      {appointment ? (
                        <>
                          <div className="font-semibold">
                            {clients.find((c) => c.id === appointment.client_id)?.name || "Cliente"}
                          </div>
                          <div>{treatmentName}</div>
                        </>
                      ) : treatmentName ? (
                        <div className="text-gray-500 italic">{treatmentName}</div>
                      ) : null}
                    </div>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Appointment dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedAppointment ? "Editar Turno" : "Nuevo Turno"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveAppointment}>
            <div className="grid gap-4 py-4">
              {selectedSlot && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Box</Label>
                    <Input value={selectedSlot.box} readOnly />
                  </div>
                  <div>
                    <Label>Hora</Label>
                    <Input value={selectedSlot.time} readOnly />
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="clientSelect">Cliente</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setIsNewClientDialogOpen(true)}
                  >
                    + Nuevo Cliente
                  </Button>
                </div>
                <Select
                  name="clientName"
                  defaultValue={selectedAppointment ? selectedAppointment.client_id.toString() : ""}
                  onValueChange={setSelectedClient}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="clientPhone">Teléfono</Label>
                <Input
                  id="clientPhone"
                  name="clientPhone"
                  defaultValue={
                    selectedAppointment ? clients.find((c) => c.id === selectedAppointment.client_id)?.phone || "" : ""
                  }
                  placeholder="Teléfono del cliente"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="treatmentId">Tratamiento</Label>
                <Select
                  name="treatmentId"
                  defaultValue={selectedAppointment ? selectedAppointment.treatment_id.toString() : ""}
                  onValueChange={setSelectedTreatment}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tratamiento" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTreatmentsForSlot().map((treatment) => (
                      <SelectItem key={treatment.id} value={treatment.id.toString()}>
                        {treatment.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="subtreatmentId">Subtratamiento</Label>
                <Select
                  name="subtreatmentId"
                  defaultValue={selectedAppointment ? selectedAppointment.subtreatment_id.toString() : ""}
                  onValueChange={setSelectedSubtreatment}
                  disabled={!selectedTreatment}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar subtratamiento" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSubtreatments().map((subtreatment) => (
                      <SelectItem key={subtreatment.id} value={subtreatment.id.toString()}>
                        {subtreatment.name} - ${subtreatment.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deposit">Seña</Label>
                  <Input id="deposit" name="deposit" type="number" defaultValue={selectedAppointment?.deposit || 0} />
                </div>
                <div>
                  <Label htmlFor="price">Precio</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={selectedSubtreatment ? getSubtreatmentPrice() : selectedAppointment?.price || 0}
                    readOnly
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Estado</Label>
                <Select name="status" defaultValue={selectedAppointment?.status || "pending"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Reservado</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                    <SelectItem value="canceled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Observaciones</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={selectedAppointment?.notes || ""}
                  placeholder="Notas adicionales"
                />
              </div>
            </div>

            <DialogFooter className="flex justify-between">
              {selectedAppointment && (
                <Button type="button" variant="destructive" onClick={handleDeleteAppointment}>
                  Eliminar
                </Button>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar</Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para crear turno sin restricciones */}
      <Dialog open={isCreateAnywhereDialogOpen} onOpenChange={setIsCreateAnywhereDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Turno Libre</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              setSelectedSlot({ box: newAppointmentBox, time: newAppointmentTime })
              setIsCreateAnywhereDialogOpen(false)
              setIsDialogOpen(true)
            }}
          >
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newAppointmentBox">Box</Label>
                  <Select value={newAppointmentBox} onValueChange={setNewAppointmentBox} name="newAppointmentBox">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar box" />
                    </SelectTrigger>
                    <SelectContent>
                      {boxes.map((box) => (
                        <SelectItem key={box} value={box}>
                          {box}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="newAppointmentTime">Hora</Label>
                  <Select value={newAppointmentTime} onValueChange={setNewAppointmentTime} name="newAppointmentTime">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar hora" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateAnywhereDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Continuar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para crear un nuevo cliente */}
      <Dialog open={isNewClientDialogOpen} onOpenChange={setIsNewClientDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault()

              if (!newClientName || !newClientPhone) {
                setError("El nombre y teléfono son obligatorios")
                return
              }

              const client = await handleCreateClient(newClientName, newClientPhone, newClientEmail)

              if (client) {
                setSelectedClient(client.id.toString())
                setNewClientName("")
                setNewClientPhone("")
                setNewClientEmail("")
                setIsNewClientDialogOpen(false)
              }
            }}
          >
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="newClientName">Nombre</Label>
                <Input
                  id="newClientName"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Nombre del cliente"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="newClientPhone">Teléfono</Label>
                <Input
                  id="newClientPhone"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="Teléfono del cliente"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="newClientEmail">Email (opcional)</Label>
                <Input
                  id="newClientEmail"
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="Email del cliente"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNewClientDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar Cliente</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

