"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash, Calendar, Search } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

// Mock data for boxes
const boxes = ["Box 1", "Box 2", "Box 3", "Box 4", "Box 5"]

interface Treatment {
  id: number
  name: string
  description?: string
  subtreatments?: Subtreatment[]
  availabilities?: TreatmentAvailability[]
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

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [filteredTreatments, setFilteredTreatments] = useState<Treatment[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubtreatmentDialogOpen, setIsSubtreatmentDialogOpen] = useState(false)
  const [isAvailabilityDialogOpen, setIsAvailabilityDialogOpen] = useState(false)
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null)
  const [selectedSubtreatment, setSelectedSubtreatment] = useState<Subtreatment | null>(null)
  const [selectedAvailability, setSelectedAvailability] = useState<TreatmentAvailability | null>(null)
  const [currentTreatmentId, setCurrentTreatmentId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Load data
  useEffect(() => {
    // Diagnóstico de conexión a Supabase
    const diagnoseSupabaseConnection = async () => {
      try {
        const supabase = getSupabaseClient()
        console.log('Intentando conexión a Supabase...')
        
        // Verificar la URL y la clave de Supabase
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        console.log('URL de Supabase:', supabaseUrl ? 'Configurada' : 'No configurada')
        console.log('Clave de Supabase:', supabaseKey ? 'Configurada' : 'No configurada')
        
        // Intentar una consulta simple
        const { data, error } = await supabase.from('treatments').select('count').limit(1)
        
        if (error) {
          console.error('Error de conexión a Supabase:', error)
          toast({
            title: "Error de conexión",
            description: `No se pudo conectar a Supabase: ${error.message}`,
            variant: "destructive",
          })
        } else {
          console.log('Conexión a Supabase exitosa:', data)
        }
      } catch (error) {
        console.error('Error al diagnosticar conexión:', error)
      }
    }
    
    diagnoseSupabaseConnection()
    loadTreatments()
  }, [])

  // Load treatments from Supabase
  const loadTreatments = async () => {
    try {
      setIsLoading(true)
      const supabase = getSupabaseClient()
      
      console.log('Cargando tratamientos...')
      
      // Cargar tratamientos
      const { data: treatmentsData, error: treatmentsError } = await supabase
        .from('treatments')
        .select('*')
      
      if (treatmentsError) {
        console.error('Error cargando tratamientos:', treatmentsError)
        throw treatmentsError
      }
      console.log('Tratamientos cargados:', treatmentsData?.length || 0)

      // Cargar subtratamientos
      console.log('Cargando subtratamientos...')
      const { data: subtreatmentsData, error: subtreatmentsError } = await supabase
        .from('subtreatments')
        .select('*')
      
      if (subtreatmentsError) {
        console.error('Error cargando subtratamientos:', subtreatmentsError)
        throw subtreatmentsError
      }
      console.log('Subtratamientos cargados:', subtreatmentsData?.length || 0)

      // Cargar disponibilidades
      console.log('Cargando disponibilidades...')
      const { data: availabilitiesData, error: availabilitiesError } = await supabase
        .from('treatment_availabilities')
        .select('*')
      
      if (availabilitiesError) {
        console.error('Error cargando disponibilidades:', availabilitiesError)
        throw availabilitiesError
      }
      
      console.log('Disponibilidades cargadas:', availabilitiesData?.length || 0)

      // Combinar datos
      console.log('Procesando datos...')
      const fullTreatments = treatmentsData.map(treatment => ({
        ...treatment,
        subtreatments: subtreatmentsData.filter(st => st.treatment_id === treatment.id) || [],
        availabilities: availabilitiesData.filter(a => a.treatment_id === treatment.id) || []
      }))

      console.log('Datos procesados correctamente')

      setTreatments(fullTreatments)
      setFilteredTreatments(fullTreatments)
    } catch (error) {
      console.error('Error loading treatments:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron cargar los tratamientos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter treatments
  useEffect(() => {
    if (!searchTerm) {
      setFilteredTreatments(treatments)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = treatments.filter(
      (treatment) =>
        treatment.name.toLowerCase().includes(term) ||
        (treatment.description || "").toLowerCase().includes(term)
    )
    setFilteredTreatments(filtered)
  }, [treatments, searchTerm])

  // Handle open dialog
  const handleOpenDialog = (treatment?: Treatment) => {
    setSelectedTreatment(treatment || null)
    setIsDialogOpen(true)
  }

  // Handle save treatment
  const handleSaveTreatment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = getSupabaseClient()
      const formData = new FormData(e.target as HTMLFormElement)
      
      // Solo incluir los campos que pertenecen a la tabla treatments
      const treatmentData = {
        name: formData.get("name") as string,
        description: formData.get("description") as string
      }

      if (selectedTreatment) {
        // Update existing treatment
        const { error } = await supabase
          .from('treatments')
          .update(treatmentData)
          .eq('id', selectedTreatment.id)

        if (error) {
          console.error('Error en actualización:', error)
          throw error
        }

        // Update local state
        setTreatments(treatments.map(treatment => 
          treatment.id === selectedTreatment.id ? { 
            ...treatment, 
            ...treatmentData,
            // Mantener las relaciones existentes
            subtreatments: treatment.subtreatments,
            availabilities: treatment.availabilities
          } : treatment
        ))

        toast({
          title: "Éxito",
          description: "Tratamiento actualizado correctamente",
        })
      } else {
        // Create new treatment
        const { data, error } = await supabase
          .from('treatments')
          .insert(treatmentData)
          .select()
          .single()

        if (error) {
          console.error('Error en inserción:', error)
          throw error
        }

        // Update local state
        setTreatments([...treatments, {
          ...data,
          subtreatments: [],
          availabilities: []
        }])

        toast({
          title: "Éxito",
          description: "Tratamiento creado correctamente",
        })
      }

      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving treatment:', error)
      toast({
        title: "Error",
        description: "No se pudo guardar el tratamiento",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle delete treatment
  const handleDeleteTreatment = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este tratamiento?")) return
    setIsLoading(true)

    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('treatments')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Update local state
      setTreatments(treatments.filter(treatment => treatment.id !== id))

      toast({
        title: "Éxito",
        description: "Tratamiento eliminado correctamente",
      })
    } catch (error) {
      console.error('Error deleting treatment:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el tratamiento",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle open subtreatment dialog
  const handleOpenSubtreatmentDialog = (treatmentId: number, subtreatment: Subtreatment | null = null) => {
    setCurrentTreatmentId(treatmentId)
    setSelectedSubtreatment(subtreatment)
    setIsSubtreatmentDialogOpen(true)
  }

  // Handle save subtreatment
  const handleSaveSubtreatment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentTreatmentId === null) return
    setIsLoading(true)

    try {
      const supabase = getSupabaseClient()
      const formData = new FormData(e.target as HTMLFormElement)
      const subtreatmentData = {
        treatment_id: currentTreatmentId,
        name: formData.get("name") as string,
        duration: Number(formData.get("duration")),
        price: Number(formData.get("price")),
      }

      if (selectedSubtreatment) {
        // Update existing subtreatment
        const { error } = await supabase
          .from('subtreatments')
          .update(subtreatmentData)
          .eq('id', selectedSubtreatment.id)

        if (error) throw error

        // Actualizar el estado local
        setTreatments(treatments.map(t => {
          if (t.id !== currentTreatmentId) return t
          return {
            ...t,
            subtreatments: (t.subtreatments || []).map(st => 
              st.id === selectedSubtreatment.id ? { ...st, ...subtreatmentData } : st
            )
          }
        }))

        toast({
          title: "Éxito",
          description: "Subtratamiento actualizado correctamente",
        })
      } else {
        // Create new subtreatment
        const { data, error } = await supabase
          .from('subtreatments')
          .insert(subtreatmentData)
          .select()
          .single()

        if (error) throw error

        // Actualizar el estado local
        setTreatments(treatments.map(t => {
          if (t.id !== currentTreatmentId) return t
          return {
            ...t,
            subtreatments: [...(t.subtreatments || []), data]
          }
        }))

        toast({
          title: "Éxito",
          description: "Subtratamiento creado correctamente",
        })

        // Limpiar el formulario
        const form = e.target as HTMLFormElement
        form.reset()
        setSelectedSubtreatment(null)
      }
    } catch (error) {
      console.error('Error saving subtreatment:', error)
      toast({
        title: "Error",
        description: "No se pudo guardar el subtratamiento",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle delete subtreatment
  const handleDeleteSubtreatment = async (treatmentId: number, subtreatmentId: number) => {
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('subtreatments')
        .delete()
        .eq('id', subtreatmentId)

      if (error) throw error

      // Actualizar el estado local
      setTreatments(treatments.map(t => {
        if (t.id !== treatmentId) return t
        return {
          ...t,
          subtreatments: (t.subtreatments || []).filter(st => st.id !== subtreatmentId)
        }
      }))

      toast({
        title: "Éxito",
        description: "Subtratamiento eliminado correctamente",
      })
    } catch (error) {
      console.error('Error deleting subtreatment:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el subtratamiento",
        variant: "destructive",
      })
    }
  }

  // Handle open availability dialog
  const handleOpenAvailabilityDialog = (treatmentId: number, availability: TreatmentAvailability | null = null) => {
    setCurrentTreatmentId(treatmentId)
    setSelectedAvailability(availability)
    setIsAvailabilityDialogOpen(true)
  }

  // Handle save availability
  const handleSaveAvailability = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentTreatmentId === null) return
    setIsLoading(true)

    try {
      // Verificar que el tratamiento existe
      const treatment = treatments.find(t => t.id === currentTreatmentId)
      if (!treatment) {
        throw new Error("El tratamiento seleccionado no existe")
      }

      const supabase = getSupabaseClient()
      const formData = new FormData(e.target as HTMLFormElement)
      
      // Validar y formatear los datos
      const startDate = formData.get("start_date") as string
      const endDate = formData.get("end_date") as string
      const startTime = formData.get("start_time") as string
      const endTime = formData.get("end_time") as string
      const box = formData.get("box") as string

      // Validaciones
      if (!startDate || !endDate || !startTime || !endTime || !box) {
        throw new Error("Todos los campos son requeridos")
      }

      if (new Date(startDate) > new Date(endDate)) {
        throw new Error("La fecha de inicio no puede ser posterior a la fecha de fin")
      }

      if (startTime >= endTime) {
        throw new Error("La hora de inicio debe ser anterior a la hora de fin")
      }

      // Formatear los datos para la base de datos
      const availabilityData = {
        treatment_id: currentTreatmentId,
        start_date: startDate,
        end_date: endDate,
        start_time: startTime,
        end_time: endTime,
        box: box,
      }

      console.log('Datos a enviar:', availabilityData)

      try {
        // Verificar que la tabla existe
        const { error: tableCheckError } = await supabase
          .from('treatment_availabilities')
          .select('count')
          .limit(1)
        
        if (tableCheckError) {
          console.error('Error verificando tabla:', tableCheckError)
          throw new Error(`La tabla treatment_availabilities no existe o no está accesible: ${tableCheckError.message}`)
        }
      } catch (error) {
        console.error('Error al verificar la tabla de disponibilidades:', error)
        // Continuar con la ejecución, ya que podría ser un problema temporal o de permisos
      }

      if (selectedAvailability) {
        // Update existing availability
        const { data: updateData, error: updateError } = await supabase
          .from('treatment_availabilities')
          .update(availabilityData)
          .eq('id', selectedAvailability.id)
          .select()

        if (updateError) {
          console.error('Error updating availability:', updateError)
          throw new Error(`Error al actualizar la disponibilidad: ${updateError.message}`)
        }

        console.log('Disponibilidad actualizada:', updateData)

        // Actualizar el estado local
        setTreatments(treatments.map(t => {
          if (t.id !== currentTreatmentId) return t
          return {
            ...t,
            availabilities: (t.availabilities || []).map(a => 
              a.id === selectedAvailability.id ? { ...a, ...availabilityData } : a
            )
          }
        }))

        toast({
          title: "Éxito",
          description: "Disponibilidad actualizada correctamente",
        })
      } else {
        // Create new availability
        const { data: insertData, error: insertError } = await supabase
          .from('treatment_availabilities')
          .insert([availabilityData])
          .select()

        if (insertError) {
          console.error('Error creating availability:', insertError)
          throw new Error(`Error al crear la disponibilidad: ${insertError.message}`)
        }

        console.log('Disponibilidad creada:', insertData)

        if (!insertData || insertData.length === 0) {
          throw new Error("No se pudo crear la disponibilidad")
        }

        // Actualizar el estado local
        setTreatments(treatments.map(t => {
          if (t.id !== currentTreatmentId) return t
          return {
            ...t,
            availabilities: [...(t.availabilities || []), insertData[0]]
          }
        }))

        toast({
          title: "Éxito",
          description: "Disponibilidad creada correctamente",
        })

        // Cargar nuevamente los datos para confirmar que se guardaron
        loadTreatments()

        // Limpiar el formulario
        const form = e.target as HTMLFormElement
        form.reset()
        setSelectedAvailability(null)
      }
    } catch (error) {
      console.error('Error saving availability:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar la disponibilidad",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle delete availability
  const handleDeleteAvailability = async (treatmentId: number, availabilityId: number) => {
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('treatment_availabilities')
        .delete()
        .eq('id', availabilityId)

      if (error) throw error

      // Actualizar el estado local
      setTreatments(treatments.map(t => {
        if (t.id !== treatmentId) return t
        return {
          ...t,
          availabilities: (t.availabilities || []).filter(a => a.id !== availabilityId)
        }
      }))

      toast({
        title: "Éxito",
        description: "Disponibilidad eliminada correctamente",
      })
    } catch (error) {
      console.error('Error deleting availability:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la disponibilidad",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestión de Tratamientos</h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Buscar tratamiento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Tratamiento
          </Button>
        </div>
      </div>

      <Tabs defaultValue="treatments">
        <TabsList>
          <TabsTrigger value="treatments">Tratamientos</TabsTrigger>
          <TabsTrigger value="subtreatments">Subtratamientos</TabsTrigger>
          <TabsTrigger value="availabilities">Disponibilidad</TabsTrigger>
        </TabsList>

        <TabsContent value="treatments" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Disponibilidad</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTreatments.map((treatment) => (
                    <TableRow key={treatment.id}>
                      <TableCell className="font-medium">{treatment.name}</TableCell>
                      <TableCell>{treatment.description}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAvailabilityDialog(treatment.id)}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Ver Disponibilidad
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(treatment)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTreatment(treatment.id)}
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
        </TabsContent>

        <TabsContent value="subtreatments" className="space-y-4">
          {treatments.map((treatment) => (
            <Card key={treatment.id} className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{treatment.name}</CardTitle>
                <Button size="sm" onClick={() => handleOpenSubtreatmentDialog(treatment.id)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Subtratamiento
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Duración (min)</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {treatment.subtreatments?.map((subtreatment) => (
                      <TableRow key={subtreatment.id}>
                        <TableCell className="font-medium">{subtreatment.name}</TableCell>
                        <TableCell>{subtreatment.duration}</TableCell>
                        <TableCell>${subtreatment.price}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenSubtreatmentDialog(treatment.id, subtreatment)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteSubtreatment(treatment.id, subtreatment.id)}
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
          ))}
        </TabsContent>

        <TabsContent value="availabilities" className="space-y-4">
          {treatments.map((treatment) => (
            <Card key={treatment.id} className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{treatment.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-500">
                    {treatment.availabilities && treatment.availabilities.length > 0 
                      ? `${treatment.availabilities.length} disponibilidades` 
                      : "Sin disponibilidades"}
                  </div>
                  <Button size="sm" onClick={() => handleOpenAvailabilityDialog(treatment.id)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Disponibilidad
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {treatment.availabilities && treatment.availabilities.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha Inicio</TableHead>
                        <TableHead>Fecha Fin</TableHead>
                        <TableHead>Hora Inicio</TableHead>
                        <TableHead>Hora Fin</TableHead>
                        <TableHead>Box</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {treatment.availabilities.map((availability) => (
                        <TableRow key={availability.id}>
                          <TableCell>{availability.start_date}</TableCell>
                          <TableCell>{availability.end_date}</TableCell>
                          <TableCell>{availability.start_time}</TableCell>
                          <TableCell>{availability.end_time}</TableCell>
                          <TableCell>{availability.box}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenAvailabilityDialog(treatment.id, availability)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteAvailability(treatment.id, availability.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray-500">No hay disponibilidades registradas</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => handleOpenAvailabilityDialog(treatment.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar disponibilidad
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Treatment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedTreatment ? "Editar Tratamiento" : "Nuevo Tratamiento"}</DialogTitle>
            <DialogDescription>
              {selectedTreatment ? "Modifica los datos del tratamiento" : "Ingresa los datos del nuevo tratamiento"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveTreatment}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={selectedTreatment?.name}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={selectedTreatment?.description}
                  placeholder="Descripción del tratamiento"
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

      {/* Subtreatment Dialog */}
      <Dialog open={isSubtreatmentDialogOpen} onOpenChange={setIsSubtreatmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedSubtreatment ? "Editar Subtratamiento" : "Nuevo Subtratamiento"}</DialogTitle>
            <DialogDescription>
              {selectedSubtreatment ? "Modifica los datos del subtratamiento" : "Ingresa los datos del nuevo subtratamiento"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSubtreatment}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="subName">Nombre</Label>
                <Input
                  id="subName"
                  name="name"
                  defaultValue={selectedSubtreatment?.name || ""}
                  placeholder="Nombre del subtratamiento"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="subDuration">Duración (minutos)</Label>
                <Input
                  id="subDuration"
                  name="duration"
                  type="number"
                  defaultValue={selectedSubtreatment?.duration || 30}
                  min={1}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="price">Precio</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  defaultValue={selectedSubtreatment?.price || 0}
                  min={0}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsSubtreatmentDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Availability Dialog */}
      <Dialog open={isAvailabilityDialogOpen} onOpenChange={setIsAvailabilityDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTreatment ? `Disponibilidad - ${selectedTreatment.name}` : "Nueva Disponibilidad"}
            </DialogTitle>
            <DialogDescription>
              {selectedAvailability ? "Modifica los datos de la disponibilidad" : "Ingresa los datos de la nueva disponibilidad"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveAvailability}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Fecha Inicio</Label>
                <Input
                  id="startDate"
                  name="start_date"
                  type="date"
                  defaultValue={selectedAvailability?.start_date || new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endDate">Fecha Fin</Label>
                <Input
                  id="endDate"
                  name="end_date"
                  type="date"
                  defaultValue={selectedAvailability?.end_date || new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="startTime">Hora Inicio</Label>
                <Input
                  id="startTime"
                  name="start_time"
                  type="time"
                  defaultValue={selectedAvailability?.start_time || "09:00"}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endTime">Hora Fin</Label>
                <Input
                  id="endTime"
                  name="end_time"
                  type="time"
                  defaultValue={selectedAvailability?.end_time || "18:00"}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="box">Box</Label>
                <select
                  id="box"
                  name="box"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue={selectedAvailability?.box}
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
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAvailabilityDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

