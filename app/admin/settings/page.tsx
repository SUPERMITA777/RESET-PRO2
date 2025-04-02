"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Pencil, Trash, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Importar getSupabaseClient al principio del archivo
import { getSupabaseClient } from "@/lib/supabase/client"
import { ConnectionStatus } from "@/components/connection-status"

// Mock data for payment methods
const initialPaymentMethods = [
  { id: 1, name: "Efectivo", description: "Pago en efectivo" },
  { id: 2, name: "Transferencia", description: "Transferencia bancaria" },
  { id: 3, name: "Tarjeta de Crédito", description: "Pago con tarjeta de crédito" },
  { id: 4, name: "Tarjeta de Débito", description: "Pago con tarjeta de débito" },
]

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState("RESET-pro2")
  const [address, setAddress] = useState("Av. Principal 123")
  const [phone, setPhone] = useState("(123) 456-7890")
  const [email, setEmail] = useState("info@reset-pro2.com")
  const [paymentMethods, setPaymentMethods] = useState(initialPaymentMethods)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any | null>(null)

  const [backupInProgress, setBackupInProgress] = useState(false)
  const [backupComplete, setBackupComplete] = useState(false)
  const [backupError, setBackupError] = useState("")
  const [backupUrl, setBackupUrl] = useState("")

  // Función para realizar el backup
  const handleBackupDatabase = async () => {
    setBackupInProgress(true)
    setBackupComplete(false)
    setBackupError("")

    try {
      const supabase = getSupabaseClient()

      // Obtener todos los datos de todas las tablas
      const tables = [
        "professionals",
        "professional_schedules",
        "treatments",
        "subtreatments",
        "treatment_availabilities",
        "clients",
        "appointments",
        "products",
        "payment_methods",
        "sales",
        "sale_items",
        "payments",
      ]

      const backupData: Record<string, any> = {}

      for (const table of tables) {
        const { data, error } = await supabase.from(table).select("*")

        if (error) {
          throw new Error(`Error al obtener datos de ${table}: ${error.message}`)
        }

        backupData[table] = data
      }

      // Crear un blob con los datos
      const jsonData = JSON.stringify(backupData, null, 2)
      const blob = new Blob([jsonData], { type: "application/json" })

      // Crear URL para descarga
      const url = URL.createObjectURL(blob)
      setBackupUrl(url)

      setBackupComplete(true)
    } catch (error) {
      console.error("Error al crear backup:", error)
      setBackupError(typeof error === "object" ? (error as Error).message : String(error))
    } finally {
      setBackupInProgress(false)
    }
  }

  // Handle save business info
  const handleSaveBusinessInfo = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would save to a database
    alert("Información del negocio actualizada")
  }

  // Handle open payment method dialog
  const handleOpenPaymentMethodDialog = (paymentMethod: any = null) => {
    setSelectedPaymentMethod(paymentMethod)
    setIsDialogOpen(true)
  }

  // Handle save payment method
  const handleSavePaymentMethod = (e: React.FormEvent) => {
    e.preventDefault()

    const formData = new FormData(e.target as HTMLFormElement)
    const name = formData.get("name") as string
    const description = formData.get("description") as string

    if (selectedPaymentMethod) {
      // Update existing payment method
      setPaymentMethods(
        paymentMethods.map((method) =>
          method.id === selectedPaymentMethod.id ? { ...method, name, description } : method,
        ),
      )
    } else {
      // Create new payment method
      const newPaymentMethod = {
        id: Date.now(),
        name,
        description,
      }

      setPaymentMethods([...paymentMethods, newPaymentMethod])
    }

    setIsDialogOpen(false)
  }

  // Handle delete payment method
  const handleDeletePaymentMethod = (id: number) => {
    setPaymentMethods(paymentMethods.filter((method) => method.id !== id))
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="business">
        <TabsList>
          <TabsTrigger value="business">Información del Negocio</TabsTrigger>
          <TabsTrigger value="payment">Métodos de Pago</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información del Negocio</CardTitle>
              <CardDescription>Actualiza la información básica de tu negocio</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveBusinessInfo}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="businessName">Nombre del Negocio</Label>
                    <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>

                  <Button type="submit" className="mt-4">
                    Guardar Cambios
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Métodos de Pago</h2>
            <Button onClick={() => handleOpenPaymentMethodDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Método
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentMethods.map((method) => (
                    <TableRow key={method.id}>
                      <TableCell className="font-medium">{method.name}</TableCell>
                      <TableCell>{method.description}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenPaymentMethodDialog(method)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeletePaymentMethod(method.id)}>
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

        <TabsContent value="backup" className="space-y-4">
          <ConnectionStatus />
          <Card>
            <CardHeader>
              <CardTitle>Backup de la Base de Datos</CardTitle>
              <CardDescription>Crea un archivo de respaldo con todos los datos del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <p>
                  Esta función creará un archivo JSON con todos los datos de tu sistema, incluyendo profesionales,
                  tratamientos, citas, clientes y ventas. Te recomendamos realizar backups regularmente.
                </p>

                {backupError && (
                  <Alert variant="destructive" className="my-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{backupError}</AlertDescription>
                  </Alert>
                )}

                {backupComplete && (
                  <Alert className="my-4 bg-green-50 text-green-800 border-green-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Backup creado exitosamente</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={handleBackupDatabase} disabled={backupInProgress} className="flex-1">
                    {backupInProgress ? "Creando backup..." : "Crear Backup"}
                  </Button>

                  {backupComplete && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        // Crear un elemento <a> para la descarga
                        const a = document.createElement("a")
                        a.href = backupUrl
                        a.download = `reset-pro2-backup-${new Date().toISOString().split("T")[0]}.json`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                      }}
                    >
                      Descargar Backup
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Method Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedPaymentMethod ? "Editar Método de Pago" : "Nuevo Método de Pago"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSavePaymentMethod}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={selectedPaymentMethod?.name || ""}
                  placeholder="Nombre del método de pago"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  name="description"
                  defaultValue={selectedPaymentMethod?.description || ""}
                  placeholder="Descripción breve"
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
        </DialogContent>
      </Dialog>
    </div>
  )
}

