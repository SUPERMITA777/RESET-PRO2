import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { createSupabaseClient } from '@/lib/supabase/client'

interface DatabaseStatus {
  table: string
  status: 'ok' | 'error'
  message: string
  count?: number
}

export function DatabaseMaintenance() {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<DatabaseStatus[]>([])
  const { toast } = useToast()

  const checkDatabaseStructure = async () => {
    setIsLoading(true)
    setStatus([])
    
    try {
      const supabase = createSupabaseClient()
      const tables = [
        'professionals',
        'treatment_availabilities',
        'treatments',
        'subtreatments',
        'appointments',
        'clients',
        'products',
        'payment_methods',
        'sales',
        'payments',
        'sale_items'
      ]

      const results: DatabaseStatus[] = []

      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })

          if (error) {
            results.push({
              table,
              status: 'error',
              message: error.message
            })
          } else {
            results.push({
              table,
              status: 'ok',
              message: 'Tabla verificada correctamente',
              count: data?.length || 0
            })
          }
        } catch (error) {
          results.push({
            table,
            status: 'error',
            message: error instanceof Error ? error.message : 'Error desconocido'
          })
        }
      }

      setStatus(results)
      toast({
        title: "Verificación completada",
        description: "Se ha verificado la estructura de la base de datos",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al verificar la base de datos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const repairDatabase = async () => {
    setIsLoading(true)
    setStatus([])
    
    try {
      const supabase = createSupabaseClient()
      const results: DatabaseStatus[] = []

      // 1. Verificar y crear tablas faltantes
      const createTablesSQL = `
        -- Crear tabla de profesionales si no existe
        CREATE TABLE IF NOT EXISTS professionals (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          specialty TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT NOT NULL,
          bio TEXT,
          schedule JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        -- Crear tabla de tratamientos si no existe
        CREATE TABLE IF NOT EXISTS treatments (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          duration INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        -- Crear tabla de subtratamientos si no existe
        CREATE TABLE IF NOT EXISTS subtreatments (
          id SERIAL PRIMARY KEY,
          treatment_id INTEGER REFERENCES treatments(id),
          name TEXT NOT NULL,
          description TEXT,
          duration INTEGER NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        -- Crear tabla de disponibilidad de tratamientos si no existe
        CREATE TABLE IF NOT EXISTS treatment_availabilities (
          id SERIAL PRIMARY KEY,
          treatment_id INTEGER REFERENCES treatments(id),
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          box TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        -- Crear tabla de clientes si no existe
        CREATE TABLE IF NOT EXISTS clients (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          email TEXT,
          history TEXT,
          last_visit DATE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        -- Crear tabla de citas si no existe
        CREATE TABLE IF NOT EXISTS appointments (
          id SERIAL PRIMARY KEY,
          date DATE NOT NULL,
          time TIME NOT NULL,
          client_id INTEGER REFERENCES clients(id),
          professional_id INTEGER REFERENCES professionals(id),
          treatment_id INTEGER REFERENCES treatments(id),
          subtreatment_id INTEGER REFERENCES subtreatments(id),
          box TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('available', 'pending', 'confirmed', 'completed', 'canceled')),
          deposit DECIMAL(10,2) DEFAULT 0,
          price DECIMAL(10,2) NOT NULL,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        -- Crear tabla de productos si no existe
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          stock INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        -- Crear tabla de métodos de pago si no existe
        CREATE TABLE IF NOT EXISTS payment_methods (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        -- Crear tabla de ventas si no existe
        CREATE TABLE IF NOT EXISTS sales (
          id SERIAL PRIMARY KEY,
          date DATE NOT NULL,
          client_id INTEGER REFERENCES clients(id),
          appointment_id INTEGER REFERENCES appointments(id),
          total DECIMAL(10,2) NOT NULL,
          completed BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        -- Crear tabla de items de venta si no existe
        CREATE TABLE IF NOT EXISTS sale_items (
          id SERIAL PRIMARY KEY,
          sale_id INTEGER REFERENCES sales(id),
          type TEXT NOT NULL CHECK (type IN ('product', 'treatment')),
          item_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          price DECIMAL(10,2) NOT NULL,
          name TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        -- Crear tabla de pagos si no existe
        CREATE TABLE IF NOT EXISTS payments (
          id SERIAL PRIMARY KEY,
          sale_id INTEGER REFERENCES sales(id),
          method TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );
      `

      // Ejecutar el script SQL
      const { error: createTablesError } = await supabase.rpc('exec_sql', { sql: createTablesSQL })
      
      if (createTablesError) {
        throw new Error(`Error al crear tablas: ${createTablesError.message}`)
      }

      // 2. Verificar e insertar datos de ejemplo si las tablas están vacías
      const tables = [
        'professionals',
        'treatments',
        'subtreatments',
        'treatment_availabilities',
        'clients',
        'products',
        'payment_methods'
      ]

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (error) {
          results.push({
            table,
            status: 'error',
            message: error.message
          })
        } else if (!data || data.length === 0) {
          // Insertar datos de ejemplo según la tabla
          const seedData = getSeedDataForTable(table)
          if (seedData) {
            const { error: insertError } = await supabase
              .from(table)
              .insert(seedData)

            if (insertError) {
              results.push({
                table,
                status: 'error',
                message: `Error al insertar datos: ${insertError.message}`
              })
            } else {
              results.push({
                table,
                status: 'ok',
                message: 'Datos de ejemplo insertados correctamente',
                count: seedData.length
              })
            }
          }
        } else {
          results.push({
            table,
            status: 'ok',
            message: 'Tabla verificada correctamente',
            count: data.length
          })
        }
      }

      setStatus(results)
      toast({
        title: "Reparación completada",
        description: "Se han realizado las reparaciones necesarias",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al reparar la base de datos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getSeedDataForTable = (table: string) => {
    switch (table) {
      case 'professionals':
        return [
          {
            name: "Ana García",
            specialty: "Masajista",
            email: "ana.garcia@example.com",
            phone: "123-456-7890",
            bio: "Especialista en masajes terapéuticos con más de 5 años de experiencia."
          },
          {
            name: "Carlos Rodríguez",
            specialty: "Esteticista",
            email: "carlos.rodriguez@example.com",
            phone: "234-567-8901",
            bio: "Especialista en tratamientos faciales y corporales."
          }
        ]
      case 'treatments':
        return [
          {
            name: "Masajes",
            description: "Diferentes tipos de masajes terapéuticos y relajantes",
            duration: 40
          },
          {
            name: "Faciales",
            description: "Tratamientos para el cuidado de la piel del rostro",
            duration: 45
          }
        ]
      case 'subtreatments':
        return [
          {
            treatment_id: 1,
            name: "Masaje Descontracturante",
            description: "Alivia tensiones musculares",
            duration: 40,
            price: 9000
          },
          {
            treatment_id: 1,
            name: "Masaje de Cuello",
            description: "Enfocado en la zona cervical",
            duration: 30,
            price: 7000
          },
          {
            treatment_id: 1,
            name: "Masaje de Piernas",
            description: "Mejora la circulación",
            duration: 35,
            price: 8000
          },
          {
            treatment_id: 2,
            name: "Limpieza Facial",
            description: "Limpieza profunda de cutis",
            duration: 45,
            price: 6000
          },
          {
            treatment_id: 2,
            name: "Hidratación Profunda",
            description: "Hidratación intensiva para pieles secas",
            duration: 50,
            price: 7500
          }
        ]
      case 'treatment_availabilities':
        return [
          {
            treatment_id: 1,
            start_date: "2023-04-01",
            end_date: "2023-12-31",
            start_time: "09:00",
            end_time: "18:00",
            box: "Box 1"
          },
          {
            treatment_id: 2,
            start_date: "2023-04-01",
            end_date: "2023-12-31",
            start_time: "10:00",
            end_time: "17:00",
            box: "Box 2"
          }
        ]
      case 'clients':
        return [
          {
            name: "María González",
            phone: "123-456-7890",
            email: "maria.gonzalez@example.com",
            history: "Cliente regular. Prefiere masajes descontracturantes.",
            last_visit: "2023-03-15"
          },
          {
            name: "Carlos Rodríguez",
            phone: "234-567-8901",
            email: "carlos.rodriguez@example.com",
            history: "Primera visita el 10/02/2023. Tratamiento facial.",
            last_visit: "2023-02-10"
          }
        ]
      case 'products':
        return [
          {
            name: "Aceite de Masaje Relajante",
            description: "Aceite esencial para masajes relajantes",
            price: 2500,
            stock: 15
          },
          {
            name: "Crema Hidratante Facial",
            description: "Crema hidratante para todo tipo de piel",
            price: 3200,
            stock: 8
          }
        ]
      case 'payment_methods':
        return [
          {
            name: "Efectivo",
            description: "Pago en efectivo"
          },
          {
            name: "Transferencia",
            description: "Transferencia bancaria"
          },
          {
            name: "Tarjeta de Crédito",
            description: "Pago con tarjeta de crédito"
          },
          {
            name: "Tarjeta de Débito",
            description: "Pago con tarjeta de débito"
          }
        ]
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mantenimiento de Base de Datos</CardTitle>
        <CardDescription>
          Verifica y repara la estructura de la base de datos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button 
            onClick={checkDatabaseStructure}
            disabled={isLoading}
          >
            Verificar Estructura
          </Button>
          <Button 
            onClick={repairDatabase}
            disabled={isLoading}
            variant="destructive"
          >
            Reparar Base de Datos
          </Button>
        </div>

        {status.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Resultados de la verificación:</h3>
            <div className="grid gap-2">
              {status.map((item) => (
                <div
                  key={item.table}
                  className={`p-2 rounded ${
                    item.status === 'ok' ? 'bg-green-100' : 'bg-red-100'
                  }`}
                >
                  <p className="font-medium">{item.table}</p>
                  <p className="text-sm">{item.message}</p>
                  {item.count !== undefined && (
                    <p className="text-sm">Registros: {item.count}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 