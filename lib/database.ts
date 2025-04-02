// This is a mock database service for demonstration purposes
// In a real application, you would connect to a real database like PostgreSQL

// Types
export interface Professional {
  id: number
  name: string
  specialty: string
  email: string
  phone: string
  schedule: Record<string, string[]>
  bio: string
}

export interface TreatmentAvailability {
  id: number
  treatmentId: number
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  box: string
}

export interface Treatment {
  id: number
  name: string
  description: string
  duration: number
  price: number
  subtreatments: Subtreatment[]
  availabilities: TreatmentAvailability[]
}

export interface Subtreatment {
  id: number
  name: string
  description: string
  duration: number
  price: number
}

export interface Appointment {
  id: number
  date: string
  time: string
  clientId: number
  professionalId: number
  treatmentId: number
  subtreatmentId: number
  box: string
  status: "available" | "pending" | "confirmed" | "completed" | "canceled"
  deposit: number
  price: number
  notes: string
}

export interface Client {
  id: number
  name: string
  phone: string
  email: string
  history: string
  lastVisit: string
}

export interface Product {
  id: number
  name: string
  description: string
  price: number
  stock: number
}

export interface PaymentMethod {
  id: number
  name: string
  description: string
}

export interface Payment {
  id: number
  saleId: number
  method: string
  amount: number
}

export interface Sale {
  id: number
  date: string
  clientId: number
  appointmentId: number | null
  items: SaleItem[]
  total: number
  payments: Payment[]
  completed: boolean
}

export interface SaleItem {
  id: number
  type: "product" | "treatment"
  itemId: number
  quantity: number
  price: number
  name: string
}

// Mock data
let professionals: Professional[] = [
  {
    id: 1,
    name: "Ana García",
    specialty: "Masajista",
    email: "ana.garcia@example.com",
    phone: "123-456-7890",
    schedule: {
      Lunes: ["09:00", "10:00", "11:00", "12:00", "15:00", "16:00", "17:00"],
      Martes: ["09:00", "10:00", "11:00", "12:00", "15:00", "16:00", "17:00"],
      Miércoles: ["09:00", "10:00", "11:00", "12:00", "15:00", "16:00", "17:00"],
      Jueves: ["09:00", "10:00", "11:00", "12:00", "15:00", "16:00", "17:00"],
      Viernes: ["09:00", "10:00", "11:00", "12:00", "15:00", "16:00", "17:00"],
    },
    bio: "Especialista en masajes terapéuticos con más de 5 años de experiencia.",
  },
  {
    id: 2,
    name: "Carlos Rodríguez",
    specialty: "Esteticista",
    email: "carlos.rodriguez@example.com",
    phone: "234-567-8901",
    schedule: {
      Lunes: ["13:00", "14:00", "15:00", "16:00", "17:00"],
      Martes: ["13:00", "14:00", "15:00", "16:00", "17:00"],
      Miércoles: ["13:00", "14:00", "15:00", "16:00", "17:00"],
      Jueves: ["13:00", "14:00", "15:00", "16:00", "17:00"],
      Viernes: ["13:00", "14:00", "15:00", "16:00", "17:00"],
    },
    bio: "Especialista en tratamientos faciales y corporales.",
  },
]

let treatmentAvailabilities: TreatmentAvailability[] = [
  {
    id: 1,
    treatmentId: 1,
    startDate: "2023-04-01",
    endDate: "2023-04-30",
    startTime: "09:00",
    endTime: "18:00",
    box: "Box 1",
  },
  {
    id: 2,
    treatmentId: 2,
    startDate: "2023-04-01",
    endDate: "2023-04-30",
    startTime: "10:00",
    endTime: "17:00",
    box: "Box 2",
  },
]

let treatments: Treatment[] = [
  {
    id: 1,
    name: "Masajes",
    description: "Diferentes tipos de masajes terapéuticos y relajantes",
    duration: 40,
    price: 0,
    subtreatments: [
      {
        id: 1,
        name: "Masaje Descontracturante",
        description: "Alivia tensiones musculares",
        duration: 40,
        price: 9000,
      },
      { id: 2, name: "Masaje de Cuello", description: "Enfocado en la zona cervical", duration: 30, price: 7000 },
      { id: 3, name: "Masaje de Piernas", description: "Mejora la circulación", duration: 35, price: 8000 },
    ],
    availabilities: [
      {
        id: 1,
        treatmentId: 1,
        startDate: "2023-04-01",
        endDate: "2023-04-30",
        startTime: "09:00",
        endTime: "18:00",
        box: "Box 1",
      },
    ],
  },
  {
    id: 2,
    name: "Faciales",
    description: "Tratamientos para el cuidado de la piel del rostro",
    duration: 45,
    price: 0,
    subtreatments: [
      { id: 4, name: "Limpieza Facial", description: "Limpieza profunda de cutis", duration: 45, price: 6000 },
      {
        id: 5,
        name: "Hidratación Profunda",
        description: "Hidratación intensiva para pieles secas",
        duration: 50,
        price: 7500,
      },
    ],
    availabilities: [
      {
        id: 2,
        treatmentId: 2,
        startDate: "2023-04-01",
        endDate: "2023-04-30",
        startTime: "10:00",
        endTime: "17:00",
        box: "Box 2",
      },
    ],
  },
]

let appointments: Appointment[] = [
  {
    id: 1,
    date: "2023-04-02",
    time: "10:00",
    clientId: 1,
    professionalId: 1,
    treatmentId: 1,
    subtreatmentId: 1,
    box: "Box 1",
    status: "confirmed",
    deposit: 3000,
    price: 9000,
    notes: "Cliente regular",
  },
  {
    id: 2,
    date: "2023-04-02",
    time: "11:00",
    clientId: 2,
    professionalId: 1,
    treatmentId: 1,
    subtreatmentId: 2,
    box: "Box 2",
    status: "pending",
    deposit: 2000,
    price: 7000,
    notes: "Primera visita",
  },
  {
    id: 3,
    date: "2023-04-02",
    time: "14:30",
    clientId: 3,
    professionalId: 2,
    treatmentId: 1,
    subtreatmentId: 3,
    box: "Box 3",
    status: "completed",
    deposit: 3000,
    price: 8000,
    notes: "Tiene dolor crónico",
  },
]

let clients: Client[] = [
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

let products: Product[] = [
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

let paymentMethods: PaymentMethod[] = [
  { id: 1, name: "Efectivo", description: "Pago en efectivo" },
  { id: 2, name: "Transferencia", description: "Transferencia bancaria" },
  { id: 3, name: "Tarjeta de Crédito", description: "Pago con tarjeta de crédito" },
  { id: 4, name: "Tarjeta de Débito", description: "Pago con tarjeta de débito" },
]

let sales: Sale[] = [
  {
    id: 1,
    date: "2023-03-15",
    clientId: 1,
    appointmentId: 1,
    items: [
      { id: 1, type: "treatment", itemId: 1, quantity: 1, price: 9000, name: "Masaje Descontracturante" },
      { id: 2, type: "product", itemId: 1, quantity: 1, price: 2500, name: "Aceite de Masaje Relajante" },
    ],
    total: 11500,
    payments: [{ id: 1, saleId: 1, method: "Efectivo", amount: 11500 }],
    completed: true,
  },
  {
    id: 2,
    date: "2023-03-20",
    clientId: 3,
    appointmentId: 3,
    items: [{ id: 3, type: "treatment", itemId: 3, quantity: 1, price: 8000, name: "Masaje de Piernas" }],
    total: 8000,
    payments: [{ id: 2, saleId: 2, method: "Tarjeta de Crédito", amount: 8000 }],
    completed: true,
  },
]

// Database service functions
export const db = {
  // Professionals
  getProfessionals: () => professionals,
  getProfessionalById: (id: number) => professionals.find((p) => p.id === id),
  createProfessional: (professional: Omit<Professional, "id">) => {
    const newProfessional = { ...professional, id: Date.now() }
    professionals.push(newProfessional)
    return newProfessional
  },
  updateProfessional: (id: number, data: Partial<Professional>) => {
    professionals = professionals.map((p) => (p.id === id ? { ...p, ...data } : p))
    return professionals.find((p) => p.id === id)
  },
  deleteProfessional: (id: number) => {
    professionals = professionals.filter((p) => p.id !== id)
    return true
  },

  // Treatments
  getTreatments: () => treatments,
  getTreatmentById: (id: number) => treatments.find((t) => t.id === id),
  createTreatment: (treatment: Omit<Treatment, "id">) => {
    const newTreatment = { ...treatment, id: Date.now() }
    treatments.push(newTreatment)
    return newTreatment
  },
  updateTreatment: (id: number, data: Partial<Treatment>) => {
    treatments = treatments.map((t) => (t.id === id ? { ...t, ...data } : t))
    return treatments.find((t) => t.id === id)
  },
  deleteTreatment: (id: number) => {
    treatments = treatments.filter((t) => t.id !== id)
    return true
  },

  // Treatment Availabilities
  getTreatmentAvailabilities: () => treatmentAvailabilities,
  getTreatmentAvailabilitiesByTreatment: (treatmentId: number) =>
    treatmentAvailabilities.filter((a) => a.treatmentId === treatmentId),
  createTreatmentAvailability: (availability: Omit<TreatmentAvailability, "id">) => {
    const newAvailability = { ...availability, id: Date.now() }
    treatmentAvailabilities.push(newAvailability)

    // Also update the treatment's availabilities
    const treatment = treatments.find((t) => t.id === availability.treatmentId)
    if (treatment) {
      treatment.availabilities = [...treatment.availabilities, newAvailability]
    }

    return newAvailability
  },
  updateTreatmentAvailability: (id: number, data: Partial<TreatmentAvailability>) => {
    treatmentAvailabilities = treatmentAvailabilities.map((a) => (a.id === id ? { ...a, ...data } : a))

    // Also update the treatment's availabilities
    const updatedAvailability = treatmentAvailabilities.find((a) => a.id === id)
    if (updatedAvailability) {
      const treatment = treatments.find((t) => t.id === updatedAvailability.treatmentId)
      if (treatment) {
        treatment.availabilities = treatment.availabilities.map((a) => (a.id === id ? { ...a, ...data } : a))
      }
    }

    return treatmentAvailabilities.find((a) => a.id === id)
  },
  deleteTreatmentAvailability: (id: number) => {
    const availability = treatmentAvailabilities.find((a) => a.id === id)
    if (availability) {
      const treatment = treatments.find((t) => t.id === availability.treatmentId)
      if (treatment) {
        treatment.availabilities = treatment.availabilities.filter((a) => a.id !== id)
      }
    }

    treatmentAvailabilities = treatmentAvailabilities.filter((a) => a.id !== id)
    return true
  },

  // Appointments
  getAppointments: () => appointments,
  getAppointmentById: (id: number) => appointments.find((a) => a.id === id),
  getAppointmentsByDate: (date: string) => appointments.filter((a) => a.date === date),
  createAppointment: (appointment: Omit<Appointment, "id">) => {
    const newAppointment = { ...appointment, id: Date.now() }
    appointments.push(newAppointment)
    return newAppointment
  },
  updateAppointment: (id: number, data: Partial<Appointment>) => {
    appointments = appointments.map((a) => (a.id === id ? { ...a, ...data } : a))
    return appointments.find((a) => a.id === id)
  },
  deleteAppointment: (id: number) => {
    appointments = appointments.filter((a) => a.id !== id)
    return true
  },

  // Clients
  getClients: () => clients,
  getClientById: (id: number) => clients.find((c) => c.id === id),
  createClient: (client: Omit<Client, "id">) => {
    const newClient = { ...client, id: Date.now() }
    clients.push(newClient)
    return newClient
  },
  updateClient: (id: number, data: Partial<Client>) => {
    clients = clients.map((c) => (c.id === id ? { ...c, ...data } : c))
    return clients.find((c) => c.id === id)
  },
  deleteClient: (id: number) => {
    clients = clients.filter((c) => c.id !== id)
    return true
  },

  // Products
  getProducts: () => products,
  getProductById: (id: number) => products.find((p) => p.id === id),
  createProduct: (product: Omit<Product, "id">) => {
    const newProduct = { ...product, id: Date.now() }
    products.push(newProduct)
    return newProduct
  },
  updateProduct: (id: number, data: Partial<Product>) => {
    products = products.map((p) => (p.id === id ? { ...p, ...data } : p))
    return products.find((p) => p.id === id)
  },
  deleteProduct: (id: number) => {
    products = products.filter((p) => p.id !== id)
    return true
  },

  // Payment Methods
  getPaymentMethods: () => paymentMethods,
  getPaymentMethodById: (id: number) => paymentMethods.find((p) => p.id === id),
  createPaymentMethod: (method: Omit<PaymentMethod, "id">) => {
    const newMethod = { ...method, id: Date.now() }
    paymentMethods.push(newMethod)
    return newMethod
  },
  updatePaymentMethod: (id: number, data: Partial<PaymentMethod>) => {
    paymentMethods = paymentMethods.map((p) => (p.id === id ? { ...p, ...data } : p))
    return paymentMethods.find((p) => p.id === id)
  },
  deletePaymentMethod: (id: number) => {
    paymentMethods = paymentMethods.filter((p) => p.id !== id)
    return true
  },

  // Sales
  getSales: () => sales,
  getSaleById: (id: number) => sales.find((s) => s.id === id),
  createSale: (sale: Omit<Sale, "id">) => {
    const newSale = { ...sale, id: Date.now() }
    sales.push(newSale)
    return newSale
  },
  updateSale: (id: number, data: Partial<Sale>) => {
    sales = sales.map((s) => (s.id === id ? { ...s, ...data } : s))
    return sales.find((s) => s.id === id)
  },
  deleteSale: (id: number) => {
    sales = sales.filter((s) => s.id !== id)
    return true
  },

  // Helper functions
  getSubtreatmentById: (treatmentId: number, subtreatmentId: number) => {
    const treatment = treatments.find((t) => t.id === treatmentId)
    if (!treatment) return null
    return treatment.subtreatments.find((s) => s.id === subtreatmentId)
  },

  isTreatmentAvailable: (treatmentId: number, date: string, time: string, box: string) => {
    const treatment = treatments.find((t) => t.id === treatmentId)
    if (!treatment) return false

    // Check if there's an availability that matches the criteria
    return treatment.availabilities.some((a) => {
      // Check date range
      const availStartDate = new Date(a.startDate)
      const availEndDate = new Date(a.endDate)
      const checkDate = new Date(date)

      if (checkDate < availStartDate || checkDate > availEndDate) return false

      // Check time range
      if (time < a.startTime || time > a.endTime) return false

      // Check box
      if (a.box !== box) return false

      return true
    })
  },

  getAvailableTreatmentsForDate: (date: string) => {
    return treatments.filter((treatment) => {
      return treatment.availabilities.some((a) => {
        const availStartDate = new Date(a.startDate)
        const availEndDate = new Date(a.endDate)
        const checkDate = new Date(date)

        return checkDate >= availStartDate && checkDate <= availEndDate
      })
    })
  },
}

