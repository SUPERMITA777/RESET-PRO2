import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TreatmentsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fa] to-[#e9ecef]">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold text-[#3d405b]">RESET-pro2</h1>
          </Link>
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
        <h1 className="text-3xl font-bold text-center mb-8">Nuestros Tratamientos</h1>

        <Tabs defaultValue="masajes" className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="masajes">Masajes</TabsTrigger>
            <TabsTrigger value="faciales">Faciales</TabsTrigger>
            <TabsTrigger value="manicura">Manicura</TabsTrigger>
            <TabsTrigger value="pedicura">Pedicura</TabsTrigger>
          </TabsList>

          <TabsContent value="masajes" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Masaje Descontracturante</CardTitle>
                  <CardDescription>40 minutos - $9,000</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Este masaje está diseñado para aliviar la tensión muscular y reducir el dolor en áreas específicas.
                    Ideal para personas con tensión acumulada en cuello, hombros o espalda.
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href="/booking" className="w-full">
                    <Button className="w-full">Reservar</Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Masaje de Cuello</CardTitle>
                  <CardDescription>30 minutos - $7,000</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Enfocado específicamente en la zona cervical, este masaje alivia la tensión acumulada por malas
                    posturas, estrés o largas horas frente a la computadora.
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href="/booking" className="w-full">
                    <Button className="w-full">Reservar</Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Masaje de Piernas</CardTitle>
                  <CardDescription>35 minutos - $8,000</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Mejora la circulación y alivia la fatiga en las piernas. Perfecto para personas que pasan mucho
                    tiempo de pie o sufren de retención de líquidos.
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href="/booking" className="w-full">
                    <Button className="w-full">Reservar</Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Masaje Relajante</CardTitle>
                  <CardDescription>50 minutos - $10,000</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Un masaje de cuerpo completo diseñado para reducir el estrés, mejorar la calidad del sueño y
                    proporcionar una sensación general de bienestar.
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href="/booking" className="w-full">
                    <Button className="w-full">Reservar</Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="faciales" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Limpieza Facial</CardTitle>
                  <CardDescription>45 minutos - $6,000</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Limpieza profunda que elimina impurezas, células muertas y exceso de grasa. Deja la piel fresca,
                    limpia y radiante.
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href="/booking" className="w-full">
                    <Button className="w-full">Reservar</Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Hidratación Profunda</CardTitle>
                  <CardDescription>50 minutos - $7,500</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Tratamiento intensivo para pieles secas o deshidratadas. Restaura la humedad natural y mejora la
                    elasticidad de la piel.
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href="/booking" className="w-full">
                    <Button className="w-full">Reservar</Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="manicura" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Manicura Básica</CardTitle>
                  <CardDescription>30 minutos - $4,500</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Incluye limado, pulido, tratamiento de cutículas y esmalte. Deja tus manos perfectamente arregladas.
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href="/booking" className="w-full">
                    <Button className="w-full">Reservar</Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Manicura Semipermanente</CardTitle>
                  <CardDescription>45 minutos - $6,500</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Esmalte de larga duración que se mantiene perfecto hasta por 3 semanas. Resistente a golpes y
                    rayaduras.
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href="/booking" className="w-full">
                    <Button className="w-full">Reservar</Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pedicura" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Pedicura Spa</CardTitle>
                  <CardDescription>50 minutos - $5,500</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Incluye baño de pies, exfoliación, tratamiento de cutículas, limado, masaje y esmalte. Una
                    experiencia relajante para tus pies.
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href="/booking" className="w-full">
                    <Button className="w-full">Reservar</Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pedicura Terapéutica</CardTitle>
                  <CardDescription>60 minutos - $7,000</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Tratamiento especializado para pies con problemas como callosidades, durezas o uñas encarnadas.
                    Incluye masaje terapéutico.
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href="/booking" className="w-full">
                    <Button className="w-full">Reservar</Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-[#3d405b] text-white py-8 mt-12">
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

