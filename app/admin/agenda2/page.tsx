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
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedBox, setSelectedBox] = useState<string | null>(null)
  const [availabilities, setAvailabilities] = useState<TreatmentAvailability[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [subtreatments, setSubtreatments] = useState<Subtreatment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availableDates, setAvailableDates] = useState<{[treatmentId: number]: string[]}>({})
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
        
        console.log('=== Iniciando carga de datos en AGENDA2 ===');
        
        // Cargar tratamientos
        const { data: treatmentsData, error: treatmentsError } = await supabase
          .from('treatments')
          .select('*')
        
        if (treatmentsError) throw treatmentsError
        console.log('Tratamientos cargados:', treatmentsData?.length || 0)
        
        // Guardar tratamientos en el estado
        setTreatments(treatmentsData || [])

        // Cargar subtratamientos
        const { data: subtreatmentsData, error: subtreatmentsError } = await supabase
          .from('subtreatments')
          .select('*')
        
        if (subtreatmentsError) throw subtreatmentsError
        console.log('Subtratamientos cargados:', subtreatmentsData?.length || 0)
        
        // Guardar subtratamientos en el estado
        setSubtreatments(subtreatmentsData || [])

        // Cargar clientes
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
        
        if (clientsError) throw clientsError
        console.log('Clientes cargados:', clientsData?.length || 0)
        
        // Guardar clientes en el estado
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
        
        // Guardar disponibilidades en el estado
        setAvailabilities(availabilitiesData || [])

        // Cargar citas - asegurar que estamos usando fecha en formato YYYY-MM-DD
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select('*')
          .gte('date', formattedToday)
        
        if (appointmentsError) throw appointmentsError
        console.log('Citas cargadas en AGENDA2:', appointmentsData?.length || 0)
        
        // Guardar citas en el estado
        setAppointments(appointmentsData || [])

        // Procesar fechas disponibles por tratamiento de forma sincrónica
        // Esto asegura que el estado se actualice correctamente antes de continuar
        console.log('Procesando fechas disponibles...');
        const availableDatesByTreatment = processAvailableDatesSync(
          treatmentsData || [], 
          availabilitiesData || [], 
          appointmentsData || []
        );
        
        console.log('Actualizando estado de fechas disponibles...', availableDatesByTreatment);
        // Actualizar el estado con todas las fechas disponibles
        setAvailableDates({...availableDatesByTreatment});
        
        // Verificar si hay tratamientos sin fechas disponibles
        const treatmentsWithoutDates = (treatmentsData || []).filter(
          t => !availableDatesByTreatment[t.id] || availableDatesByTreatment[t.id].length === 0
        );
        
        if (treatmentsWithoutDates.length > 0) {
          console.warn('Tratamientos sin fechas disponibles:', treatmentsWithoutDates.map(t => t.name).join(', '));
        }
        
        console.log('=== Carga de datos completada en AGENDA2 ===');
      } catch (error) {
        console.error('Error loading data:', error)
        setError('No se pudieron cargar los datos. Por favor, intenta nuevamente.')
      } finally {
        // Marcar la carga como completa
        setLoading(false)
      }
    }

    // Cargar los datos iniciales
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

  // Versión sincrónica de processAvailableDates para usar dentro de loadData
  const processAvailableDatesSync = (treatments: Treatment[], availabilities: TreatmentAvailability[], appointments: Appointment[]) => {
    console.log('=== Iniciando processAvailableDatesSync ===');
    console.log('Tratamientos totales:', treatments.length);
    console.log('Disponibilidades totales:', availabilities.length);
    console.log('Citas totales:', appointments.length);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const availableDatesByTreatment: {[treatmentId: number]: string[]} = {};
    
    // Inicializar el objeto para todos los tratamientos
    treatments.forEach(treatment => {
      availableDatesByTreatment[treatment.id] = [];
    });
    
    treatments.forEach(treatment => {
      console.log(`\nProcesando tratamiento: ${treatment.name} (ID: ${treatment.id})`);
      
      const treatmentAvailabilities = availabilities.filter(a => a.treatment_id === treatment.id);
      console.log(`Disponibilidades encontradas para ${treatment.name}:`, treatmentAvailabilities.length);
      
      if (treatmentAvailabilities.length > 0) {
        const uniqueDatesSet = new Set<string>();
        
        // Revisar los próximos 30 días
        for (let i = 0; i < 30; i++) {
          const currentDate = new Date(today);
          currentDate.setDate(today.getDate() + i);
          const formattedDate = currentDate.toISOString().split('T')[0];
          
          const dayOfWeek = currentDate.getDay();
          const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
          const dayName = dayNames[dayOfWeek] as keyof TreatmentAvailability;
          
          // Verificar disponibilidad para este día
          for (const availability of treatmentAvailabilities) {
            const dateInRange = 
              availability.start_date <= formattedDate && 
              availability.end_date >= formattedDate;
            
            // Verificar si el día de la semana está habilitado
            const isDayEnabled = Boolean(availability[dayName]);
            
            if (!dateInRange || !isDayEnabled) {
              continue; // Si no cumple con estas condiciones, pasar a la siguiente disponibilidad
            }
            
            // Verificar si hay slots disponibles para esta fecha
            const hasAvailableSlot = checkSlotsAvailableForDate(
              treatment.id, 
              currentDate, 
              availability, 
              appointments
            );
            
            if (hasAvailableSlot) {
              console.log(`Fecha disponible encontrada para ${treatment.name}: ${formattedDate}`);
              console.log(`- Box: ${availability.box}`);
              console.log(`- Horario: ${availability.start_time} - ${availability.end_time}`);
              uniqueDatesSet.add(formattedDate);
              break; // Si ya encontramos disponibilidad para esta fecha, podemos pasar a la siguiente fecha
            }
          }
        }
        
        const uniqueDatesArray = Array.from(uniqueDatesSet);
        uniqueDatesArray.sort();
        
        console.log(`\nResumen para ${treatment.name}:`);
        console.log(`- Disponibilidades totales: ${treatmentAvailabilities.length}`);
        console.log(`- Fechas disponibles encontradas: ${uniqueDatesArray.length}`);
        console.log(`- Primeras fechas: ${uniqueDatesArray.slice(0, 3).join(', ')}`);
        
        availableDatesByTreatment[treatment.id] = uniqueDatesArray;
      } else {
        console.log(`No hay disponibilidades para ${treatment.name}`);
        availableDatesByTreatment[treatment.id] = [];
      }
    });
    
    console.log('\n=== Proceso completado ===');
    console.log('Fechas disponibles procesadas:', Object.keys(availableDatesByTreatment).length);
    console.log('Detalle de fechas por tratamiento:', availableDatesByTreatment);
    
    return availableDatesByTreatment;
  };
  
  // Función auxiliar para verificar slots disponibles
  const checkSlotsAvailableForDate = (
    treatmentId: number, 
    date: Date, 
    availability: TreatmentAvailability, 
    appointments: Appointment[]
  ): boolean => {
    const formattedDate = date.toISOString().split('T')[0];
    const { start_time, end_time, box } = availability;
    
    // Convertir horas a minutos para facilitar la comparación
    const startMinutes = convertTimeToMinutes(start_time);
    const endMinutes = convertTimeToMinutes(end_time);
    
    // Verificar si hay al menos un slot de 30 minutos disponible
    for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // Buscar si ya existe una cita en este slot
      const existingAppointment = appointments.find(a => 
        a.date === formattedDate && 
        a.time === timeStr && 
        a.box === box
      );
      
      // Si no hay cita en este slot, está disponible
      if (!existingAppointment) {
        console.log(`Slot disponible encontrado para tratamiento ${treatmentId}:`);
        console.log(`- Fecha: ${formattedDate}`);
        console.log(`- Hora: ${timeStr}`);
        console.log(`- Box: ${box}`);
        return true;
      }
    }
    
    // Si llegamos aquí, no hay slots disponibles para esta fecha
    return false;
  };

  // Añadir un efecto adicional que se ejecute cuando cambien las disponibilidades o citas
  useEffect(() => {
    if (!loading && treatments.length > 0 && availabilities.length > 0) {
      console.log('Actualizando fechas disponibles después de cargar datos');
      processAvailableDates(treatments, availabilities, appointments);
      
      // Inspeccionar el estado de availableDates para depuración
      setTimeout(() => {
        console.log('Estado actual de availableDates:', availableDates);
        console.log('Tratamientos con fechas disponibles:', Object.keys(availableDates).length);
        
        // Verificar el estado de cada tratamiento
        treatments.forEach(treatment => {
          const dates = availableDates[treatment.id] || [];
          console.log(`Tratamiento ${treatment.id} (${treatment.name}): ${dates.length} fechas disponibles`);
        });
      }, 1000);
    }
  }, [loading, treatments.length, availabilities.length, appointments.length]);

  // Procesar fechas disponibles por tratamiento
  const processAvailableDates = (treatments: Treatment[], availabilities: TreatmentAvailability[], appointments: Appointment[]) => {
    console.log('=== Iniciando processAvailableDates ===');
    console.log('Tratamientos totales:', treatments.length);
    console.log('Disponibilidades totales:', availabilities.length);
    console.log('Citas totales:', appointments.length);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const availableDatesByTreatment: {[treatmentId: number]: string[]} = {};
    
    // Inicializar el objeto para todos los tratamientos
    treatments.forEach(treatment => {
      availableDatesByTreatment[treatment.id] = [];
    });
    
    treatments.forEach(treatment => {
      console.log(`\nProcesando tratamiento: ${treatment.name} (ID: ${treatment.id})`);
      
      // Filtrar disponibilidades para este tratamiento
      const treatmentAvailabilities = availabilities.filter(a => a.treatment_id === treatment.id);
      console.log(`Disponibilidades encontradas para ${treatment.name}:`, treatmentAvailabilities.length);
      
      if (treatmentAvailabilities.length > 0) {
        const uniqueDatesSet = new Set<string>();
        
        // Revisar los próximos 30 días
        for (let i = 0; i < 30; i++) {
          const currentDate = new Date(today);
          currentDate.setDate(today.getDate() + i);
          const formattedDate = currentDate.toISOString().split('T')[0];
          
          const dayOfWeek = currentDate.getDay(); // 0 = domingo, 1 = lunes, etc.
          const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
          const dayName = dayNames[dayOfWeek] as keyof TreatmentAvailability;
          
          // Verificar si hay disponibilidad para esta fecha
          let availableForThisDay = false;
          
          for (const availability of treatmentAvailabilities) {
            // Verificar si la fecha está dentro del rango de disponibilidad
            const dateInRange = 
              availability.start_date <= formattedDate && 
              availability.end_date >= formattedDate;
            
            // Verificar si el día de la semana está habilitado
            // Convertir propiedad del día a booleano
            const isDayEnabled = availability[dayName] === true;
            
            if (!dateInRange || !isDayEnabled) {
              // Si no cumple con estas condiciones, pasar a la siguiente disponibilidad
              continue;
            }
            
            // Verificar si hay slots disponibles para esta fecha
            const hasAvailableSlot = checkSlotsAvailableForDate(
              treatment.id, 
              currentDate, 
              availability, 
              appointments
            );
            
            if (hasAvailableSlot) {
              console.log(`Fecha disponible encontrada para ${treatment.name}: ${formattedDate}`);
              console.log(`- Box: ${availability.box}`);
              console.log(`- Horario: ${availability.start_time} - ${availability.end_time}`);
              availableForThisDay = true;
              uniqueDatesSet.add(formattedDate);
              break; // Si ya encontramos disponibilidad para esta fecha, podemos pasar a la siguiente fecha
            }
          }
          
          if (availableForThisDay) {
            console.log(`Fecha ${formattedDate} disponible para tratamiento ${treatment.id}`);
          }
        }
        
        const uniqueDatesArray = Array.from(uniqueDatesSet);
        uniqueDatesArray.sort();
        
        console.log(`\nResumen para ${treatment.name}:`);
        console.log(`- Disponibilidades totales: ${treatmentAvailabilities.length}`);
        console.log(`- Fechas disponibles encontradas: ${uniqueDatesArray.length}`);
        console.log(`- Primeras fechas: ${uniqueDatesArray.slice(0, 3).join(', ')}`);
        
        // Guardar las fechas disponibles para este tratamiento
        availableDatesByTreatment[treatment.id] = uniqueDatesArray;
      } else {
        console.log(`No hay disponibilidades para ${treatment.name}`);
        availableDatesByTreatment[treatment.id] = [];
      }
    });
    
    console.log('\n=== Proceso completado ===');
    console.log('Fechas disponibles procesadas:', Object.keys(availableDatesByTreatment).length);
    console.log('Detalle de fechas por tratamiento:', availableDatesByTreatment);
    
    // Actualizar el estado con las fechas disponibles
    // Uso directo de setAvailableDates para asegurar la actualización del estado
    setAvailableDates({...availableDatesByTreatment});
  };

  // Verificar si hay slots disponibles para una fecha específica
  const hasSlotsAvailableForDate = (
    treatmentId: number, 
    date: Date, 
    availability: TreatmentAvailability, 
    appointments: Appointment[]
  ): boolean => {
    const formattedDate = date.toISOString().split('T')[0];
    const { start_time, end_time, box } = availability;
    
    const startMinutes = convertTimeToMinutes(start_time);
    const endMinutes = convertTimeToMinutes(end_time);
    
    for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      const existingAppointment = appointments.find(a => 
        a.date === formattedDate && 
        a.time === timeStr && 
        a.box === box
      );
      
      if (!existingAppointment) {
        console.log(`Slot disponible encontrado para tratamiento ${treatmentId}:`);
        console.log(`- Fecha: ${formattedDate}`);
        console.log(`- Hora: ${timeStr}`);
        console.log(`- Box: ${box}`);
        return true;
      }
    }
    
    return false;
  };

  // Convertir hora (HH:MM) a minutos totales desde medianoche
  const convertTimeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Obtener los horarios disponibles para un tratamiento y fecha específicos
  const getAvailableTimeSlots = (treatmentId: number, date: Date, currentAppointments: Appointment[] = appointments) => {
    console.log(`[getAvailableTimeSlots] Buscando slots para tratamiento ${treatmentId} en fecha ${date.toISOString().split('T')[0]}`)
    
    const formattedDate = date.toISOString().split('T')[0]
    const treatmentAvailabilities = availabilities.filter(a => a.treatment_id === treatmentId)
    
    if (treatmentAvailabilities.length === 0) {
      console.log("[getAvailableTimeSlots] No hay disponibilidades para este tratamiento")
      return []
    }

    const dayOfWeek = date.getDay()
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const dayName = dayNames[dayOfWeek] as keyof TreatmentAvailability
    
    const availabilitiesForThisDay = treatmentAvailabilities.filter(
      a => a[dayName] === true && 
           a.start_date <= formattedDate && 
           a.end_date >= formattedDate
    )
    
    if (availabilitiesForThisDay.length === 0) {
      console.log(`[getAvailableTimeSlots] No hay disponibilidades para ${dayName} en la fecha ${formattedDate}`)
      return []
    }

    const timeSlots: {time: string, box: string}[] = []
    
    availabilitiesForThisDay.forEach(availability => {
      const startMinutes = convertTimeToMinutes(availability.start_time)
      const endMinutes = convertTimeToMinutes(availability.end_time)
      
      for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
        const hour = Math.floor(minutes / 60)
        const minute = minutes % 60
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        
        const existingAppointment = currentAppointments.find(a => 
          a.date === formattedDate && 
          a.time === timeStr && 
          a.box === availability.box
        )
        
        if (!existingAppointment) {
          timeSlots.push({
            time: timeStr,
            box: availability.box
          })
        }
      }
    })
    
    timeSlots.sort((a, b) => a.time.localeCompare(b.time))
    
    console.log(`[getAvailableTimeSlots] Total de slots disponibles: ${timeSlots.length}`)
    return timeSlots
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

    const dateStr = date.toISOString().split('T')[0]
    console.log(`[handleDateClick] Fecha seleccionada: ${dateStr}`)
    setSelectedDate(dateStr)
    
    try {
      // Obtener el tratamiento actual basado en el ID
      const treatment = treatments.find(t => t.id === selectedTreatment.id)
      if (!treatment) {
        throw new Error("Tratamiento no encontrado")
      }
      
      // Obtener las citas para la fecha seleccionada
      console.log(`[handleDateClick] Consultando citas para fecha: ${dateStr}`)
      
      const { data: dateAppointments, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('date', dateStr)
        
      if (error) throw error
      
      console.log(`[handleDateClick] Citas encontradas para la fecha: ${dateAppointments?.length || 0}`)
      
      // Actualizar estado de citas actuales para el día seleccionado
      const updatedAppointments = appointments.filter(a => a.date !== dateStr)
      const newAppointments = [...updatedAppointments, ...(dateAppointments || [])]
      setAppointments(newAppointments)
      
      // Obtener slots disponibles para este tratamiento y fecha
      const slots = getAvailableTimeSlots(selectedTreatment.id, date, newAppointments)
      console.log(`[handleDateClick] Slots disponibles encontrados: ${slots.length}`)
      
      if (slots.length === 0) {
        toast({
          variant: "destructive",
          title: "Sin disponibilidad",
          description: "No hay horarios disponibles para esta fecha",
        })
        return
      }
      
      setAvailableTimeSlots(slots)
      setIsTimeDialogOpen(true)
    } catch (error) {
      console.error("Error al obtener disponibilidad:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo obtener la disponibilidad",
      })
    }
  }

  // Preparar para crear una cita en un horario específico
  const handleTimeClick = (time: string, box: string) => {
    setSelectedTime(time)
    setSelectedBox(box)
    setIsTimeDialogOpen(false)
    setIsDialogOpen(true)
  }

  // Formatear fecha para mostrar
  const formatDateForDisplay = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
      const formattedDate = selectedDate;
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
          setAvailableTimeSlots(getAvailableTimeSlots(selectedTreatment.id, new Date(selectedDate), allAppointments || []));
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
        <div className="flex justify-between w-full mb-4">
          <h2 className="text-2xl font-semibold">Reservar Turno</h2>
          <Button 
            variant="outline" 
            size="sm"
            onClick={async () => {
              try {
                setLoading(true);
                toast({
                  title: "Actualizando...",
                  description: "Cargando disponibilidad actualizada"
                });
                
                // Recargar disponibilidades y citas
                const supabase = getSupabaseClient();
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const formattedToday = today.toISOString().split('T')[0];
                
                // Recargar disponibilidades
                const { data: availabilitiesData, error: availabilitiesError } = await supabase
                  .from('treatment_availabilities')
                  .select('*')
                  .gte('end_date', formattedToday);
                
                if (availabilitiesError) throw availabilitiesError;
                
                // Recargar citas
                const { data: appointmentsData, error: appointmentsError } = await supabase
                  .from('appointments')
                  .select('*')
                  .gte('date', formattedToday);
                
                if (appointmentsError) throw appointmentsError;
                
                // Actualizar los estados
                setAvailabilities(availabilitiesData || []);
                setAppointments(appointmentsData || []);
                
                // Volver a procesar las fechas disponibles
                processAvailableDates(treatments, availabilitiesData || [], appointmentsData || []);
                
                toast({
                  title: "Actualizado",
                  description: "Disponibilidad actualizada correctamente"
                });
              } catch (error) {
                console.error('Error al actualizar disponibilidad:', error);
                toast({
                  title: "Error",
                  description: "No se pudo actualizar la disponibilidad",
                  variant: "destructive"
                });
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? "Actualizando..." : "Actualizar disponibilidad"}
          </Button>
        </div>
        
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
                      {availableDates[treatment.id].map(date => {
                        console.log(`Renderizando fecha ${date} para tratamiento ${treatment.id}`);
                        return (
                          <Badge 
                            key={date} 
                            variant="outline"
                            className="mr-2 mb-2 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors py-1 px-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log("Fecha seleccionada:", date);
                              setSelectedTreatment(treatment);
                              handleDateClick(new Date(date));
                            }}
                          >
                            {formatDateForDisplay(date)}
                          </Badge>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">No hay fechas disponibles</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Forzar una actualización de las fechas disponibles para este tratamiento
                        console.log("Actualizando fechas para tratamiento:", treatment.id);
                        // Usar la versión sincrónica para obtener las fechas inmediatamente
                        const dates = processAvailableDatesSync(
                          [treatment], 
                          availabilities.filter(a => a.treatment_id === treatment.id),
                          appointments
                        );
                        // Actualizar el estado solo para este tratamiento
                        setAvailableDates(prev => ({
                          ...prev,
                          [treatment.id]: dates[treatment.id] || []
                        }));
                        
                        if (dates[treatment.id]?.length > 0) {
                          toast({
                            title: "Disponibilidad encontrada",
                            description: `Se encontraron ${dates[treatment.id].length} fechas disponibles`,
                          });
                        } else {
                          toast({
                            title: "Sin disponibilidad",
                            description: "No se encontraron fechas disponibles para este tratamiento",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Actualizar disponibilidad
                    </Button>
                  </div>
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
                      const availableSlots = getAvailableTimeSlots(selectedTreatment.id, new Date(selectedDate));
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
                    defaultValue={selectedDate || ""}
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