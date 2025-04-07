"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Pencil, Trash, Search } from "lucide-react"
import { createSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

interface Client {
  id: number
  name: string
  phone: string
  email: string
  history: string
  last_visit: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Load data
  useEffect(() => {
    loadClients()
  }, [])

  // Load clients from Supabase
  const loadClients = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('clients')
        .select('*')
      
      if (error) throw error

      setClients(data || [])
      setFilteredClients(data || [])
    } catch (error) {
      console.error('Error loading clients:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter clients
  useEffect(() => {
    if (!searchTerm) {
      setFilteredClients(clients)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = clients.filter(
      (client) =>
        client.name.toLowerCase().includes(term) ||
        client.phone.includes(term) ||
        client.email.toLowerCase().includes(term)
    )
    setFilteredClients(filtered)
  }, [clients, searchTerm])

  // Handle open dialog
  const handleOpenDialog = (client?: Client) => {
    setSelectedClient(client || null)
    setIsDialogOpen(true)
  }

  // Handle save client
  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createSupabaseClient()
      const formData = new FormData(e.target as HTMLFormElement)
      const clientData = {
        name: formData.get("name") as string,
        phone: formData.get("phone") as string,
        email: formData.get("email") as string,
        history: formData.get("history") as string,
        last_visit: formData.get("lastVisit") as string,
      }

      if (selectedClient) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', selectedClient.id)

        if (error) throw error

        // Update local state
        setClients(clients.map(client => 
          client.id === selectedClient.id ? { ...client, ...clientData } : client
        ))

        toast({
          title: "Éxito",
          description: "Cliente actualizado correctamente",
        })
      } else {
        // Create new client
        const { data, error } = await supabase
          .from('clients')
          .insert(clientData)
          .select()
          .single()

        if (error) throw error

        // Update local state
        setClients([...clients, data])

        toast({
          title: "Éxito",
          description: "Cliente creado correctamente",
        })
      }

      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving client:', error)
      toast({
        title: "Error",
        description: "No se pudo guardar el cliente",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle delete client
  const handleDeleteClient = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este cliente?")) return
    setIsLoading(true)

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Update local state
      setClients(clients.filter(client => client.id !== id))

      toast({
        title: "Éxito",
        description: "Cliente eliminado correctamente",
      })
    } catch (error) {
      console.error('Error deleting client:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestión de Clientes</h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
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
                <TableHead>Última Visita</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.last_visit}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(client)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClient(client.id)}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedClient ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
            <DialogDescription>
              {selectedClient ? "Modifica los datos del cliente" : "Ingresa los datos del nuevo cliente"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveClient}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={selectedClient?.name}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={selectedClient?.phone}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={selectedClient?.email}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="history">Historial</Label>
                <Textarea
                  id="history"
                  name="history"
                  defaultValue={selectedClient?.history}
                  placeholder="Historial médico y preferencias del cliente"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="lastVisit">Última Visita</Label>
                <Input
                  id="lastVisit"
                  name="lastVisit"
                  type="date"
                  defaultValue={selectedClient?.last_visit}
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
    </div>
  )
}

