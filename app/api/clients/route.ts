import { NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search")

  if (search) {
    const searchLower = search.toLowerCase()
    const clients = db
      .getClients()
      .filter(
        (client) =>
          client.name.toLowerCase().includes(searchLower) ||
          client.phone.includes(search) ||
          client.email.toLowerCase().includes(searchLower),
      )
    return NextResponse.json(clients)
  }

  const clients = db.getClients()
  return NextResponse.json(clients)
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.name || !data.phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 })
    }

    // Create client
    const client = db.createClient({
      name: data.name,
      phone: data.phone,
      email: data.email || "",
      history: data.history || "",
      lastVisit: new Date().toISOString().split("T")[0],
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error("Error creating client:", error)
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 })
  }
}

