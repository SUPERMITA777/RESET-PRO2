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

// Mock data for products
const initialProducts = [
  {
    id: 1,
    name: "Aceite de Masaje Relajante",
    description: "Aceite esencial para masajes relajantes",
    price: 2500,
    stock: 15,
  },
  {
    id: 2,
    name: "Crema Hidratante Facial",
    description: "Crema hidratante para todo tipo de piel",
    price: 3200,
    stock: 8,
  },
  {
    id: 3,
    name: "Exfoliante Corporal",
    description: "Exfoliante natural para una piel suave",
    price: 2800,
    stock: 12,
  },
  {
    id: 4,
    name: "Mascarilla Facial de Arcilla",
    description: "Mascarilla purificante para pieles grasas",
    price: 1800,
    stock: 20,
  },
  {
    id: 5,
    name: "Sérum Antiarrugas",
    description: "Sérum concentrado para reducir líneas de expresión",
    price: 4500,
    stock: 5,
  },
]

export default function ProductsPage() {
  const [products, setProducts] = useState(initialProducts)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Handle open product dialog
  const handleOpenProductDialog = (product: any = null) => {
    setSelectedProduct(product)
    setIsDialogOpen(true)
  }

  // Handle save product
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault()

    const formData = new FormData(e.target as HTMLFormElement)
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const price = Number(formData.get("price"))
    const stock = Number(formData.get("stock"))

    if (selectedProduct) {
      // Update existing product
      setProducts(
        products.map((product) =>
          product.id === selectedProduct.id
            ? {
                ...product,
                name,
                description,
                price,
                stock,
              }
            : product,
        ),
      )
    } else {
      // Create new product
      const newProduct = {
        id: Date.now(),
        name,
        description,
        price,
        stock,
      }

      setProducts([...products, newProduct])
    }

    setIsDialogOpen(false)
  }

  // Handle delete product
  const handleDeleteProduct = (id: number) => {
    setProducts(products.filter((product) => product.id !== id))
  }

  // Filter products based on search term
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestión de Productos</h2>
        <Button onClick={() => handleOpenProductDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o descripción..."
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
                <TableHead>Descripción</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={product.description}>
                      {product.description}
                    </div>
                  </TableCell>
                  <TableCell>${product.price}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenProductDialog(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)}>
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

      {/* Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedProduct ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveProduct}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={selectedProduct?.name || ""}
                  placeholder="Nombre del producto"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={selectedProduct?.description || ""}
                  placeholder="Descripción del producto"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Precio</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    defaultValue={selectedProduct?.price || 0}
                    min={0}
                    step={100}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    defaultValue={selectedProduct?.stock || 0}
                    min={0}
                    required
                  />
                </div>
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

