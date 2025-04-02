"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash, Calendar } from "lucide-react"
import { db, type Treatment, type TreatmentAvailability } from "@/lib/database"

// Mock data for treatments
const initialTreatments = db.getTreatments()

// Mock data for boxes
const boxes = ["Box 1", "Box 2", "Box 3", "Box 4", "Box 5"]

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[]>(initialTreatments)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubtreatmentDialogOpen, setIsSubtreatmentDialogOpen] = useState(false)
  const [isAvailabilityDialogOpen, setIsAvailabilityDialogOpen] = useState(false)
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null)
  const [selectedSubtreatment, setSelectedSubtreatment] = useState<any | null>(null)
  const [selectedAvailability, setSelectedAvailability] = useState<TreatmentAvailability | null>(null)
  const [currentTreatmentId, setCurrentTreatmentId] = useState<number | null>(null)

  // Handle open treatment dialog
  const handleOpenTreatmentDialog = (treatment: Treatment | null = null) => {
    setSelectedTreatment(treatment)
    setIsDialogOpen(true)
  }

  // Handle open subtreatment dialog
  const handleOpenSubtreatmentDialog = (treatmentId: number, subtreatment: any = null) => {
    setCurrentTreatmentId(treatmentId)
    setSelectedSubtreatment(subtreatment)
    setIsSubtreatmentDialogOpen(true)
  }

  // Handle open availability dialog
  const handleOpenAvailabilityDialog = (treatmentId: number, availability: TreatmentAvailability | null = null) => {
    setCurrentTreatmentId(treatmentId)
    setSelectedAvailability(availability)
    setIsAvailabilityDialogOpen(true)
  }

  // Handle save treatment
  const handleSaveTreatment = (e: React.FormEvent) => {
    e.preventDefault()

    const formData = new FormData(e.target as HTMLFormElement)
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const duration = Number(formData.get("duration"))

    if (selectedTreatment) {
      // Update existing treatment
      setTreatments(
        treatments.map((treatment) =>
          treatment.id === selectedTreatment.id
            ? {
                ...treatment,
                name,
                description,
                duration,
              }
            : treatment,
        ),
      )
    } else {
      // Create new treatment
      const newTreatment = {
        id: Date.now(),
        name,
        description,
        duration,
        price: 0,
        subtreatments: [],
        availabilities: [],
      }

      setTreatments([...treatments, newTreatment])
    }

    setIsDialogOpen(false)
  }

  // Handle delete treatment
  const handleDeleteTreatment = (id: number) => {
    setTreatments(treatments.filter((treatment) => treatment.id !== id))
  }

  // Handle save subtreatment
  const handleSaveSubtreatment = (e: React.FormEvent) => {
    e.preventDefault()

    if (currentTreatmentId === null) return

    const formData = new FormData(e.target as HTMLFormElement)
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const duration = Number(formData.get("duration"))
    const price = Number(formData.get("price"))

    setTreatments(
      treatments.map((treatment) => {
        if (treatment.id !== currentTreatmentId) return treatment

        let updatedSubtreatments

        if (selectedSubtreatment) {
          // Update existing subtreatment
          updatedSubtreatments = treatment.subtreatments.map((subtreatment) =>
            subtreatment.id === selectedSubtreatment.id
              ? { id: subtreatment.id, name, description, duration, price }
              : subtreatment,
          )
        } else {
          // Create new subtreatment
          const newSubtreatment = {
            id: Date.now(),
            name,
            description,
            duration,
            price,
          }

          updatedSubtreatments = [...treatment.subtreatments, newSubtreatment]
        }

        return {
          ...treatment,
          subtreatments: updatedSubtreatments,
        }
      }),
    )

    setIsSubtreatmentDialogOpen(false)
  }

  // Handle delete subtreatment
  const handleDeleteSubtreatment = (treatmentId: number, subtreatmentId: number) => {
    setTreatments(
      treatments.map((treatment) => {
        if (treatment.id !== treatmentId) return treatment

        return {
          ...treatment,
          subtreatments: treatment.subtreatments.filter((subtreatment) => subtreatment.id !== subtreatmentId),
        }
      }),
    )
  }

  // Handle save availability
  const handleSaveAvailability = (e: React.FormEvent) => {
    e.preventDefault()

    if (currentTreatmentId === null) return

    const formData = new FormData(e.target as HTMLFormElement)
    const startDate = formData.get("startDate") as string
    const endDate = formData.get("endDate") as string
    const startTime = formData.get("startTime") as string
    const endTime = formData.get("endTime") as string
    const box = formData.get("box") as string

    setTreatments(
      treatments.map((treatment) => {
        if (treatment.id !== currentTreatmentId) return treatment

        let updatedAvailabilities

        if (selectedAvailability) {
          // Update existing availability
          updatedAvailabilities = treatment.availabilities.map((availability) =>
            availability.id === selectedAvailability.id
              ? {
                  ...availability,
                  startDate,
                  endDate,
                  startTime,
                  endTime,
                  box,
                }
              : availability,
          )
        } else {
          // Create new availability
          const newAvailability = {
            id: Date.now(),
            treatmentId: currentTreatmentId,
            startDate,
            endDate,
            startTime,
            endTime,
            box,
          }

          updatedAvailabilities = [...treatment.availabilities, newAvailability]
        }

        return {
          ...treatment,
          availabilities: updatedAvailabilities,
        }
      }),
    )

    setIsAvailabilityDialogOpen(false)
  }

  // Handle delete availability
  const handleDeleteAvailability = (treatmentId: number, availabilityId: number) => {
    setTreatments(
      treatments.map((treatment) => {
        if (treatment.id !== treatmentId) return treatment

        return {
          ...treatment,
          availabilities: treatment.availabilities.filter((availability) => availability.id !== availabilityId),
        }
      }),
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestión de Tratamientos</h2>
        <Button onClick={() => handleOpenTreatmentDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Tratamiento
        </Button>
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
                    <TableHead>Duración (min)</TableHead>
                    <TableHead>Subtratamientos</TableHead>
                    <TableHead>Disponibilidades</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treatments.map((treatment) => (
                    <TableRow key={treatment.id}>
                      <TableCell className="font-medium">{treatment.name}</TableCell>
                      <TableCell>{treatment.description}</TableCell>
                      <TableCell>{treatment.duration}</TableCell>
                      <TableCell>{treatment.subtreatments.length}</TableCell>
                      <TableCell>{treatment.availabilities.length}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenTreatmentDialog(treatment)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteTreatment(treatment.id)}>
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
                      <TableHead>Descripción</TableHead>
                      <TableHead>Duración (min)</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {treatment.subtreatments.map((subtreatment) => (
                      <TableRow key={subtreatment.id}>
                        <TableCell className="font-medium">{subtreatment.name}</TableCell>
                        <TableCell>{subtreatment.description}</TableCell>
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
                <Button size="sm" onClick={() => handleOpenAvailabilityDialog(treatment.id)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Nueva Disponibilidad
                </Button>
              </CardHeader>
              <CardContent className="p-0">
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
                        <TableCell>{availability.startDate}</TableCell>
                        <TableCell>{availability.endDate}</TableCell>
                        <TableCell>{availability.startTime}</TableCell>
                        <TableCell>{availability.endTime}</TableCell>
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
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Treatment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTreatment ? "Editar Tratamiento" : "Nuevo Tratamiento"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveTreatment}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={selectedTreatment?.name || ""}
                  placeholder="Nombre del tratamiento"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  name="description"
                  defaultValue={selectedTreatment?.description || ""}
                  placeholder="Descripción del tratamiento"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="duration">Duración (minutos)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  defaultValue={selectedTreatment?.duration || 30}
                  min={1}
                  required
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

      {/* Subtreatment Dialog */}
      <Dialog open={isSubtreatmentDialogOpen} onOpenChange={setIsSubtreatmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedSubtreatment ? "Editar Subtratamiento" : "Nuevo Subtratamiento"}</DialogTitle>
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
                <Label htmlFor="subDescription">Descripción</Label>
                <Input
                  id="subDescription"
                  name="description"
                  defaultValue={selectedSubtreatment?.description || ""}
                  placeholder="Descripción del subtratamiento"
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
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Availability Dialog */}
      <Dialog open={isAvailabilityDialogOpen} onOpenChange={setIsAvailabilityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAvailability ? "Editar Disponibilidad" : "Nueva Disponibilidad"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveAvailability}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Fecha Inicio</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    defaultValue={selectedAvailability?.startDate || new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="endDate">Fecha Fin</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    defaultValue={selectedAvailability?.endDate || new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Hora Inicio</Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="time"
                    defaultValue={selectedAvailability?.startTime || "09:00"}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="endTime">Hora Fin</Label>
                  <Input
                    id="endTime"
                    name="endTime"
                    type="time"
                    defaultValue={selectedAvailability?.endTime || "18:00"}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="box">Box</Label>
                <select
                  id="box"
                  name="box"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue={selectedAvailability?.box || "Box 1"}
                  required
                >
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
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

