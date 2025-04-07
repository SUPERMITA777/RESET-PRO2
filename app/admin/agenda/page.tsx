"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, ChevronRight, AlertCircle, Calendar as CalendarIcon, Plus, Pencil, Trash, Search, Clock } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar } from "@/components/ui/calendar"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Zona horaria de Argentina - para futuras implementaciones
const ARGENTINA_TIMEZONE = 'America/Argentina/Buenos_Aires';

// Mock data for boxes
const boxes = ["Box 1", "Box 2", "Box 3", "Box 4", "Box 5"]

// Time slots (30 min intervals from 8:00 to 20:00)
const timeSlots = Array.from({ length: 25 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8
  const minute = (i % 2) * 30
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
})

// Definir colores para los estados de las citas
const statusColors: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  canceled: "bg-red-100 text-red-800"
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
  clients?: {
    name: string
  }
  treatments?: {
    name: string
  }
}

interface Treatment {
  id: number
  name: string
  description?: string
  category?: string
  subtreatments?: Subtreatment[]
}

interface Subtreatment {
  id: number
  treatment_id: number
  name: string
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

interface Professional {
  id: number
  name: string
  specialty: string
}

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [subtreatments, setSubtreatments] = useState<Subtreatment[]>([])
  const [availabilities, setAvailabilities] = useState<TreatmentAvailability[]>([])
  const [availableTreatments, setAvailableTreatments] = useState<Treatment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null)
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
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily")
  const { toast } = useToast()
  const [isCalendarVisible, setIsCalendarVisible] = useState(false)
  const [clientSearchTerm, setClientSearchTerm] = useState("")
  const [clientSearchResults, setClientSearchResults] = useState<Client[]>([])
  const [showClientResults, setShowClientResults] = useState(false)
  const [selectedBox, setSelectedBox] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const supabase = getSupabaseClient()

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const supabase = getSupabaseClient()
        
        // Cargar tratamientos
        const { data: treatmentsData, error: treatmentsError } = await supabase
          .from('treatments')
          .select('*')
        
        if (treatmentsError) throw treatmentsError
        console.log('Tratamientos cargados en Agenda:', treatmentsData)
        setTreatments(treatmentsData || [])

        // Cargar subtratamientos
        const { data: subtreatmentsData, error: subtreatmentsError } = await supabase
          .from('subtreatments')
          .select('*')
        
        if (subtreatmentsError) throw subtreatmentsError
        setSubtreatments(subtreatmentsData || [])

        // Cargar disponibilidad para la fecha seleccionada
        const { data: availabilitiesData, error: availabilitiesError } = await supabase
          .from('treatment_availabilities')
          .select('*')
          .lte('start_date', selectedDate.toISOString().split('T')[0])
          .gte('end_date', selectedDate.toISOString().split('T')[0])

        if (availabilitiesError) throw availabilitiesError
        console.log('Disponibilidades cargadas en Agenda:', availabilitiesData)
        setAvailabilities(availabilitiesData || [])

        // Filtrar tratamientos que tienen disponibilidad para la fecha seleccionada
        const availableTreatments = treatmentsData.filter(treatment => {
          return availabilitiesData.some(availability => 
            availability.treatment_id === treatment.id
          )
        })
        console.log('Tratamientos disponibles:', availableTreatments)

        // Cargar clientes
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
        
        if (clientsError) throw clientsError
        setClients(clientsData || [])

        // Cargar citas para la fecha seleccionada
        loadAppointments(selectedDate);

      } catch (error) {
        console.error('Error loading data:', error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
    
    // Suscribirse a cambios en la tabla 'appointments'
    const appointmentsSubscription = supabase
      .channel('appointments-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'appointments' 
      }, async (payload) => {
        console.log('Cambio detectado en appointments:', payload);
        
        // Recargar las citas para mantener los datos actualizados
        loadAppointments(selectedDate);
      })
      .subscribe();
    
    // Limpieza de la suscripción
    return () => {
      supabase.removeChannel(appointmentsSubscription);
    };
  }, [selectedDate])

  // Cargar citas para una fecha específica
  const loadAppointments = async (date: Date) => {
    const formattedDate = date.toISOString().split("T")[0]
    console.log('Cargando citas para fecha:', formattedDate)

    try {
      // Cargar TODAS las citas para la fecha seleccionada
      const { data, error } = await supabase
        .from("appointments")
        .select("*, clients(name), treatments(name)")
        .eq("date", formattedDate)

      if (error) throw error
      console.log('Citas cargadas:', data?.length || 0, data)
      setAppointments(data || [])
      setFilteredAppointments(data || [])

      // También recargar las disponibilidades para esta fecha
      const { data: availabilitiesData, error: availabilitiesError } = await supabase
        .from('treatment_availabilities')
        .select('*')
        .lte('start_date', formattedDate)
        .gte('end_date', formattedDate)

      if (availabilitiesError) throw availabilitiesError
      console.log('Disponibilidades actualizadas:', availabilitiesData?.length || 0)
      setAvailabilities(availabilitiesData || [])
    } catch (error) {
      console.error("Error loading appointments:", error)
      setError("Error al cargar las citas. Por favor, recarga la página.")
    }
  }

  // Cargar citas para la fecha actual
  useEffect(() => {
    loadAppointments(currentDate)
  }, [currentDate, supabase])

  // Filter appointments based on selected date and search term
  useEffect(() => {
    let filtered = appointments

    // Filter by date
    if (viewMode === "daily") {
      filtered = filtered.filter(app => app.date === format(selectedDate, "yyyy-MM-dd"))
    } else {
      const weekStart = startOfWeek(selectedDate)
      const weekEnd = endOfWeek(selectedDate)
      filtered = filtered.filter(app => {
        const appDate = new Date(app.date)
        return appDate >= weekStart && appDate <= weekEnd
      })
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(app => {
        const client = clients.find(c => c.id === app.client_id)
        const professional = professionals.find(p => p.id === app.professional_id)
        const treatment = treatments.find(t => t.id === app.treatment_id)
        const subtreatment = treatment?.subtreatments?.find((st: Subtreatment) => st.id === app.subtreatment_id)

        return (
          client?.name.toLowerCase().includes(term) ||
          professional?.name.toLowerCase().includes(term) ||
          treatment?.name.toLowerCase().includes(term) ||
          subtreatment?.name.toLowerCase().includes(term) ||
          app.time.includes(term) ||
          app.status.toLowerCase().includes(term)
        )
      })
    }

    setFilteredAppointments(filtered)
  }, [appointments, selectedDate, searchTerm, viewMode, clients, professionals, treatments])

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
    // Si no hay disponibilidades cargadas, consideramos que el slot no está disponible
    if (availabilities.length === 0) {
      console.log(`No hay disponibilidades para box: ${box}, hora: ${time}`)
      return false
    }

    // Verificar si hay alguna disponibilidad para este box y hora
    const slotAvailable = availabilities.some((availability) => {
      // Verificar si la fecha actual está dentro del rango de fechas de disponibilidad
      const currentDateStr = selectedDate.toISOString().split('T')[0]
      const startDateInRange = availability.start_date <= currentDateStr
      const endDateInRange = availability.end_date >= currentDateStr

      // Verificar si el box coincide
      const boxMatches = availability.box === box

      // Verificar si la hora está dentro del rango de horas
      const timeInRange = availability.start_time <= time && availability.end_time >= time

      const isAvailable = startDateInRange && endDateInRange && boxMatches && timeInRange
      
      if (isAvailable) {
        console.log(`Slot disponible - Box: ${box}, Hora: ${time}, Tratamiento: ${availability.treatment_id}, Fecha: ${currentDateStr}`)
      }
      
      return isAvailable
    })

    // Verificar si ya existe una cita en este slot
    if (slotAvailable) {
      const hasAppointment = appointments.some(a => 
        a.date === selectedDate.toISOString().split('T')[0] && 
        a.time === time && 
        a.box === box
      );
      
      if (hasAppointment) {
        console.log(`Slot con cita existente - Box: ${box}, Hora: ${time}`);
        return false;
      }
    }

    return slotAvailable
  }

  // Función para manejar el clic en un slot para crear una nueva cita
  const handleSlotClick = (box: string, time: string) => {
    // Verificar si ya existe una cita para este slot
    const appointment = appointments.find(a => 
      a.box === box && 
      a.date === selectedDate.toISOString().split('T')[0] &&
      a.time === time
    );

    // Si existe una cita, seleccionarla para editar
    if (appointment) {
      setSelectedAppointment(appointment);
      const treatment = treatments.find(t => t.id === appointment.treatment_id);
      setSelectedTreatment(treatment || null);
      const subtreatmentId = appointment.subtreatment_id.toString();
      setSelectedSubtreatment(subtreatmentId);
      setSelectedClient(appointment.client_id.toString());
      setClientSearchTerm(clients.find(c => c.id === appointment.client_id)?.name || "");
      setSelectedDate(new Date(appointment.date));
      const timeParts = appointment.time.split(':');
      const slot = new Date();
      slot.setHours(parseInt(timeParts[0], 10), parseInt(timeParts[1], 10), 0, 0);
      setSelectedSlot(slot);
      setSelectedBox(appointment.box);
      setIsDialogOpen(true);
    } else {
      // Verificar si el slot está disponible
      if (isSlotAvailable(box, time)) {
        // Encontrar tratamientos disponibles para este slot
        const availableTreatmentsForSlot = availabilities
          .filter(a => 
            a.box === box && 
            a.start_time <= time &&
            a.end_time >= time &&
            a.start_date <= selectedDate.toISOString().split('T')[0] &&
            a.end_date >= selectedDate.toISOString().split('T')[0]
          )
          .map(a => treatments.find(t => t.id === a.treatment_id))
          .filter(Boolean) as Treatment[];

        if (availableTreatmentsForSlot.length > 0) {
          // Si solo hay un tratamiento disponible, seleccionarlo automáticamente
          setSelectedTreatment(availableTreatmentsForSlot[0]);
          setSelectedSubtreatment("");
          setSelectedClient("");
          setClientSearchTerm("");
          const timeParts = time.split(':');
          const slot = new Date();
          slot.setHours(parseInt(timeParts[0], 10), parseInt(timeParts[1], 10), 0, 0);
          setSelectedSlot(slot);
          setSelectedBox(box);
          setSelectedAppointment(null);
          setIsDialogOpen(true);
        } else {
          toast({
            title: "Sin tratamientos",
            description: "No hay tratamientos disponibles para este horario",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "No disponible",
          description: "Este horario no está disponible",
          variant: "destructive",
        });
      }
    }
  };

  // Get appointment for a specific slot
  const getAppointment = (box: string, time: string) => {
    return appointments.find((app) => app.box === box && app.time === time && app.date === apiFormattedDate)
  }

  // Get status class for a slot
  const getStatusClass = (box: string, time: string): string => {
    const appointment = getAppointment(box, time)
    if (appointment) {
      return statusColors[appointment.status] || ""
    }
    if (isSlotAvailable(box, time)) {
      return statusColors.available
    }
    return ""
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
          a.box === selectedSlot.toISOString().split("T")[0] &&
          a.start_time <= selectedSlot.toISOString().split("T")[1] &&
          a.end_time >= selectedSlot.toISOString().split("T")[1] &&
          a.start_date <= apiFormattedDate &&
          a.end_date >= apiFormattedDate,
      )
      .map((a) => a.treatment_id)

    // Obtener los tratamientos completos
    return treatments.filter((t) => availableTreatmentIds.includes(t.id))
  }

  // Obtener subtratamientos para un tratamiento específico
  const getSubtreatments = (treatmentId: number): Subtreatment[] => {
    if (!treatmentId) return [];
    
    // Filtrar los subtratamientos que pertenecen al tratamiento seleccionado
    return subtreatments.filter(s => s.treatment_id === treatmentId);
  }

  // Get price for selected subtreatment
  const getSubtreatmentPrice = () => {
    if (!selectedSubtreatment) return 0
    const subtreatment = subtreatments.find((s) => s.id === Number.parseInt(selectedSubtreatment))
    return subtreatment ? subtreatment.price : 0
  }

  // Guardar cita
  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.target as HTMLFormElement)
      const clientId = Number(formData.get("clientName"))
      const subtreatmentId = Number(formData.get("subtreatmentId"))
      const notes = formData.get("notes") as string
      const deposit = Number(formData.get("deposit"))
      const status = formData.get("status") as string
      const date = formData.get("date") as string
      const time = formData.get("time") as string
      const box = formData.get("box") as string

      // Obtener el precio del subtratamiento
      const subtreatment = subtreatments.find((s) => s.id === subtreatmentId);
      const price = subtreatment ? subtreatment.price : 0;

      // Verificar que todos los campos obligatorios estén presentes
      if (!clientId || !subtreatmentId || !date || !time || !box || !status) {
        setError("Todos los campos obligatorios deben estar completos")
        setLoading(false)
        return
      }

      // Verificar que el tratamiento exista
      if (!selectedTreatment) {
        setError("Debe seleccionar un tratamiento válido")
        setLoading(false)
        return
      }

      // Verificar si el horario ya está ocupado (solo para nuevas citas)
      if (!selectedAppointment) {
        const isTimeSlotTaken = appointments.some(appointment => 
          appointment.date === date && 
          appointment.time === time && 
          appointment.box === box
        );

        if (isTimeSlotTaken) {
          setError("Este horario ya está ocupado. Por favor, selecciona otro horario.");
          setLoading(false);
          return;
        }
      }

      // Si estamos editando una cita existente
      if (selectedAppointment) {
        const { error } = await supabase
          .from("appointments")
          .update({
            client_id: clientId,
            treatment_id: selectedTreatment.id,
            subtreatment_id: subtreatmentId,
            date,
            time,
            box,
            status,
            deposit,
            price,
            notes,
          })
          .eq("id", selectedAppointment.id)

        if (error) throw error

        toast({
          title: "Éxito",
          description: "Cita actualizada correctamente",
        })
      } else {
        // Si estamos creando una nueva cita
        const { error } = await supabase.from("appointments").insert({
          client_id: clientId,
          professional_id: 1, // Por ahora usamos un profesional por defecto
          treatment_id: selectedTreatment.id,
          subtreatment_id: subtreatmentId,
          date,
          time,
          box,
          status,
          deposit,
          price,
          notes,
        })

        if (error) throw error

        toast({
          title: "Éxito",
          description: "Cita creada correctamente",
        })
      }

      // Recargar las citas para mantener los datos actualizados
      await loadAppointments(selectedDate)

      // Cerrar el diálogo y limpiar la selección
      setIsDialogOpen(false)
      setSelectedSlot(null)
      setSelectedTreatment(null)
      setSelectedAppointment(null)
      setSelectedClient("")
      setSelectedSubtreatment("")
      setClientSearchTerm("")
    } catch (error) {
      console.error("Error al guardar la cita:", error)
      setError("Error al guardar la cita. Por favor, inténtalo de nuevo.")
    } finally {
      setLoading(false)
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

  // Generar slots de tiempo de 30 minutos entre 8:00 y 20:00
  const timeSlots = useMemo(() => {
    const slots: Date[] = []
    const startTime = new Date(selectedDate)
    startTime.setHours(8, 0, 0, 0)
    const endTime = new Date(selectedDate)
    endTime.setHours(20, 0, 0, 0)

    while (startTime < endTime) {
      slots.push(new Date(startTime))
      startTime.setMinutes(startTime.getMinutes() + 30)
    }

    return slots
  }, [selectedDate])

  // Navegación de fechas
  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
    loadAppointments(newDate)
  }

  const handleNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
    loadAppointments(newDate)
  }

  // Cuando se selecciona un día en el calendario
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      loadAppointments(date)
      
      // Actualizar también la disponibilidad de tratamientos para esta nueva fecha
      const formattedDate = date.toISOString().split('T')[0]
      console.log('Actualizando disponibilidad para fecha:', formattedDate)
      
      supabase
        .from('treatment_availabilities')
        .select('*')
        .lte('start_date', formattedDate)
        .gte('end_date', formattedDate)
        .then(({ data, error }) => {
          if (error) {
            console.error('Error cargando disponibilidades:', error)
            return
          }
          
          console.log('Disponibilidades actualizadas:', data)
          setAvailabilities(data || [])
          
          // Actualizar tratamientos disponibles
          const availableTreatments = treatments.filter(treatment => {
            return data?.some(availability => 
              availability.treatment_id === treatment.id
            )
          })
          
          setAvailableTreatments(availableTreatments)
        })
    }
  }

  // Formatear fecha para mostrar
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Mostrar horas y slots disponibles para la vista diaria
  const renderDailyView = () => {
    const hours = []
    for (let i = 9; i <= 20; i++) {
      hours.push(`${i}:00`)
      hours.push(`${i}:30`)
    }

    console.log('Renderizando vista diaria con', appointments.length, 'citas')

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 bg-gray-100 w-20">Hora</th>
              {boxes.map(box => (
                <th key={box} className="border p-2 bg-gray-100 w-40">
                  {box}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map(time => (
              <tr key={time}>
                <td className="border p-2 text-center font-medium">{time}</td>
                {boxes.map(box => {
                  const appointment = getAppointment(box, time)
                  const statusClass = getStatusClass(box, time)
                  const isAvailable = isSlotAvailable(box, time)

                  return (
                    <td 
                      key={`${box}-${time}`} 
                      className={`border p-2 ${statusClass} ${
                        isAvailable && !appointment ? "bg-green-50 cursor-pointer hover:bg-green-100" : 
                        appointment ? "cursor-pointer hover:bg-blue-50" : "bg-gray-50"
                      }`}
                      onClick={() => handleSlotClick(box, time)}
                    >
                      {appointment ? (
                        <div className="text-xs text-center w-full">
                          {/* Mostrar tratamiento y cliente */}
                          <div className="font-medium truncate">
                            {appointment.treatments?.name || treatments.find(t => t.id === appointment.treatment_id)?.name || ""}
                          </div>
                          <div className="text-gray-700 truncate">
                            {appointment.clients?.name || clients.find(c => c.id === appointment.client_id)?.name || ""}
                          </div>
                          <div className="text-xs mt-1 capitalize font-semibold">
                            {appointment.status === 'pending' && 'Pendiente'}
                            {appointment.status === 'confirmed' && 'Confirmado'}
                            {appointment.status === 'completed' && 'Completado'}
                            {appointment.status === 'canceled' && 'Cancelado'}
                          </div>
                        </div>
                      ) : isAvailable ? (
                        <div className="text-xs text-center text-green-600">Disponible</div>
                      ) : (
                        <div className="text-xs text-center text-gray-400">—</div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>
  }

  return (
    <div className="container mx-auto py-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Agenda</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={goToPreviousDay} size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <Button variant="outline" onClick={goToNextDay} size="sm">
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4" />
            <Input
              type="date"
              value={format(selectedDate, "yyyy-MM-dd")}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : new Date()
                setSelectedDate(date)
                setCurrentDate(date)
                loadAppointments(date)
              }}
              className="w-auto"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-60"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Agenda - {formattedDate}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {renderDailyView()}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant={viewMode === "daily" ? "default" : "outline"}
            onClick={() => setViewMode("daily")}
          >
            Día
          </Button>
          <Button
            variant={viewMode === "weekly" ? "default" : "outline"}
            onClick={() => setViewMode("weekly")}
          >
            Semana
          </Button>
          <Button onClick={() => setIsCalendarVisible(!isCalendarVisible)}>
            <CalendarIcon className="h-4 w-4 mr-2" />
            {isCalendarVisible ? "Ocultar Calendario" : "Mostrar Calendario"}
          </Button>
        </div>
      </div>

      {isCalendarVisible && (
        <Card>
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateChange}
              className="rounded-md border"
              locale={es}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {viewMode === "daily" ? (
            renderDailyView()
          ) : (
            <div className="grid grid-cols-[100px_repeat(auto-fill,minmax(150px,1fr))]">
              <div className="border-r">
                {timeSlots.map((slot) => (
                  <div
                    key={slot.toISOString()}
                    className="h-12 border-b flex items-center justify-center text-sm"
                  >
                    {slot.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                ))}
              </div>

              {eachDayOfInterval({
                start: startOfWeek(selectedDate),
                end: endOfWeek(selectedDate)
              }).map(day => (
                <div key={day.toISOString()} className="border-r">
                  <div className="h-12 border-b flex items-center justify-center font-medium text-sm">
                    {format(day, "EEE d", { locale: es })}
                  </div>
                  {timeSlots.map((slot) => {
                    const slotTime = slot.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                    const appointment = appointments.find(a => 
                      a.date === format(day, "yyyy-MM-dd") &&
                      a.time === slotTime
                    )

                    return (
                      <div
                        key={slot.toISOString()}
                        className={`h-12 border-b flex items-center justify-center text-sm cursor-pointer
                          ${appointment ? `bg-${statusColors[appointment.status]}-50` : 'bg-gray-50'}`}
                        onClick={() => {
                          setSelectedSlot(slot)
                          setSelectedDate(day)
                          setIsDialogOpen(true)
                        }}
                      >
                        {appointment ? (
                          <div className="text-xs text-center">
                            <div className="font-medium">{appointment.client_id}</div>
                            <div className="text-gray-500">{appointment.status}</div>
                          </div>
                        ) : (
                          <div className="text-gray-400">No disponible</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAppointment ? "Editar Cita" : "Nueva Cita"}</DialogTitle>
            <DialogDescription>
              {selectedAppointment 
                ? "Modifica los datos de la cita" 
                : selectedTreatment && selectedDate && selectedSlot
                  ? `${selectedTreatment.name} - ${format(selectedDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })} - ${selectedSlot?.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${selectedBox}`
                  : "Ingresa los datos de la nueva cita"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveAppointment} className="overflow-y-auto max-h-[70vh] pr-2">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="clientSearch">Cliente</Label>
                <div className="relative">
                  <Input
                    id="clientSearch"
                    placeholder="Buscar cliente por nombre..."
                    value={clientSearchTerm}
                    onChange={(e) => {
                      setClientSearchTerm(e.target.value);
                      setClientSearchResults(
                        clients.filter(c => 
                          c.name.toLowerCase().includes(e.target.value.toLowerCase()) ||
                          c.phone.includes(e.target.value)
                        )
                      );
                      setShowClientResults(true);
                    }}
                  />
                  {showClientResults && clientSearchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {clientSearchResults.map(client => (
                        <div 
                          key={client.id} 
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setSelectedClient(client.id.toString());
                            setClientSearchTerm(client.name);
                            setShowClientResults(false);
                          }}
                        >
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-gray-500">{client.phone}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <input 
                    type="hidden" 
                    name="clientName" 
                    value={selectedClient} 
                    required 
                  />
                  {selectedClient && (
                    <div className="text-sm text-green-600">
                      Cliente seleccionado: {clients.find(c => c.id.toString() === selectedClient)?.name}
                    </div>
                  )}
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsNewClientDialogOpen(true)}
                  >
                    Nuevo Cliente
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="treatmentId">Tratamiento</Label>
                <select
                  id="treatmentId"
                  name="treatmentId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedTreatment?.id || ""}
                  onChange={(e) => {
                    const treatmentId = Number(e.target.value);
                    const treatment = treatments.find(t => t.id === treatmentId);
                    setSelectedTreatment(treatment || null);
                    setSelectedSubtreatment("");
                  }}
                  required
                >
                  <option value="">Selecciona un tratamiento</option>
                  {treatments.map((treatment) => (
                    <option key={treatment.id} value={treatment.id}>
                      {treatment.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="subtreatmentId">Subtratamiento</Label>
                <select
                  id="subtreatmentId"
                  name="subtreatmentId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedSubtreatment}
                  onChange={(e) => {
                    setSelectedSubtreatment(e.target.value);
                    
                    // Actualizar el precio automáticamente
                    const subtreatmentId = Number(e.target.value);
                    const subtreatment = subtreatments.find(s => s.id === subtreatmentId);
                    if (subtreatment) {
                      const priceInput = document.getElementById('price') as HTMLInputElement;
                      if (priceInput) {
                        priceInput.value = subtreatment.price.toString();
                      }
                    }
                  }}
                  required
                  disabled={!selectedTreatment}
                >
                  <option value="">Selecciona un subtratamiento</option>
                  {getSubtreatments(selectedTreatment?.id || 0).map((subtreatment) => (
                    <option key={subtreatment.id} value={subtreatment.id}>
                      {subtreatment.name} - ${subtreatment.price}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Precio</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={
                      selectedAppointment?.price || 
                      (selectedSubtreatment ? 
                        subtreatments.find(s => s.id === Number(selectedSubtreatment))?.price || 0 
                        : 0)
                    }
                    readOnly
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="deposit">Seña</Label>
                  <Input
                    id="deposit"
                    name="deposit"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={selectedAppointment?.deposit || "0"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={selectedAppointment?.date || format(selectedDate, "yyyy-MM-dd")}
                    required
                    readOnly
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="time">Hora</Label>
                  <Input
                    id="time"
                    name="time"
                    type="time"
                    defaultValue={selectedAppointment?.time || selectedSlot?.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    required
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="box">Box</Label>
                  <Input
                    id="box"
                    name="box"
                    type="text"
                    defaultValue={selectedAppointment?.box || selectedBox || ""}
                    required
                    readOnly
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="status">Estado</Label>
                  <select
                    id="status"
                    name="status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue={selectedAppointment?.status || "pending"}
                    required
                  >
                    <option value="pending">Pendiente</option>
                    <option value="confirmed">Confirmada</option>
                    <option value="canceled">Cancelada</option>
                    <option value="completed">Completada</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={selectedAppointment?.notes || ""}
                  placeholder="Notas sobre la cita"
                />
              </div>
            </div>

            <DialogFooter>
              {selectedAppointment && (
                <Button type="button" variant="outline" className="mr-auto" onClick={() => setIsDeleteDialogOpen(true)}>
                  Eliminar
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para nuevo cliente */}
      <Dialog open={isNewClientDialogOpen} onOpenChange={setIsNewClientDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
            <DialogDescription>
              Ingresa los datos del nuevo cliente
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const name = formData.get("name") as string;
            const phone = formData.get("phone") as string;
            const email = formData.get("email") as string;

            try {
              const newClient = await handleCreateClient(name, phone, email);
              if (newClient) {
                setSelectedClient(newClient.id.toString());
                setClientSearchTerm(newClient.name);
                setIsNewClientDialogOpen(false);
                toast({
                  title: "Éxito",
                  description: "Cliente creado correctamente",
                });
              }
            } catch (error) {
              console.error("Error creating client:", error);
              toast({
                title: "Error",
                description: "No se pudo crear el cliente",
                variant: "destructive",
              });
            }
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Nombre completo"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Número de teléfono"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Correo electrónico"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNewClientDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Crear Cliente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar cita */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta cita? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteAppointment}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

