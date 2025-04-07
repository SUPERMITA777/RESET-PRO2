"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { format, addDays, isAfter, isBefore, isEqual, parse, addMinutes } from "date-fns"
import { es } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

// Zona horaria de Argentina
const ARGENTINA_TIMEZONE = 'America/Argentina/Buenos_Aires';

// Definir tipos
type Appointment = {
  id: number;
  date: string;
  time: string;
  client_id: number;
  treatment_id: number;
  subtreatment_id: number;
  box: string;
  status: string;
  deposit: number;
  price: number;
  notes?: string;
}

type TimeSlot = {
  time: string;
  available: boolean;
  box: string;
}

type TreatmentAvailability = {
  id: number;
  treatment_id: number;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  box: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
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

interface Client {
  id: number
  name: string
  phone: string
  email: string
  history: string
  last_visit: string
}

interface AvailabilityGroup {
  date: Date
  slots: {
    time: string
    box: string
    treatmentId: number
  }[]
}

const boxes = ["Box 1", "Box 2", "Box 3", "Box 4", "Box 5"]

export default function Agenda2Page() {
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedBox, setSelectedBox] = useState<string | null>(null)
  const [availabilities, setAvailabilities] = useState<TreatmentAvailability[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [subtreatments, setSubtreatments] = useState<Subtreatment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availableDates, setAvailableDates] = useState<{[treatmentId: number]: Date[]}>({})
  const [availableTimeSlots, setAvailableTimeSlots] = useState<{time: string, box: string}[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isTimeDialogOpen, setIsTimeDialogOpen] = useState(false)
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false)
  const [clientSearchTerm, setClientSearchTerm] = useState("")
  const [clientSearchResults, setClientSearchResults] = useState<Client[]>([])
  const [showClientResults, setShowClientResults] = useState(false)
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [selectedSubtreatment, setSelectedSubtreatment] = useState<string>("")
  const { toast } = useToast()
  
  const supabase = getSupabaseClient()

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const supabase = getSupabaseClient()
        
        console.log('Iniciando carga de datos en AGENDA2');
        
        // Cargar tratamientos
        const { data: treatmentsData, error: treatmentsError } = await supabase
          .from('treatments')
          .select('*')
        
        if (treatmentsError) throw treatmentsError
        console.log('Tratamientos cargados:', treatmentsData?.length || 0)
        setTreatments(treatmentsData || [])

        // Cargar subtratamientos
        const { data: subtreatmentsData, error: subtreatmentsError } = await supabase
          .from('subtreatments')
          .select('*')
        
        if (subtreatmentsError) throw subtreatmentsError
        console.log('Subtratamientos cargados:', subtreatmentsData?.length || 0)
        setSubtreatments(subtreatmentsData || [])

        // Cargar clientes
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
        
        if (clientsError) throw clientsError
        console.log('Clientes cargados:', clientsData?.length || 0)
        setClients(clientsData || [])

        // Cargar disponibilidades - asegurar que estamos usando fecha en formato YYYY-MM-DD
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        // Formatear la fecha en zona horaria local
        const formattedToday = today.toISOString().split('T')[0]
        
        console.log('Fecha de hoy para filtrar disponibilidades:', formattedToday)
        
        const { data: availabilitiesData, error: availabilitiesError } = await supabase
          .from('treatment_availabilities')
          .select('*')
          .gte('end_date', formattedToday)
        
        if (availabilitiesError) throw availabilitiesError
        console.log('Disponibilidades cargadas:', availabilitiesData?.length || 0)
        setAvailabilities(availabilitiesData || [])

        // Cargar citas - asegurar que estamos usando fecha en formato YYYY-MM-DD
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select('*')
          .gte('date', formattedToday)
        
        if (appointmentsError) throw appointmentsError
        console.log('Citas cargadas en AGENDA2:', appointmentsData?.length || 0)
        setAppointments(appointmentsData || [])

        // Procesar fechas disponibles por tratamiento
        processAvailableDates(treatmentsData || [], availabilitiesData || [], appointmentsData || [])
        
        console.log('Carga de datos completada en AGENDA2');
      } catch (error) {
        console.error('Error loading data:', error)
        setError('No se pudieron cargar los datos. Por favor, intenta nuevamente.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
    
    // Suscribirse a cambios en la tabla 'appointments'
    const supabase = getSupabaseClient();
    const appointmentsSubscription = supabase
      .channel('appointments-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'appointments' 
      }, async (payload) => {
        console.log('Cambio detectado en appointments:', payload);
        
        // Recargar las citas
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const formattedToday = today.toISOString().split('T')[0]
        
        const { data } = await supabase
          .from('appointments')
          .select('*')
          .gte('date', formattedToday);
          
        if (data) {
          console.log('Actualizando citas tras cambio en DB:', data.length);
          setAppointments(data);
          
          // Actualizar también las fechas disponibles
          const { data: availabilities } = await supabase
            .from('treatment_availabilities')
            .select('*')
            .gte('end_date', formattedToday);
            
          if (availabilities && treatments.length > 0) {
            processAvailableDates(treatments, availabilities, data);
          }
        }
      })
      .subscribe();
    
    // Limpieza de la suscripción
    return () => {
      supabase.removeChannel(appointmentsSubscription);
    };
  }, [])

  // Añadir un efecto adicional que se ejecute cuando cambien las disponibilidades o citas
  useEffect(() => {
    if (!loading && treatments.length > 0 && availabilities.length > 0) {
      console.log('Actualizando fechas disponibles después de cargar datos');
      processAvailableDates(treatments, availabilities, appointments);
    }
  }, [loading, treatments.length, availabilities.length, appointments.length]);

  // Procesar fechas disponibles por tratamiento
  const processAvailableDates = (treatments: Treatment[], availabilities: TreatmentAvailability[], appointments: Appointment[]) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    console.log('Procesando fechas disponibles - Tratamientos:', treatments.length, 'Disponibilidades:', availabilities.length, 'Citas:', appointments.length);
    
    const availableDatesByTreatment: {[treatmentId: number]: Date[]} = {}
    
    treatments.forEach(treatment => {
      const treatmentAvailabilities = availabilities.filter(a => a.treatment_id === treatment.id)
      
      console.log(`Tratamiento ${treatment.id} (${treatment.name}) - Disponibilidades: ${treatmentAvailabilities.length}`);
      
      if (treatmentAvailabilities.length > 0) {
        // Conjunto para almacenar fechas únicas (como string para comparación fácil)
        const uniqueDatesSet = new Set<string>()
        
        // Revisar los próximos 30 días
        for (let i = 0; i < 30; i++) {
          const currentDate = new Date(today)
          currentDate.setDate(today.getDate() + i)
          const formattedDate = currentDate.toISOString().split('T')[0]
          
          // Verificar si este día de la semana tiene disponibilidad
          const dayOfWeek = currentDate.getDay() // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
          const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
          const dayName = dayNames[dayOfWeek] as keyof TreatmentAvailability
          
          // Buscar si hay disponibilidad para este tratamiento, en este día de la semana y fecha
          const availableForThisDay = treatmentAvailabilities.some(availability => {
            // Verificar si la fecha está dentro del rango de disponibilidad
            const dateInRange = 
              availability.start_date <= formattedDate && 
              availability.end_date >= formattedDate
            
            // Verificar si el día de la semana está habilitado
            const dayEnabled = availability[dayName] === true
            
            // Verificar si hay al menos un slot de tiempo disponible
            const hasAvailableSlot = hasSlotsAvailableForDate(
              treatment.id, 
              currentDate, 
              availability, 
              appointments
            )
            
            return dateInRange && dayEnabled && hasAvailableSlot
          })
          
          if (availableForThisDay) {
            uniqueDatesSet.add(formattedDate)
          }
        }
        
        // Convertir strings de fecha a objetos Date
        const uniqueDatesArray = Array.from(uniqueDatesSet).map(dateStr => {
          const [year, month, day] = dateStr.split('-').map(Number)
          return new Date(year, month - 1, day)
        })
        
        // Ordenar fechas
        uniqueDatesArray.sort((a, b) => a.getTime() - b.getTime())
        
        console.log(`Tratamiento ${treatment.id} (${treatment.name}):
          - Disponibilidades totales: ${treatmentAvailabilities.length}
          - Fechas disponibles encontradas: ${uniqueDatesArray.length}
          - Primeras fechas: ${uniqueDatesArray.slice(0, 3).map(d => d.toISOString().split('T')[0]).join(', ')}`);
        
        // Guardar fechas disponibles para este tratamiento
        availableDatesByTreatment[treatment.id] = uniqueDatesArray
      } else {
        // No hay disponibilidades para este tratamiento
        availableDatesByTreatment[treatment.id] = []
      }
    })
    
    console.log('Fechas disponibles procesadas:', Object.keys(availableDatesByTreatment).length);
    setAvailableDates(availableDatesByTreatment)
  }

  // Verificar si hay slots disponibles para una fecha específica
  const hasSlotsAvailableForDate = (
    treatmentId: number, 
    date: Date, 
    availability: TreatmentAvailability, 
    appointments: Appointment[]
  ): boolean => {
    const formattedDate = date.toISOString().split('T')[0]
    const { start_time, end_time, box } = availability
    
    // Convertir horas a minutos para facilitar cálculos
    const startMinutes = convertTimeToMinutes(start_time)
    const endMinutes = convertTimeToMinutes(end_time)
    
    // Verificar si hay al menos un slot de 30 minutos disponible
    for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
      const hour = Math.floor(minutes / 60)
      const minute = minutes % 60
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      
      // Verificar si ya existe una cita en este horario y box
      const existingAppointment = appointments.find(a => 
        a.date === formattedDate && 
        a.time === timeStr && 
        a.box === box
      )
      
      // Si al menos un slot está disponible, retornar true
      if (!existingAppointment) {
        return true
      }
    }
    
    // Si no hay slots disponibles, retornar false
    return false
  }

  // Manejar click en fecha
  const handleDateClick = async (date: Date) => {
    if (!selectedTreatment) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selecciona un tratamiento primero",
      })
      return
    }

    console.log(`[handleDateClick] Fecha seleccionada: ${date.toISOString().split('T')[0]}`);
    setSelectedDate(date)
    
    try {
      // Obtener el tratamiento actual basado en el ID
      const treatment = treatments.find(t => t.id === selectedTreatment.id);
      if (!treatment) {
        throw new Error("Tratamiento no encontrado");
      }
      
      // Obtener las citas para la fecha seleccionada
      const formattedDate = date.toISOString().split('T')[0];
      console.log(`[handleDateClick] Consultando citas para fecha: ${formattedDate}`);
      
      const { data: dateAppointments, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('date', formattedDate);
        
      if (error) throw error;
      
      console.log(`[handleDateClick] Citas encontradas para la fecha: ${dateAppointments?.length || 0}`);
      
      // Actualizar estado de citas actuales para el día seleccionado
      const updatedAppointments = appointments.filter(a => a.date !== formattedDate);
      const newAppointments = [...updatedAppointments, ...(dateAppointments || [])];
      setAppointments(newAppointments);
      
      // Obtener slots disponibles para este tratamiento y fecha
      const slots = getAvailableTimeSlots(selectedTreatment.id, date, newAppointments);
      console.log(`[handleDateClick] Slots disponibles encontrados: ${slots.length}`);
      
      if (slots.length === 0) {
        toast({
          variant: "destructive",
          title: "Sin disponibilidad",
          description: "No hay horarios disponibles para esta fecha",
        });
        return;
      }
      
      setAvailableTimeSlots(slots);
      setIsTimeDialogOpen(true);
    } catch (error) {
      console.error("Error al obtener disponibilidad:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo obtener la disponibilidad",
      });
    }
  };

  // Obtener los horarios disponibles para un tratamiento y fecha específicos
  const getAvailableTimeSlots = (treatmentId: number, date: Date, currentAppointments: Appointment[] = appointments) => {
    console.log(`[getAvailableTimeSlots] Buscando slots para tratamiento ${treatmentId} en fecha ${date.toISOString().split('T')[0]}`);
    
    // Formatear la fecha para comparar con las disponibilidades
    const formattedDate = date.toISOString().split('T')[0];
    
    // Filtrar las disponibilidades para el tratamiento seleccionado
    const treatmentAvailabilities = availabilities.filter(
      (a) => a.treatment_id === treatmentId
    ) as TreatmentAvailability[];
    console.log(`[getAvailableTimeSlots] Disponibilidades encontradas para este tratamiento: ${treatmentAvailabilities.length}`);
    
    if (treatmentAvailabilities.length === 0) {
      console.log("[getAvailableTimeSlots] No hay disponibilidades para este tratamiento");
      return [];
    }

    // Filtrar por día de la semana y por fecha
    const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = dayNames[dayOfWeek] as keyof TreatmentAvailability;
    
    const availabilitiesForThisDay = treatmentAvailabilities.filter(
      (a) => a[dayName] === true && 
             a.start_date <= formattedDate && 
             a.end_date >= formattedDate
    );
    console.log(`[getAvailableTimeSlots] Disponibilidades para ${dayName} y fecha ${formattedDate}: ${availabilitiesForThisDay.length}`);
    
    if (availabilitiesForThisDay.length === 0) {
      console.log(`[getAvailableTimeSlots] No hay disponibilidades para ${dayName} en la fecha ${formattedDate}`);
      return [];
    }

    // Crear un conjunto de franjas horarias posibles
    const timeSlots: TimeSlot[] = [];
    
    availabilitiesForThisDay.forEach((availability) => {
      const startTime = availability.start_time;
      const endTime = availability.end_time;
      const box = availability.box;
      
      // Generar franjas de 30 minutos desde la hora de inicio hasta la hora de fin
      let currentTime = startTime;
      while (currentTime < endTime) {
        // Parseamos strings de tiempo a objetos Date para poder utilizar addMinutes
        const currentTimeDate = parseTimeString(currentTime);
        const endTimeDate = parseTimeString(endTime);
        
        // Sumamos 30 minutos
        const nextTimeDate = addMinutes(currentTimeDate, 30);
        
        // Convertimos de nuevo a string para comparar
        const nextTime = formatTimeDate(nextTimeDate);
        
        // Verificar que el horario generado no exceda la hora de fin
        if (nextTimeDate <= endTimeDate) {
          // Verificar si el horario ya está ocupado por alguna cita
          const isSlotTaken = currentAppointments.some(
            (appointment) => 
              appointment.date === formattedDate && 
              appointment.time === currentTime &&
              appointment.box === box
          );
          
          if (!isSlotTaken) {
            // Si no está ocupado, agregarlo a las franjas disponibles
            timeSlots.push({
              time: currentTime,
              available: true,
              box: box
            });
          } else {
            console.log(`[getAvailableTimeSlots] Horario ${currentTime} en ${box} ocupado por cita existente`);
          }
        }
        
        // Avanzar a la siguiente franja de 30 minutos
        currentTime = nextTime;
      }
    });
    
    // Ordenar por hora
    timeSlots.sort((a, b) => a.time.localeCompare(b.time));
    
    // Eliminar duplicados (por si hay solapamiento en las disponibilidades)
    const uniqueTimeSlots = timeSlots.filter(
      (slot, index, self) =>
        index === self.findIndex((s) => s.time === slot.time && s.box === slot.box)
    );
    
    console.log(`[getAvailableTimeSlots] Total de slots disponibles: ${uniqueTimeSlots.length}`);
    return uniqueTimeSlots;
  };

  // Función para convertir string de tiempo a Date
  const parseTimeString = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Función para formatear Date a string de tiempo
  const formatTimeDate = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Convertir hora (HH:MM) a minutos totales desde medianoche
  const convertTimeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Preparar para crear una cita en un horario específico
  const handleTimeClick = (time: string, box: string) => {
    setSelectedTime(time)
    setSelectedBox(box)
    setIsTimeDialogOpen(false)
    setIsDialogOpen(true)
  }

  // Formatear fecha para mostrar
  const formatDateForDisplay = (date: Date) => {
    // Usamos directamente date-fns con locale es
    return format(date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
      .replace(/^\w/, c => c.toUpperCase()); // Primera letra en mayúscula
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
          last_visit: format(new Date(), "yyyy-MM-dd"),
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

  // Guardar cita
  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedTreatment || !selectedDate || !selectedTime || !selectedBox) {
      setError("Faltan datos para la cita");
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);
    const clientId = Number.parseInt(formData.get("clientName") as string);
    const subtreatmentId = Number.parseInt(formData.get("subtreatmentId") as string);
    const notes = formData.get("notes") as string;
    const deposit = Number.parseFloat(formData.get("deposit") as string) || 0;
    const status = formData.get("status") as string;

    // Obtener el precio del subtratamiento
    const subtreatment = subtreatments.find((s) => s.id === subtreatmentId);
    const price = subtreatment ? subtreatment.price : 0;

    try {
      // Obtener la fecha formateada usando el formato nativo de JS
      const formattedDate = selectedDate.toISOString().split('T')[0];
      console.log('Guardando cita para fecha:', formattedDate, 'hora:', selectedTime);

      // Verificar si el horario ya está ocupado
      const isTimeSlotTaken = appointments.some(appointment => 
        appointment.date === formattedDate && 
        appointment.time === selectedTime && 
        appointment.box === selectedBox
      );

      if (isTimeSlotTaken) {
        setError("Este horario ya está ocupado. Por favor, selecciona otro horario.");
        return;
      }

      // Crear nueva cita
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          date: formattedDate,
          time: selectedTime,
          client_id: clientId,
          professional_id: 1, // Por defecto asignamos al primer profesional
          treatment_id: selectedTreatment.id,
          subtreatment_id: subtreatmentId,
          box: selectedBox,
          status,
          deposit,
          price,
          notes,
        })
        .select();

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Cita creada correctamente",
      });

      // Recargar todas las citas para mantener sincronizados los datos
      const { data: allAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*');
        
      if (appointmentsError) {
        console.error("Error recargando citas:", appointmentsError);
      } else {
        console.log("Citas recargadas después de guardar:", allAppointments.length);
        setAppointments(allAppointments || []);
        
        // Actualizar las fechas disponibles
        processAvailableDates(treatments, availabilities, allAppointments || []);
        
        // Cerrar todos los diálogos y limpiar los estados
        setIsDialogOpen(false);
        setIsTimeDialogOpen(false);
        
        // Actualizar las pastillas de horarios disponibles si aún estamos trabajando con el mismo tratamiento
        if (selectedTreatment) {
          // Limpiar y actualizar los slots disponibles con los datos más recientes
          setAvailableTimeSlots(getAvailableTimeSlots(selectedTreatment.id, selectedDate, allAppointments || []));
        }
      }
      
      // Limpiar los estados de selección
      setSelectedTreatment(null);
      setSelectedDate(null);
      setSelectedTime(null);
      setSelectedBox(null);
      setSelectedClient("");
      setSelectedSubtreatment("");
      
    } catch (error) {
      console.error("Error saving appointment:", error);
      setError("Error al guardar la cita. Por favor, inténtalo de nuevo.");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-semibold mb-6">Reservar Turno</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {treatments.map(treatment => (
            <Card 
              key={treatment.id} 
              className={`w-full cursor-pointer ${selectedTreatment?.id === treatment.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedTreatment(treatment)}
            >
              <CardHeader>
                <CardTitle>{treatment.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">{treatment.description || "Sin descripción"}</p>
                
                <h3 className="font-medium mb-2">Fechas disponibles:</h3>
                {availableDates[treatment.id] && availableDates[treatment.id].length > 0 ? (
                  <ScrollArea className="h-40">
                    <div className="space-y-2 flex flex-wrap gap-2">
                      {availableDates[treatment.id].map(date => (
                        <Badge 
                          key={date.toISOString()} 
                          variant="outline"
                          className="mr-2 mb-2 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors py-1 px-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log("Fecha seleccionada:", date);
                            setSelectedTreatment(treatment);
                            handleDateClick(date);
                          }}
                        >
                          {formatDateForDisplay(date)}
                        </Badge>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-gray-500">No hay fechas disponibles</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Diálogo para mostrar horarios disponibles */}
      <Dialog open={isTimeDialogOpen} onOpenChange={setIsTimeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedTreatment?.name} - {selectedDate && formatDateForDisplay(selectedDate)}
            </DialogTitle>
            <DialogDescription>
              Selecciona un horario disponible
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <h3 className="font-medium mb-2">Horarios disponibles:</h3>
            {availableTimeSlots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableTimeSlots.map((slot, index) => (
                  <Badge 
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors py-2 px-3 flex flex-col items-center"
                    onClick={() => handleTimeClick(slot.time, slot.box)}
                  >
                    <span className="font-medium">{slot.time}</span>
                    <span className="text-xs">{slot.box}</span>
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-red-500 mb-4">No hay horarios disponibles para esta fecha</p>
                <p className="text-xs text-gray-500 mb-4">
                  Esto puede deberse a que todos los turnos ya están reservados o a que no hay disponibilidad configurada para este tratamiento en esta fecha.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Intentar recargar los horarios disponibles
                    if (selectedTreatment && selectedDate) {
                      const availableSlots = getAvailableTimeSlots(selectedTreatment.id, selectedDate);
                      setAvailableTimeSlots(availableSlots);
                      
                      if (availableSlots.length === 0) {
                        toast({
                          title: "Sin disponibilidad",
                          description: "No se encontraron horarios disponibles",
                          variant: "destructive",
                        });
                      } else {
                        toast({
                          title: "Disponibilidad actualizada",
                          description: `Se encontraron ${availableSlots.length} horarios disponibles`,
                        });
                      }
                    }
                  }}
                >
                  Reintentar
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTimeDialogOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para crear cita */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Cita</DialogTitle>
            <DialogDescription>
              {selectedTreatment?.name} - {selectedDate && formatDateForDisplay(selectedDate)} - {selectedTime} - {selectedBox}
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
                >
                  <option value="">Selecciona un subtratamiento</option>
                  {subtreatments
                    .filter(s => s.treatment_id === selectedTreatment?.id)
                    .map((subtreatment) => (
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
                    defaultValue={selectedSubtreatment ? 
                      subtreatments.find(s => s.id === Number(selectedSubtreatment))?.price || 0 
                      : 0}
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
                    defaultValue="0"
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
                    defaultValue={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
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
                    defaultValue={selectedTime || ""}
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
                    defaultValue={selectedBox || ""}
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
                    defaultValue="pending"
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
                  placeholder="Notas sobre la cita"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Guardar
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
    </div>
  )
} 