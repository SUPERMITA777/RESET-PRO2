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
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addDays, isAfter, isBefore, isEqual, parse, addMinutes } from "date-fns"
import { es } from "date-fns/locale"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

// Convertir hora (HH:MM) a minutos totales desde medianoche
const convertTimeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Obtener el nombre del día en inglés para acceder a la propiedad de disponibilidad
const getDayName = (date: Date): keyof TreatmentAvailability => {
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return dayNames[date.getDay()] as keyof TreatmentAvailability;
};

// Zona horaria de Argentina - para futuras implementaciones
const ARGENTINA_TIMEZONE = 'America/Argentina/Buenos_Aires';

// Mock data for boxes
const boxes = ["Box 1", "Box 2", "Box 3", "Box 4", "Box 5"]

// Time slots (30 min intervals from 8:00 to 20:00)
const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8
  const minute = (i % 2) * 30
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
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
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedBox, setSelectedBox] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily")
  const { toast } = useToast()
  const [isCalendarVisible, setIsCalendarVisible] = useState(false)
  const [clientSearchTerm, setClientSearchTerm] = useState("")
  const [clientSearchResults, setClientSearchResults] = useState<Client[]>([])
  const [showClientResults, setShowClientResults] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  // Fecha formateada para API como estado para poder actualizarla
  const [currentApiFormattedDate, setCurrentApiFormattedDate] = useState(new Date().toISOString().split("T")[0])

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
      setLoading(true);
      
      // Cargar TODAS las citas para la fecha seleccionada con información del cliente y tratamiento
      const { data, error } = await supabase
        .from("appointments")
        .select("*, clients(name), treatments(name)")
        .eq("date", formattedDate)

      if (error) {
        console.error("Error cargando citas:", error);
        throw error;
      }
      
      console.log('Citas cargadas:', data?.length || 0);
      console.log('Detalle de citas:', data);
      
      // Asegurarnos de que las citas tienen toda la información necesaria
      if (data && data.length > 0) {
        // Verificar si alguna cita no tiene la información del cliente o tratamiento
        const missingDataCitas = data.filter(cita => !cita.clients || !cita.treatments);
        if (missingDataCitas.length > 0) {
          console.warn('Algunas citas no tienen toda la información necesaria:', missingDataCitas);
          
          // Intentar cargar la información faltante para estas citas
          for (const cita of missingDataCitas) {
            if (!cita.clients) {
              const { data: clientData } = await supabase
                .from("clients")
                .select("name")
                .eq("id", cita.client_id)
                .single();
                
              if (clientData) {
                cita.clients = clientData;
              }
            }
            
            if (!cita.treatments) {
              const { data: treatmentData } = await supabase
                .from("treatments")
                .select("name")
                .eq("id", cita.treatment_id)
                .single();
                
              if (treatmentData) {
                cita.treatments = treatmentData;
              }
            }
          }
        }
      }
      
      setAppointments(data || [])
      setFilteredAppointments(data || [])

      // También recargar las disponibilidades para esta fecha
      const { data: availabilitiesData, error: availabilitiesError } = await supabase
        .from('treatment_availabilities')
        .select('*')
        .lte('start_date', formattedDate)
        .gte('end_date', formattedDate)

      if (availabilitiesError) {
        console.error("Error cargando disponibilidades:", availabilitiesError);
        throw availabilitiesError;
      }
      
      console.log('Disponibilidades actualizadas:', availabilitiesData?.length || 0);
      console.log('Detalle de disponibilidades:', availabilitiesData);
      
      setAvailabilities(availabilitiesData || []);
      
      // Actualizar también la fecha formateada para API
      setCurrentApiFormattedDate(formattedDate);
    } catch (error) {
      console.error("Error loading appointments:", error)
      setError("Error al cargar las citas. Por favor, recarga la página.")
    } finally {
      setLoading(false);
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

  // Format date for API - como getter para leer el estado actual
  const apiFormattedDate = currentApiFormattedDate

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

  // Get appointment for a specific slot
  const getAppointment = (box: string, time: string) => {
    // Buscar una cita que coincida con el box, tiempo y fecha actual
    console.log(`Buscando cita para box: ${box}, hora: ${time}, fecha: ${apiFormattedDate}`);
    
    const appointment = appointments.find(app => 
      app.box === box && 
      app.time === time && 
      app.date === apiFormattedDate
    );
    
    if (appointment) {
      console.log(`Cita encontrada:`, appointment);
    }
    
    return appointment;
  };

  // Función para manejar el clic en un slot para crear una nueva cita
  const handleSlotClick = (time: string, box: string) => {
    console.log(`Click en slot - Box: ${box}, Hora: ${time}, Fecha: ${apiFormattedDate}`);
    
    // Verificar si ya hay una cita en este slot
    const appointment = getAppointment(box, time);
    if (appointment) {
      console.log('Cita existente encontrada:', appointment);
      
      // Si hay una cita, abrir el diálogo de edición
      setSelectedAppointment(appointment);
      setSelectedTreatment(treatments.find(t => t.id === appointment.treatment_id) || null);
      setSelectedSubtreatment(appointment.subtreatment_id.toString());
      setSelectedClient(appointment.client_id.toString());
      setSelectedTime(time);
      setSelectedBox(box);
      
      setIsDialogOpen(true);
      return;
    }
    
    // Si no hay cita, verificar si el slot está disponible
    if (!isSlotAvailable(box, time)) {
      console.log(`Slot no disponible - Box: ${box}, Hora: ${time}`);
      toast({
        title: "No disponible",
        description: "Este horario no está disponible para agendar citas",
        variant: "destructive",
      });
      return;
    }
    
    // Obtener el tratamiento disponible para este horario
    const availableTreatmentIds = availabilities
      .filter(a => 
        a.box === box && 
        a.start_time <= time && 
        a.end_time > time && 
        a.start_date <= apiFormattedDate && 
        a.end_date >= apiFormattedDate
      )
      .map(a => a.treatment_id);
      
    console.log('IDs de tratamientos disponibles:', availableTreatmentIds);
    
    if (availableTreatmentIds.length === 0) {
      toast({
        title: "Error",
        description: "No hay tratamientos disponibles para este horario",
        variant: "destructive",
      });
      return;
    }
    
    // Tomar el primer tratamiento disponible
    const availableTreatment = treatments.find(t => availableTreatmentIds.includes(t.id));
    console.log('Tratamiento disponible:', availableTreatment);

    if (availableTreatment) {
      // Obtener el primer subtratamiento del tratamiento disponible
      const firstSubtreatment = subtreatments.find(s => s.treatment_id === availableTreatment.id);
      console.log('Primer subtratamiento:', firstSubtreatment);
      
      if (firstSubtreatment) {
        // Establecer los valores predeterminados
        setSelectedAppointment(null); // Asegurarnos de que estamos creando, no editando
        setSelectedTreatment(availableTreatment);
        setSelectedSubtreatment(firstSubtreatment.id.toString());
        setSelectedTime(time);
        setSelectedBox(box);
        setSelectedClient(""); // Limpiar la selección de cliente para una nueva cita
        
        console.log('Abriendo diálogo con valores:');
        console.log('- Tratamiento:', availableTreatment.name);
        console.log('- Subtratamiento:', firstSubtreatment.name);
        console.log('- Fecha:', apiFormattedDate);
        console.log('- Hora:', time);
        console.log('- Box:', box);
        
        // Abrir el diálogo de cita
        setIsDialogOpen(true);
      } else {
        toast({
          title: "Error",
          description: "No se encontró un subtratamiento para este horario",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Error",
        description: "No hay tratamientos disponibles para este horario",
        variant: "destructive",
      });
    }
  };

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
      const availableTreatmentNames = treatments
        .filter((t) => availableTreatmentIds.includes(t.id))
        .map((t) => t.name)

      if (availableTreatmentNames.length === 0) return "Disponible"
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
      console.log('Guardando cita...');
      
      const formData = new FormData(e.target as HTMLFormElement)
      const clientId = Number(formData.get("clientName"))
      const subtreatmentId = Number(formData.get("subtreatmentId"))
      const notes = formData.get("notes") as string
      const deposit = Number(formData.get("deposit"))
      const status = formData.get("status") as string
      const date = formData.get("date") as string
      const time = formData.get("time") as string || selectedTime
      const box = formData.get("box") as string || selectedBox
      
      console.log('Datos del formulario:', {
        clientId,
        subtreatmentId,
        notes,
        deposit,
        status,
        date,
        time,
        box
      });

      // Verificar que todos los campos obligatorios estén presentes
      if (!clientId || !subtreatmentId || !date || !time || !box || !status) {
        setError("Todos los campos obligatorios deben estar completos")
        console.error("Campos obligatorios faltantes:", {
          clientId, subtreatmentId, date, time, box, status
        });
        setLoading(false)
        return
      }

      // Verificar que el tratamiento exista
      if (!selectedTreatment) {
        setError("Debe seleccionar un tratamiento válido")
        console.error("No hay tratamiento seleccionado");
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
          console.error("Horario ocupado:", {date, time, box});
          setLoading(false);
          return;
        }
      } else {
        // Si estamos editando, verificar que no estemos creando un conflicto con otra cita
        const isTimeSlotTaken = appointments.some(appointment => 
          appointment.date === date && 
          appointment.time === time && 
          appointment.box === box && 
          appointment.id !== selectedAppointment.id
        );

        if (isTimeSlotTaken) {
          setError("Este horario ya está ocupado por otra cita. Por favor, selecciona otro horario.");
          console.error("Horario ocupado por otra cita:", {date, time, box});
          setLoading(false);
          return;
        }
      }

      // Obtener el precio del subtratamiento
      const subtreatment = subtreatments.find((s) => s.id === subtreatmentId);
      const price = subtreatment ? subtreatment.price : 0;
      
      console.log('Subtratamiento encontrado:', subtreatment);
      console.log('Precio:', price);

      // Datos de la cita para crear o actualizar
      const appointmentData = {
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
        professional_id: 1 // Por ahora usamos un profesional por defecto
      };
      
      console.log('Datos de la cita a guardar:', appointmentData);

      // Si estamos editando una cita existente
      if (selectedAppointment) {
        console.log('Actualizando cita existente ID:', selectedAppointment.id);
        
        const { data, error } = await supabase
          .from("appointments")
          .update(appointmentData)
          .eq("id", selectedAppointment.id)
          .select();

        if (error) {
          console.error('Error al actualizar cita:', error);
          throw error;
        }
        
        console.log('Cita actualizada:', data);

        toast({
          title: "Éxito",
          description: "Cita actualizada correctamente",
        });
      } else {
        // Si estamos creando una nueva cita
        console.log('Creando nueva cita');
        
        const { data, error } = await supabase
          .from("appointments")
          .insert(appointmentData)
          .select();

        if (error) {
          console.error('Error al crear cita:', error);
          throw error;
        }
        
        console.log('Cita creada:', data);

        toast({
          title: "Éxito",
          description: "Cita creada correctamente",
        });
      }

      // Recargar las citas para mantener los datos actualizados
      await loadAppointments(selectedDate);

      // Cerrar el diálogo y limpiar la selección
      setIsDialogOpen(false)
      setSelectedSlot(null)
      setSelectedTreatment(null)
      setSelectedAppointment(null)
      setSelectedClient("")
      setSelectedSubtreatment("")
      setClientSearchTerm("")
      setSelectedTime(null)
      setSelectedBox(null)
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
    // Generar slots de tiempo desde las 8:00 hasta las 20:00 en intervalos de 30 minutos
    const timeSlots = Array.from({ length: 25 }, (_, i) => {
      const hour = Math.floor(i / 2) + 8;
      const minute = (i % 2) * 30;
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    });

    return (
      <div className="space-y-4">
        {/* Cabecera de la tabla con nombres de los boxes */}
        <div className="grid grid-cols-6 gap-4 border-b pb-2 font-semibold">
          <div className="col-span-1">Hora</div>
          {boxes.map((box) => (
            <div key={box} className="col-span-1 text-center">{box}</div>
          ))}
        </div>
        
        {/* Filas de slots por hora */}
        <div className="grid grid-cols-1 gap-4">
          {timeSlots.map((time) => (
            <div key={time} className="grid grid-cols-6 gap-4 py-2 border-b border-gray-100">
              <div className="col-span-1 font-medium flex items-center">{time}</div>
              {boxes.map((box) => {
                const appointment = getAppointment(box, time);
                const isAvailable = isSlotAvailable(box, time);
                const treatmentName = getTreatmentName(box, time);
                
                // Determinar el color de fondo basado en el estado de la cita
                let bgColor = 'bg-gray-100'; // Por defecto: no disponible
                let statusText = '';
                
                if (appointment) {
                  // Si hay una cita, el color depende del estado
                  switch(appointment.status) {
                    case 'pending':
                      bgColor = 'bg-yellow-100';
                      statusText = 'Pendiente';
                      break;
                    case 'confirmed':
                      bgColor = 'bg-green-100';
                      statusText = 'Confirmado';
                      break;
                    case 'completed':
                      bgColor = 'bg-blue-100';
                      statusText = 'Completado';
                      break;
                    case 'canceled':
                      bgColor = 'bg-red-100';
                      statusText = 'Cancelado';
                      break;
                  }
                } else if (isAvailable) {
                  // Si no hay cita pero el slot está disponible
                  bgColor = 'bg-green-50';
                  statusText = 'Disponible';
                }

                return (
                  <div
                    key={`${box}-${time}`}
                    className={`col-span-1 p-2 rounded cursor-pointer hover:opacity-80 transition-opacity ${bgColor}`}
                    onClick={() => handleSlotClick(time, box)}
                  >
                    {appointment ? (
                      <div className="text-sm">
                        <div className="font-medium truncate">{treatmentName}</div>
                        <div className="text-gray-600 truncate">
                          {appointment.clients?.name || 'Cliente no especificado'}
                        </div>
                        <div className="text-xs mt-1 font-medium">
                          {statusText}
                        </div>
                      </div>
                    ) : isAvailable ? (
                      <div className="text-sm">
                        <div className="font-medium truncate">{treatmentName}</div>
                        <div className="text-green-600 text-xs">{statusText}</div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">No disponible</div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

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

      <div className="flex justify-between items-center mb-4">
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
        <Card className="mb-4">
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
        <CardHeader className="pb-2">
          <CardTitle>Agenda - {formattedDate}</CardTitle>
        </CardHeader>
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
                            <div className="font-medium">{getTreatmentName(appointment.box, appointment.time)}</div>
                            <div className="text-gray-600 truncate">
                              {clients.find(c => c.id === appointment.client_id)?.name || 'Cliente no especificado'}
                            </div>
                            <div className="text-xs mt-1 capitalize">
                              {appointment.status === 'pending' && 'Pendiente'}
                              {appointment.status === 'confirmed' && 'Confirmado'}
                              {appointment.status === 'completed' && 'Completado'}
                              {appointment.status === 'canceled' && 'Cancelado'}
                            </div>
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
                    value={apiFormattedDate}
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
                    value={selectedTime || ""}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="box">Box</Label>
                  <select
                    id="box"
                    name="box"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedBox || ""}
                    onChange={(e) => setSelectedBox(e.target.value)}
                    required
                  >
                    <option value="">Selecciona un box</option>
                    {boxes.map((box) => (
                      <option key={box} value={box}>
                        {box}
                      </option>
                    ))}
                  </select>
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

