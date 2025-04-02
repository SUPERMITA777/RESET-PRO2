import { NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET() {
  const treatments = db.getTreatments()
  return NextResponse.json(treatments)
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Create treatment
    const treatment = db.createTreatment({
      name: data.name,
      description: data.description || "",
      duration: data.duration || 0,
      price: data.price || 0,
      subtreatments: data.subtreatments || [],
    })

    return NextResponse.json(treatment)
  } catch (error) {
    console.error("Error creating treatment:", error)
    return NextResponse.json({ error: "Failed to create treatment" }, { status: 500 })
  }
}

