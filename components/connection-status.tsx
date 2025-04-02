"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function ConnectionStatus() {
  const [status, setStatus] = useState<"checking" | "connected" | "error">("checking")
  const [error, setError] = useState("")

  useEffect(() => {
    async function checkConnection() {
      try {
        const supabase = getSupabaseClient()

        // Intentar una consulta simple para verificar la conexión
        const { data, error } = await supabase.from("professionals").select("id").limit(1)

        if (error) {
          throw error
        }

        setStatus("connected")
      } catch (err) {
        setStatus("error")
        setError(err instanceof Error ? err.message : "Error de conexión desconocido")
        console.error("Error de conexión:", err)
      }
    }

    checkConnection()
  }, [])

  if (status === "checking") {
    return (
      <Alert className="bg-gray-50 border-gray-200 text-gray-800">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Verificando conexión a la base de datos...</AlertDescription>
      </Alert>
    )
  }

  if (status === "error") {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Error de conexión: {error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="bg-green-50 border-green-200 text-green-800">
      <CheckCircle className="h-4 w-4" />
      <AlertDescription>Conectado correctamente a la base de datos</AlertDescription>
    </Alert>
  )
}

