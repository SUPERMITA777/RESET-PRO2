"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, DollarSign, Trash } from "lucide-react"
import {
  db,
  type Appointment,
  type Client,
  type Treatment,
  type Sale,
  type SaleItem,
  type Product,
  type PaymentMethod,
} from "@/lib/database"

// Status color mapping
const statusColors: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-gray-100 text-gray-800",
  canceled: "bg-red-100 text-red-800",
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCartDialogOpen, setIsCartDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [cartItems, setCartItems] = useState<SaleItem[]>([])
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<{ method: string; amount: number }[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  // Load data
  useEffect(() => {
    setAppointments(db.getAppointments())
    setClients(db.getClients())
    setTreatments(db.getTreatments())
    setProducts(db.getProducts())
    setPaymentMethods(db.getPaymentMethods())
  }, [])

  // Filter appointments
  useEffect(() => {
    let filtered = appointments

    // Filter by date
    if (filterDate) {
      filtered = filtered.filter((app) => app.date === filterDate)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((app) => {
        const client = clients.find((c) => c.id === app.clientId)
        if (!client) return false
        return client.name.toLowerCase().includes(term) || client.phone.includes(term)
      })
    }

    setFilteredAppointments(filtered)
  }, [appointments, filterDate, searchTerm, clients])

  // Handle open appointment dialog
  const handleOpenAppointmentDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsDialogOpen(true)
  }

  // Handle save appointment
  const handleSaveAppointment = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedAppointment) return

    const formData = new FormData(e.target as HTMLFormElement)
    const clientId = Number(formData.get("clientId"))
    const treatmentId = Number(formData.get("treatmentId"))
    const subtreatmentId = Number(formData.get("subtreatmentId"))
    const status = formData.get("status") as string
    const deposit = Number(formData.get("deposit"))
    const notes = formData.get("notes") as string

    // Get price from subtreatment
    const treatment = treatments.find((t) => t.id === treatmentId)
    const subtreatment = treatment?.subtreatments.find((s) => s.id === subtreatmentId)
    const price = subtreatment?.price || 0

    const updatedAppointment = {
      ...selectedAppointment,
      clientId,
      treatmentId,
      subtreatmentId,
      status,
      deposit,
      price,
      notes,
    }

    setAppointments(appointments.map((app) => (app.id === selectedAppointment.id ? updatedAppointment : app)))

    setIsDialogOpen(false)
  }

  // Handle open cart dialog
  const handleOpenCartDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment)

    // Initialize cart with the appointment's treatment
    const treatment = treatments.find((t) => t.id === appointment.treatmentId)
    const subtreatment = treatment?.subtreatments.find((s) => s.id === appointment.subtreatmentId)

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

  // Handle add product to cart
  const handleAddProductToCart = (productId: number) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    setCartItems([
      ...cartItems,
      {
        id: Date.now(),
        type: "product",
        itemId: product.id,
        quantity: 1,
        price: product.price,
        name: product.name,
      },
    ])
  }

  // Handle add treatment to cart
  const handleAddTreatmentToCart = (treatmentId: number, subtreatmentId: number) => {
    const treatment = treatments.find((t) => t.id === treatmentId)
    const subtreatment = treatment?.subtreatments.find((s) => s.id === subtreatmentId)
    if (!subtreatment) return

    setCartItems([
      ...cartItems,
      {
        id: Date.now(),
        type: "treatment",
        itemId: subtreatment.id,
        quantity: 1,
        price: subtreatment.price,
        name: subtreatment.name,
      },
    ])
  }

  // Handle remove item from cart
  const handleRemoveCartItem = (itemId: number) => {
    setCartItems(cartItems.filter((item) => item.id !== itemId))
  }

  // Handle update item quantity
  const handleUpdateCartItemQuantity = (itemId: number, quantity: number) => {
    setCartItems(cartItems.map((item) => (item.id === itemId ? { ...item, quantity } : item)))
  }

  // Handle add payment method
  const handleAddPaymentMethod = () => {
    setSelectedPaymentMethods([...selectedPaymentMethods, { method: paymentMethods[0]?.name || "Efectivo", amount: 0 }])
  }

  // Handle update payment method
  const handleUpdatePaymentMethod = (index: number, method: string, amount: number) => {
    const updated = [...selectedPaymentMethods]
    updated[index] = { method, amount }
    setSelectedPaymentMethods(updated)
  }

  // Handle remove payment method
  const handleRemovePaymentMethod = (index: number) => {
    setSelectedPaymentMethods(selectedPaymentMethods.filter((_, i) => i !== index))
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
  const handleCompleteSale = () => {
    if (!selectedAppointment) return

    // Create sale
    const sale: Omit<Sale, "id"> = {
      date: new Date().toISOString().split("T")[0],
      clientId: selectedAppointment.clientId,
      appointmentId: selectedAppointment.id,
      items: cartItems,
      total: calculateCartTotal(),
      payments: selectedPaymentMethods.map((payment, index) => ({
        id: Date.now() + index,
        saleId: 0, // Will be set by the database
        method: payment.method,
        amount: payment.amount,
      })),
      completed: true,
    }

    // Update appointment status to completed
    const updatedAppointment = {
      ...selectedAppointment,
      status: "completed",
    }

    setAppointments(appointments.map((app) => (app.id === selectedAppointment.id ? updatedAppointment : app)))

    // In a real app, you would save the sale to the database
    console.log("Sale completed:", sale)

    setIsCartDialogOpen(false)
  }

  // Get client name
  const getClientName = (clientId: number) => {
    const client = clients.find((c) => c.id === clientId)
    return client ? client.name : "Cliente desconocido"
  }

  // Get treatment name
  const getTreatmentName = (treatmentId: number, subtreatmentId: number) => {
    const treatment = treatments.find((t) => t.id === treatmentId)
    if (!treatment) return "Tratamiento desconocido"

    const subtreatment = treatment.subtreatments.find((s) => s.id === subtreatmentId)
    return subtreatment ? subtreatment.name : "Subtratamiento desconocido"
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestión de Turnos</h2>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente..."
              className="pl-8 w-[200px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-[150px]"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tratamiento</TableHead>
                <TableHead>Box</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Seña</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>{appointment.date}</TableCell>
                  <TableCell>{appointment.time}</TableCell>
                  <TableCell>{getClientName(appointment.clientId)}</TableCell>
                  <TableCell>{getTreatmentName(appointment.treatmentId, appointment.subtreatmentId)}</TableCell>
                  <TableCell>{appointment.box}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[appointment.status]}>
                      {appointment.status === "pending" && "Reservado"}
                      {appointment.status === "confirmed" && "Confirmado"}
                      {appointment.status === "completed" && "Completado"}
                      {appointment.status === "canceled" && "Cancelado"}
                      {appointment.status === "available" && "Disponible"}
                    </Badge>
                  </TableCell>
                  <TableCell>${appointment.price}</TableCell>
                  <TableCell>${appointment.deposit}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenAppointmentDialog(appointment)}>
                        Editar
                      </Button>
                      {(appointment.status === "pending" || appointment.status === "confirmed") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
                          onClick={() => handleOpenCartDialog(appointment)}
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Cobrar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Appointment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Turno</DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <form onSubmit={handleSaveAppointment}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Fecha</Label>
                    <Input value={selectedAppointment.date} readOnly />
                  </div>
                  <div>
                    <Label>Hora</Label>
                    <Input value={selectedAppointment.time} readOnly />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="clientId">Cliente</Label>
                  <Select name="clientId" defaultValue={selectedAppointment.clientId.toString()}>
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
                  <Label htmlFor="treatmentId">Tratamiento</Label>
                  <Select name="treatmentId" defaultValue={selectedAppointment.treatmentId.toString()}>
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
                  <Label htmlFor="subtreatmentId">Subtratamiento</Label>
                  <Select name="subtreatmentId" defaultValue={selectedAppointment.subtreatmentId.toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar subtratamiento" />
                    </SelectTrigger>
                    <SelectContent>
                      {treatments
                        .find((t) => t.id === selectedAppointment.treatmentId)
                        ?.subtreatments.map((subtreatment) => (
                          <SelectItem key={subtreatment.id} value={subtreatment.id.toString()}>
                            {subtreatment.name} - ${subtreatment.price}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="box">Box</Label>
                    <Input id="box" name="box" defaultValue={selectedAppointment.box} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="status">Estado</Label>
                    <Select name="status" defaultValue={selectedAppointment.status}>
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deposit">Seña</Label>
                    <Input id="deposit" name="deposit" type="number" defaultValue={selectedAppointment.deposit} />
                  </div>
                  <div>
                    <Label htmlFor="price">Precio</Label>
                    <Input id="price" name="price" type="number" defaultValue={selectedAppointment.price} readOnly />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Observaciones</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    defaultValue={selectedAppointment.notes}
                    placeholder="Notas adicionales"
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
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Dialog */}
      <Dialog open={isCartDialogOpen} onOpenChange={setIsCartDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Carrito de Compras</DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <div className="grid gap-6 py-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Detalles del Turno</h3>
                  <div className="grid gap-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Cliente:</span>
                      <span>{getClientName(selectedAppointment.clientId)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Fecha:</span>
                      <span>{selectedAppointment.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Hora:</span>
                      <span>{selectedAppointment.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Tratamiento:</span>
                      <span>
                        {getTreatmentName(selectedAppointment.treatmentId, selectedAppointment.subtreatmentId)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Box:</span>
                      <span>{selectedAppointment.box}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Seña:</span>
                      <span>${selectedAppointment.deposit}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Agregar Productos/Tratamientos</h3>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="addProduct">Agregar Producto</Label>
                      <div className="flex gap-2">
                        <Select onValueChange={(value) => handleAddProductToCart(Number(value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar producto" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name} - ${product.price}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="addTreatment">Agregar Tratamiento</Label>
                      <div className="grid gap-2">
                        <Select id="treatmentSelect">
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

                        <div className="flex gap-2">
                          <Select id="subtreatmentSelect">
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar subtratamiento" />
                            </SelectTrigger>
                            <SelectContent>
                              {treatments.map((treatment) =>
                                treatment.subtreatments.map((subtreatment) => (
                                  <SelectItem key={subtreatment.id} value={`${treatment.id}-${subtreatment.id}`}>
                                    {subtreatment.name} - ${subtreatment.price}
                                  </SelectItem>
                                )),
                              )}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const treatmentSelect = document.getElementById("treatmentSelect") as HTMLSelectElement
                              const subtreatmentSelect = document.getElementById(
                                "subtreatmentSelect",
                              ) as HTMLSelectElement
                              if (treatmentSelect && subtreatmentSelect) {
                                const [treatmentId, subtreatmentId] = subtreatmentSelect.value.split("-").map(Number)
                                handleAddTreatmentToCart(treatmentId, subtreatmentId)
                              }
                            }}
                          >
                            Agregar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Carrito</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto/Tratamiento</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cartItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>${item.price}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateCartItemQuantity(item.id, Number(e.target.value))}
                            className="w-16"
                          />
                        </TableCell>
                        <TableCell>${item.price * item.quantity}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveCartItem(item.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-4 flex justify-between items-center">
                  <div>
                    <p>
                      <span className="font-medium">Total:</span> ${calculateCartTotal()}
                    </p>
                    <p>
                      <span className="font-medium">Seña:</span> ${selectedAppointment.deposit}
                    </p>
                    <p>
                      <span className="font-medium">A pagar:</span> ${calculateAmountToPay()}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Métodos de Pago</h3>
                <div className="space-y-4">
                  {selectedPaymentMethods.map((payment, index) => (
                    <div key={index} className="flex gap-4 items-center">
                      <Select
                        value={payment.method}
                        onValueChange={(value) => handleUpdatePaymentMethod(index, value, payment.amount)}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Método de pago" />
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
                        min="0"
                        value={payment.amount}
                        onChange={(e) => handleUpdatePaymentMethod(index, payment.method, Number(e.target.value))}
                        className="w-32"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePaymentMethod(index)}
                        disabled={selectedPaymentMethods.length === 1}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button type="button" variant="outline" onClick={handleAddPaymentMethod}>
                    Agregar Método de Pago
                  </Button>

                  <div className="mt-4">
                    <p>
                      <span className="font-medium">Total a pagar:</span> ${calculateAmountToPay()}
                    </p>
                    <p>
                      <span className="font-medium">Total pagos:</span> ${calculateTotalPayments()}
                    </p>
                    {calculateTotalPayments() !== calculateAmountToPay() && (
                      <p className="text-red-500">
                        {calculateTotalPayments() < calculateAmountToPay()
                          ? `Falta: $${calculateAmountToPay() - calculateTotalPayments()}`
                          : `Sobra: $${calculateTotalPayments() - calculateAmountToPay()}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCartDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleCompleteSale}
                  disabled={calculateTotalPayments() !== calculateAmountToPay() || cartItems.length === 0}
                >
                  Completar Venta
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

