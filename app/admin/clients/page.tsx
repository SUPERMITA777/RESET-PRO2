"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Pencil, Trash, Search } from "lucide-react"

// Mock data for clients
const initialClients = [
  {
    id: 1,
    name: "María González",
    phone: "123-456-7890",
    email: "maria.gonzalez@example.com",
    history: "Cliente regular. Prefiere masajes descontracturantes.",
    lastVisit: "2023-03-15",
  },
  {
    id: 2,
    name: "Carlos Rodríguez",
    phone: "234-567-8901",
    email: "carlos.rodriguez@example.com",
    history: "Primera visita el 10/02/2023. Tratamiento facial.",
    lastVisit: "2023-02-10",
  },
  {
    id: 3,
    name: "Laura Martínez",
    phone: "345-678-9012",
    email: "laura.martinez@example.com",
    history: "Tiene dolor crónico en la espalda. Masajes terapéuticos.",
    lastVisit: "2023-03-20",
  },
  {
    id: 4,
    name: "Javier López",
    phone: "456-789-0123",
    email: "javier.lopez@example.com",
    history: "Prefiere tratamientos por la tarde.",
    lastVisit: "2023-03-05",
  },
  {
    id: 5,
    name: "Ana Sánchez",
    phone: "567-890-1234",
    email: "ana.sanchez@example.com",
    history: "Alérgica a algunos aceites esenciales.",
    lastVisit: "2023-03-18",
  },
]

export default function ClientsPage() {
  const [clients, setClients] = useState(initialClients)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<any | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Handle open client dialog
  const handleOpenClientDialog = (client: any = null) => {
    setSelectedClient(client)
    setIsDialogOpen(true)
  }

  // Handle save client
  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault()

    const formData = new FormData(e.target as HTMLFormElement)
    const name = formData.get("name") as string
    const phone = formData.get("phone") as string
    const email = formData.get("email") as string
    const history = formData.get("history") as string

    if (selectedClient) {
      // Update existing client
      setClients(
        clients.map((client) =>
          client.id === selectedClient.id
            ? {
                ...client,
                name,
                phone,
                email,
                history,
              }
            : client,
        ),
      )
    } else {
      // Create new client
      const newClient = {
        id: Date.now(),
        name,
        phone,
        email,
        history,
        lastVisit: new Date().toISOString().split("T")[0],
      }

      setClients([...clients, newClient])
    }

    setIsDialogOpen(false)
  }

  // Handle delete client
  const handleDeleteClient = (id: number) => {
    setClients(clients.filter((client) => client.id !== id))
  }

  // Filter clients based on search term
  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestión de Clientes</h2>
        <Button onClick={() => handleOpenClientDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono o email..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Historial</TableHead>
                <TableHead>Última Visita</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={client.history}>
                      {client.history}
                    </div>
                  </TableCell>
                  <TableCell>{client.lastVisit}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenClientDialog(client)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClient(client.id)}>
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

      {/* Client Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedClient ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveClient}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={selectedClient?.name || ""}
                  placeholder="Nombre completo"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={selectedClient?.phone || ""}
                  placeholder="Teléfono de contacto"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={selectedClient?.email || ""}
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="history">Historial Clínico</Label>
                <Textarea
                  id="history"
                  name="history"
                  defaultValue={selectedClient?.history || ""}
                  placeholder="Información relevante sobre el cliente"
                  rows={4}
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

