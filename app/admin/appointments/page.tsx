"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, DollarSign, Trash, Pencil, Plus } from "lucide-react"
import { createSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

// Status color mapping
const statusColors: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-gray-100 text-gray-800",
  canceled: "bg-red-100 text-red-800",
}

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

interface Treatment {
  id: number
  name: string
  description: string
  duration: number
  subtreatments: Subtreatment[]
}

interface Subtreatment {
  id: number
  treatment_id: number
  name: string
  description: string
  duration: number
  price: number
}

interface SaleItem {
  id: number
  type: "treatment" | "product"
  itemId: number
  quantity: number
  price: number
  name: string
}

interface Sale {
  id: number
  date: string
  client_id: number
  appointment_id: number
  items: SaleItem[]
  total: number
  payments: {
    id: number
    sale_id: number
    method: string
    amount: number
  }[]
  completed: boolean
}

interface PaymentMethod {
  id: number
  name: string
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCartDialogOpen, setIsCartDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [cartItems, setCartItems] = useState<SaleItem[]>([])
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<{ method: string; amount: number }[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  // Load all data from Supabase
  const loadData = async () => {
    try {
      const supabase = createSupabaseClient()
      
      // Load appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
      
      if (appointmentsError) throw appointmentsError

      // Load clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
      
      if (clientsError) throw clientsError

      // Load professionals
      const { data: professionalsData, error: professionalsError } = await supabase
        .from('professionals')
        .select('*')
      
      if (professionalsError) throw professionalsError

      // Load treatments
      const { data: treatmentsData, error: treatmentsError } = await supabase
        .from('treatments')
        .select('*')
      
      if (treatmentsError) throw treatmentsError

      // Load subtreatments
      const { data: subtreatmentsData, error: subtreatmentsError } = await supabase
        .from('subtreatments')
        .select('*')
      
      if (subtreatmentsError) throw subtreatmentsError

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
      
      if (productsError) throw productsError

      // Load payment methods
      const { data: paymentMethodsData, error: paymentMethodsError } = await supabase
        .from('payment_methods')
        .select('*')
      
      if (paymentMethodsError) throw paymentMethodsError

      // Combinar tratamientos con sus subtratamientos
      const combinedTreatments = treatmentsData.map(treatment => ({
        ...treatment,
        subtreatments: subtreatmentsData.filter(st => st.treatment_id === treatment.id)
      }))

      setAppointments(appointmentsData)
      setFilteredAppointments(appointmentsData)
      setClients(clientsData)
      setProfessionals(professionalsData)
      setTreatments(combinedTreatments)
      setProducts(productsData)
      setPaymentMethods(paymentMethodsData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter appointments
  useEffect(() => {
    if (!searchTerm) {
      setFilteredAppointments(appointments)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = appointments.filter((appointment) => {
      const client = clients.find(c => c.id === appointment.client_id)
      const professional = professionals.find(p => p.id === appointment.professional_id)
      const treatment = treatments.find(t => t.id === appointment.treatment_id)

      return (
        client?.name.toLowerCase().includes(term) ||
        professional?.name.toLowerCase().includes(term) ||
        treatment?.name.toLowerCase().includes(term) ||
        appointment.date.includes(term) ||
        appointment.time.includes(term) ||
        appointment.status.toLowerCase().includes(term)
      )
    })
    setFilteredAppointments(filtered)
  }, [appointments, clients, professionals, treatments, searchTerm])

  // Handle open appointment dialog
  const handleOpenAppointmentDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsDialogOpen(true)
  }

  // Handle save appointment
  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAppointment) return
    setIsLoading(true)

    try {
      const supabase = createSupabaseClient()
      const formData = new FormData(e.target as HTMLFormElement)
      const appointmentData = {
        client_id: Number(formData.get("clientId")),
        professional_id: Number(formData.get("professionalId")),
        treatment_id: Number(formData.get("treatmentId")),
        date: formData.get("date") as string,
        time: formData.get("time") as string,
        status: formData.get("status") as string,
        notes: formData.get("notes") as string,
      }

      // Get price from subtreatment
      const treatment = treatments.find((t) => t.id === appointmentData.treatment_id)
      const subtreatment = treatment?.subtreatments.find((s) => s.id === appointmentData.subtreatment_id)
      const price = subtreatment?.price || 0

      const { error } = await supabase
        .from('appointments')
        .update({ ...appointmentData, price })
        .eq('id', selectedAppointment.id)

      if (error) throw error

      // Actualizar el estado local
      setAppointments(appointments.map(app => 
        app.id === selectedAppointment.id ? { ...app, ...appointmentData, price } : app
      ))

      toast({
        title: "Éxito",
        description: "Cita actualizada correctamente",
      })

      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving appointment:', error)
      toast({
        title: "Error",
        description: "No se pudo guardar la cita",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle open cart dialog
  const handleOpenCartDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment)

    // Initialize cart with the appointment's treatment
    const treatment = treatments.find((t) => t.id === appointment.treatment_id)
    const subtreatment = treatment?.subtreatments.find((s) => s.id === appointment.subtreatment_id)

    if (subtreatment) {
      setCartItems([
        {
          id: Date.now(),
          type: "treatment",
          itemId: subtreatment.id,
          quantity: 1,
          price: subtreatment.price,
          name: subtreatment.name,
        },
      ])
    } else {
      setCartItems([])
    }

    // Initialize payment methods
    setSelectedPaymentMethods([
      {
        method: paymentMethods[0]?.name || "Efectivo",
        amount: appointment.price - appointment.deposit,
      },
    ])

    setIsCartDialogOpen(true)
  }

  // Calculate cart total
  const calculateCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  // Calculate amount to pay (total - deposit)
  const calculateAmountToPay = () => {
    const total = calculateCartTotal()
    const deposit = selectedAppointment?.deposit || 0
    return total - deposit
  }

  // Calculate total payments
  const calculateTotalPayments = () => {
    return selectedPaymentMethods.reduce((total, payment) => total + payment.amount, 0)
  }

  // Handle complete sale
  const handleCompleteSale = async () => {
    if (!selectedAppointment) return
    setIsLoading(true)

    try {
      const supabase = createSupabaseClient()
      
      // Crear venta
      const saleData = {
        date: new Date().toISOString().split("T")[0],
        client_id: selectedAppointment.client_id,
        appointment_id: selectedAppointment.id,
        items: cartItems,
        total: calculateCartTotal(),
        completed: true,
      }

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert(saleData)
        .select()
        .single()

      if (saleError) throw saleError

      // Crear pagos
      const paymentsData = selectedPaymentMethods.map(payment => ({
        sale_id: sale.id,
        method: payment.method,
        amount: payment.amount,
      }))

      const { error: paymentsError } = await supabase
        .from('sale_payments')
        .insert(paymentsData)

      if (paymentsError) throw paymentsError

      // Actualizar estado de la cita
      const { error: appointmentError } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', selectedAppointment.id)

      if (appointmentError) throw appointmentError

      // Actualizar estado local
      setAppointments(appointments.map(app => 
        app.id === selectedAppointment.id ? { ...app, status: 'completed' } : app
      ))

      toast({
        title: "Éxito",
        description: "Venta completada correctamente",
      })

      setIsCartDialogOpen(false)
    } catch (error) {
      console.error('Error completing sale:', error)
      toast({
        title: "Error",
        description: "No se pudo completar la venta",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Get client name
  const getClientName = (clientId: number) => {
    const client = clients.find((c) => c.id === clientId)
    return client ? client.name : "Cliente desconocido"
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestión de Citas</h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Buscar cita..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          <Button onClick={() => handleOpenAppointmentDialog(null as any)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cita
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Profesional</TableHead>
                <TableHead>Tratamiento</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.map((appointment) => {
                const client = clients.find(c => c.id === appointment.client_id)
                const professional = professionals.find(p => p.id === appointment.professional_id)
                const treatment = treatments.find(t => t.id === appointment.treatment_id)

                return (
                  <TableRow key={appointment.id}>
                    <TableCell>{client?.name}</TableCell>
                    <TableCell>{professional?.name}</TableCell>
                    <TableCell>{treatment?.name}</TableCell>
                    <TableCell>{appointment.date}</TableCell>
                    <TableCell>{appointment.time}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[appointment.status]}>
                        {appointment.status === "pending"
                          ? "Reservado"
                          : appointment.status === "confirmed"
                          ? "Confirmado"
                          : appointment.status === "completed"
                          ? "Completado"
                          : "Cancelado"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={appointment.notes}>
                        {appointment.notes}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenAppointmentDialog(appointment)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {appointment.status !== "completed" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenCartDialog(appointment)}
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedAppointment ? "Editar Cita" : "Nueva Cita"}</DialogTitle>
            <DialogDescription>
              {selectedAppointment ? "Modifica los datos de la cita" : "Ingresa los datos de la nueva cita"}
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <form onSubmit={handleSaveAppointment}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="clientId">Cliente</Label>
                  <Select name="clientId" defaultValue={selectedAppointment.client_id.toString()}>
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

                <div className="grid gap-2">
                  <Label htmlFor="professionalId">Profesional</Label>
                  <Select name="professionalId" defaultValue={selectedAppointment.professional_id.toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar profesional" />
                    </SelectTrigger>
                    <SelectContent>
                      {professionals.map((professional) => (
                        <SelectItem key={professional.id} value={professional.id.toString()}>
                          {professional.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="treatmentId">Tratamiento</Label>
                  <Select name="treatmentId" defaultValue={selectedAppointment.treatment_id.toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tratamiento" />
                    </SelectTrigger>
                    <SelectContent>
                      {treatments.map((treatment) => (
                        <SelectItem key={treatment.id} value={treatment.id.toString()}>
                          {treatment.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={selectedAppointment?.date}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="time">Hora</Label>
                  <Input
                    id="time"
                    name="time"
                    type="time"
                    defaultValue={selectedAppointment?.time}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select name="status" defaultValue={selectedAppointment?.status}>
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
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    defaultValue={selectedAppointment?.notes}
                    placeholder="Notas sobre la cita"
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
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Dialog */}
      <Dialog open={isCartDialogOpen} onOpenChange={setIsCartDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Carrito de Compras</DialogTitle>
            <DialogDescription>
              Completa la venta del turno
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="grid gap-6 py-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Detalles del Turno</h3>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Cliente:</span> {getClientName(selectedAppointment.client_id)}
                    </p>
                    <p>
                      <span className="font-medium">Fecha:</span> {selectedAppointment.date}
                    </p>
                    <p>
                      <span className="font-medium">Hora:</span> {selectedAppointment.time}
                    </p>
                    <p>
                      <span className="font-medium">Box:</span> {selectedAppointment.box}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Resumen de Pagos</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Total: ${calculateCartTotal()}</Label>
                    </div>
                    <div>
                      <Label>Seña: ${selectedAppointment.deposit}</Label>
                    </div>
                    <div>
                      <Label>Pendiente: ${calculateAmountToPay()}</Label>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Métodos de Pago</h3>
                <div className="space-y-4">
                  {selectedPaymentMethods.map((payment, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4">
                      <Select
                        value={payment.method}
                        onValueChange={(value) => {
                          const newPayments = [...selectedPaymentMethods]
                          newPayments[index] = { ...payment, method: value }
                          setSelectedPaymentMethods(newPayments)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar método" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.id} value={method.name}>
                              {method.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={payment.amount}
                        onChange={(e) => {
                          const newPayments = [...selectedPaymentMethods]
                          newPayments[index] = { ...payment, amount: Number(e.target.value) }
                          setSelectedPaymentMethods(newPayments)
                        }}
                        placeholder="Monto"
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setSelectedPaymentMethods([
                        ...selectedPaymentMethods,
                        { method: paymentMethods[0]?.name || "Efectivo", amount: 0 },
                      ])
                    }
                  >
                    + Agregar Método de Pago
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCartDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleCompleteSale} disabled={isLoading}>
              {isLoading ? "Completando..." : "Completar Venta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

