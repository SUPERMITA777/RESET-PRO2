"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, ArrowLeft, ArrowRight } from "lucide-react"

// Mock data for treatments
const treatments = [
  {
    id: 1,
    name: "Masajes",
    subtreatments: [
      { id: 1, name: "Masaje Descontracturante", price: 9000, duration: 40 },
      { id: 2, name: "Masaje de Cuello", price: 7000, duration: 30 },
      { id: 3, name: "Masaje de Piernas", price: 8000, duration: 35 },
    ],
  },
  {
    id: 2,
    name: "Faciales",
    subtreatments: [
      { id: 4, name: "Limpieza Facial", price: 6000, duration: 45 },
      { id: 5, name: "Hidratación Profunda", price: 7500, duration: 50 },
    ],
  },
]

// Mock data for available time slots
const availableTimeSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
]

export default function BookingPage() {
  const [step, setStep] = useState(1)
  const [selectedTreatment, setSelectedTreatment] = useState<string>("")
  const [selectedSubtreatment, setSelectedSubtreatment] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [notes, setNotes] = useState("")

  // Get subtreatments for selected treatment
  const getSubtreatments = () => {
    const treatment = treatments.find((t) => t.id === Number(selectedTreatment))
    return treatment ? treatment.subtreatments : []
  }

  // Get selected subtreatment details
  const getSelectedSubtreatmentDetails = () => {
    const treatment = treatments.find((t) => t.id === Number(selectedTreatment))
    if (!treatment) return null

    return treatment.subtreatments.find((s) => s.id === Number(selectedSubtreatment))
  }

  // Handle next step
  const handleNextStep = () => {
    setStep(step + 1)
  }

  // Handle previous step
  const handlePrevStep = () => {
    setStep(step - 1)
  }

  // Handle submit booking
  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault()

    // In a real app, this would send the booking data to the server
    // and then send a WhatsApp message to the admin

    // For demo purposes, just show a success message
    alert("¡Reserva enviada con éxito! Te contactaremos por WhatsApp para confirmar tu turno.")

    // Reset form and go back to step 1
    setSelectedTreatment("")
    setSelectedSubtreatment("")
    setSelectedDate(undefined)
    setSelectedTime("")
    setName("")
    setPhone("")
    setEmail("")
    setNotes("")
    setStep(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fa] to-[#e9ecef]">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold text-[#3d405b]">RESET-pro2</h1>
          </Link>
          <div className="flex gap-4">
            <Link href="/treatments">
              <Button variant="ghost">Tratamientos</Button>
            </Link>
            <Link href="/booking">
              <Button variant="ghost">Reservar</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline">Iniciar Sesión</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Reserva tu Turno</h1>

          <div className="flex justify-between items-center mb-8">
            <div className={`flex items-center ${step >= 1 ? "text-[#e07a5f]" : "text-gray-400"}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                  step >= 1 ? "bg-[#e07a5f] text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                1
              </div>
              <span className="hidden sm:inline">Tratamiento</span>
            </div>
            <div className="flex-1 h-1 mx-2 bg-gray-200">
              <div
                className={`h-full ${step >= 2 ? "bg-[#e07a5f]" : "bg-gray-200"}`}
                style={{ width: step >= 2 ? "100%" : "0" }}
              ></div>
            </div>
            <div className={`flex items-center ${step >= 2 ? "text-[#e07a5f]" : "text-gray-400"}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                  step >= 2 ? "bg-[#e07a5f] text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                2
              </div>
              <span className="hidden sm:inline">Fecha y Hora</span>
            </div>
            <div className="flex-1 h-1 mx-2 bg-gray-200">
              <div
                className={`h-full ${step >= 3 ? "bg-[#e07a5f]" : "bg-gray-200"}`}
                style={{ width: step >= 3 ? "100%" : "0" }}
              ></div>
            </div>
            <div className={`flex items-center ${step >= 3 ? "text-[#e07a5f]" : "text-gray-400"}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                  step >= 3 ? "bg-[#e07a5f] text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                3
              </div>
              <span className="hidden sm:inline">Tus Datos</span>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold mb-4">Selecciona un Tratamiento</h2>

                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="treatment">Categoría de Tratamiento</Label>
                      <Select
                        value={selectedTreatment}
                        onValueChange={(value) => {
                          setSelectedTreatment(value)
                          setSelectedSubtreatment("")
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una categoría" />
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
                      <Label htmlFor="subtreatment">Tratamiento Específico</Label>
                      <Select
                        value={selectedSubtreatment}
                        onValueChange={setSelectedSubtreatment}
                        disabled={!selectedTreatment}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un tratamiento" />
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

                    {selectedSubtreatment && (
                      <div className="bg-gray-50 p-4 rounded-md mt-4">
                        <h3 className="font-semibold mb-2">Detalles del Tratamiento</h3>
                        <p>
                          <span className="font-medium">Tratamiento:</span> {getSelectedSubtreatmentDetails()?.name}
                        </p>
                        <p>
                          <span className="font-medium">Duración:</span> {getSelectedSubtreatmentDetails()?.duration}{" "}
                          minutos
                        </p>
                        <p>
                          <span className="font-medium">Precio:</span> ${getSelectedSubtreatmentDetails()?.price}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end mt-6">
                    <Button
                      onClick={handleNextStep}
                      disabled={!selectedSubtreatment}
                      className="bg-[#e07a5f] hover:bg-[#c85a3f]"
                    >
                      Siguiente
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold mb-4">Selecciona Fecha y Hora</h2>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <Label className="mb-2 block">Fecha</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? (
                              format(selectedDate, "PPP", { locale: es })
                            ) : (
                              <span>Selecciona una fecha</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            initialFocus
                            disabled={
                              (date) => date < new Date(new Date().setHours(0, 0, 0, 0)) || date.getDay() === 0 // Disable Sundays
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label className="mb-2 block">Hora</Label>
                      <Select value={selectedTime} onValueChange={setSelectedTime} disabled={!selectedDate}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una hora" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTimeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={handlePrevStep}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      onClick={handleNextStep}
                      disabled={!selectedDate || !selectedTime}
                      className="bg-[#e07a5f] hover:bg-[#c85a3f]"
                    >
                      Siguiente
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold mb-4">Completa tus Datos</h2>

                  <form onSubmit={handleSubmitBooking}>
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Nombre y Apellido</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Tu nombre completo"
                          required
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="phone">Teléfono (WhatsApp)</Label>
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Tu número de WhatsApp"
                          required
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Tu correo electrónico"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="notes">Observaciones (opcional)</Label>
                        <Textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Cualquier información adicional que quieras compartir"
                          rows={3}
                        />
                      </div>

                      <div className="bg-gray-50 p-4 rounded-md mt-4">
                        <h3 className="font-semibold mb-2">Resumen de tu Reserva</h3>
                        <p>
                          <span className="font-medium">Tratamiento:</span> {getSelectedSubtreatmentDetails()?.name}
                        </p>
                        <p>
                          <span className="font-medium">Fecha:</span>{" "}
                          {selectedDate ? format(selectedDate, "PPP", { locale: es }) : ""}
                        </p>
                        <p>
                          <span className="font-medium">Hora:</span> {selectedTime}
                        </p>
                        <p>
                          <span className="font-medium">Precio:</span> ${getSelectedSubtreatmentDetails()?.price}
                        </p>
                      </div>

                      <div className="flex justify-between mt-6">
                        <Button type="button" variant="outline" onClick={handlePrevStep}>
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Anterior
                        </Button>
                        <Button type="submit" className="bg-[#e07a5f] hover:bg-[#c85a3f]" disabled={!name || !phone}>
                          Confirmar Reserva
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="bg-[#3d405b] text-white py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">RESET-pro2</h3>
              <p>Tu salón de belleza de confianza con los mejores profesionales y tratamientos.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Contacto</h3>
              <p>Dirección: Av. Principal 123</p>
              <p>Teléfono: (123) 456-7890</p>
              <p>Email: info@reset-pro2.com</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Horarios</h3>
              <p>Lunes a Viernes: 9:00 - 18:00</p>
              <p>Sábados: 9:00 - 14:00</p>
              <p>Domingos: Cerrado</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center">
            <p>&copy; {new Date().getFullYear()} RESET-pro2. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

