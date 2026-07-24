/**
 * Email notification service using EmailJS
 *
 * Setup instructions:
 * 1. Go to https://www.emailjs.com/ and create a free account
 * 2. Add your Gmail as an Email Service (service ID goes in VITE_EMAILJS_SERVICE_ID)
 * 3. Create an email template with variables: {{type}}, {{customer_name}}, {{customer_phone}}, {{service}}, {{barber}}, {{date}}, {{time}}, {{price}}
 * 4. Put the template ID in VITE_EMAILJS_TEMPLATE_ID
 * 5. Your public key goes in VITE_EMAILJS_PUBLIC_KEY
 */

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || ''
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || ''
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || ''
const ADMIN_EMAIL = 'nacho.titobarber@gmail.com'

export const emailService = {
  async sendNotification({ type, customerName, customerPhone, service, barber, date, time, price }) {
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      console.warn('EmailJS not configured. Skipping email notification.')
      return
    }

    const templateParams = {
      to_email: ADMIN_EMAIL,
      type: type === 'new' ? '🟢 NUEVA CITA' : '🔴 CITA CANCELADA',
      customer_name: customerName,
      customer_phone: customerPhone,
      service: service,
      barber: barber,
      date: date,
      time: time,
      price: price ? `${price}€` : '-'
    }

    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: templateParams
        })
      })

      if (!response.ok) {
        console.error('Email send failed:', response.statusText)
      }
    } catch (error) {
      // Don't block the user flow if email fails
      console.error('Email notification error:', error)
    }
  },

  async notifyNewAppointment({ customerName, customerPhone, service, barber, date, time, price }) {
    return this.sendNotification({
      type: 'new',
      customerName,
      customerPhone,
      service,
      barber,
      date,
      time,
      price
    })
  },

  async notifyCancelledAppointment({ customerName, customerPhone, service, barber, date, time, price }) {
    return this.sendNotification({
      type: 'cancel',
      customerName,
      customerPhone,
      service,
      barber,
      date,
      time,
      price
    })
  }
}

