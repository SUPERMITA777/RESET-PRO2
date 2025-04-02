// This is a mock WhatsApp service for demonstration purposes
// In a real application, you would integrate with the WhatsApp Business API

export interface WhatsAppMessage {
  to: string
  message: string
}

export const whatsappService = {
  sendMessage: async (data: WhatsAppMessage): Promise<{ success: boolean; message: string }> => {
    // In a real implementation, this would send a message via WhatsApp API
    console.log(`Sending WhatsApp message to ${data.to}: ${data.message}`)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Return success response
    return {
      success: true,
      message: `Message sent to ${data.to}`,
    }
  },

  sendAppointmentConfirmation: async (
    phone: string,
    name: string,
    treatment: string,
    date: string,
    time: string,
  ): Promise<{ success: boolean; message: string }> => {
    const message = `Hola ${name}, tu reserva para ${treatment} el día ${date} a las ${time} ha sido recibida. Te contactaremos pronto para confirmar. Gracias por elegir RESET-pro2.`

    return whatsappService.sendMessage({
      to: phone,
      message,
    })
  },

  sendAdminNotification: async (
    clientName: string,
    clientPhone: string,
    treatment: string,
    date: string,
    time: string,
  ): Promise<{ success: boolean; message: string }> => {
    const message = `Nueva reserva recibida:\n- Cliente: ${clientName}\n- Teléfono: ${clientPhone}\n- Tratamiento: ${treatment}\n- Fecha: ${date}\n- Hora: ${time}\n\nPor favor, confirma este turno.`

    // Admin phone number would be configured in environment variables
    const adminPhone = process.env.ADMIN_PHONE || "+123456789"

    return whatsappService.sendMessage({
      to: adminPhone,
      message,
    })
  },
}

