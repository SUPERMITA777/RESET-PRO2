import { NextResponse } from "next/server"
import { db } from "@/lib/database"
import { whatsappService } from "@/lib/whatsapp"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date")

  if (date) {
    const appointments = db.getAppointmentsByDate(date)
    return NextResponse.json(appointments)
  }

  const appointments = db.getAppointments()
  return NextResponse.json(appointments)
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.date || !data.time || !data.clientId || !data.treatmentId || !data.subtreatmentId || !data.box) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create appointment
    const appointment = db.createAppointment({
      date: data.date,
      time: data.time,
      clientId: data.clientId,
      professionalId: data.professionalId || 0,
      treatmentId: data.treatmentId,
      subtreatmentId: data.subtreatmentId,
      box: data.box,
      status: data.status || "pending",
      deposit: data.deposit || 0,
      price: data.price,
      notes: data.notes || "",
    })

    // Get client and treatment details for WhatsApp notification
    const client = db.getClientById(data.clientId)
    const treatment = db.getTreatmentById(data.treatmentId)
    const subtreatment = treatment?.subtreatments.find((s) => s.id === data.subtreatmentId)

    if (client && subtreatment) {
      // Send WhatsApp notifications
      await whatsappService.sendAppointmentConfirmation(
        client.phone,
        client.name,
        subtreatment.name,
        data.date,
        data.time,
      )

      await whatsappService.sendAdminNotification(client.name, client.phone, subtreatment.name, data.date, data.time)
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error("Error creating appointment:", error)
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 })
  }
}

