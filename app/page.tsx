import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Clock, Scissors, Users } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fa] to-[#e9ecef]">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#3d405b]">RESET-pro2</h1>
          <div className="flex gap-4">
            <Link href="/treatments">
              <Button variant="ghost">Tratamientos</Button>
            </Link>
            <Link href="/booking">
              <Button variant="ghost">Reservar</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline">Iniciar Sesión</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <section className="mb-16 text-center">
          <h2 className="text-4xl font-bold text-[#3d405b] mb-4">Bienvenido a RESET-pro2</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tu salón de belleza de confianza. Reserva tus tratamientos favoritos con nuestros profesionales expertos.
          </p>
          <div className="mt-8">
            <Link href="/booking">
              <Button className="bg-[#e07a5f] hover:bg-[#c85a3f] text-white">Reservar Ahora</Button>
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader className="pb-2">
              <Scissors className="h-8 w-8 text-[#e07a5f] mb-2" />
              <CardTitle>Tratamientos Profesionales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Ofrecemos una amplia gama de tratamientos personalizados para satisfacer tus necesidades.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <Users className="h-8 w-8 text-[#e07a5f] mb-2" />
              <CardTitle>Profesionales Expertos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Nuestro equipo de profesionales altamente calificados está listo para atenderte.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CalendarDays className="h-8 w-8 text-[#e07a5f] mb-2" />
              <CardTitle>Reserva Online</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Reserva tu cita en cualquier momento y desde cualquier lugar con nuestro sistema online.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <Clock className="h-8 w-8 text-[#e07a5f] mb-2" />
              <CardTitle>Horarios Flexibles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Adaptamos nuestros horarios a tus necesidades para brindarte la mejor experiencia.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#3d405b] mb-6 text-center">Nuestros Tratamientos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Masajes</CardTitle>
                <CardDescription>Relájate y rejuvenece</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Disfruta de nuestros masajes terapéuticos y relajantes realizados por profesionales expertos.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/treatments/masajes">
                  <Button variant="outline" className="w-full">
                    Ver Opciones
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tratamientos Faciales</CardTitle>
                <CardDescription>Cuida tu piel</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Tratamientos personalizados para todo tipo de piel que te harán lucir radiante.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/treatments/faciales">
                  <Button variant="outline" className="w-full">
                    Ver Opciones
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Manicura y Pedicura</CardTitle>
                <CardDescription>Manos y pies perfectos</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Servicios completos de manicura y pedicura con los mejores productos del mercado.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/treatments/manicura">
                  <Button variant="outline" className="w-full">
                    Ver Opciones
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </section>
      </main>

      <footer className="bg-[#3d405b] text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">RESET-pro2</h3>
              <p>Tu salón de belleza de confianza con los mejores profesionales y tratamientos.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Contacto</h3>
              <p>Dirección: Av. Principal 123</p>
              <p>Teléfono: (123) 456-7890</p>
              <p>Email: info@reset-pro2.com</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Horarios</h3>
              <p>Lunes a Viernes: 9:00 - 18:00</p>
              <p>Sábados: 9:00 - 14:00</p>
              <p>Domingos: Cerrado</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center">
            <p>&copy; {new Date().getFullYear()} RESET-pro2. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

