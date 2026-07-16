/**
 * Google Calendar integration
 * Generates Google Calendar event URLs and opens them automatically
 */
export const calendarService = {
  /**
   * Generate a Google Calendar event URL
   */
  generateGoogleCalendarUrl(appointment) {
    const { customerName, serviceName, barberName, startTime, endTime, phone } = appointment

    const title = encodeURIComponent(`${serviceName} - ${customerName}`)
    const details = encodeURIComponent(
      `Cliente: ${customerName}\nTeléfono: ${phone || 'N/A'}\nServicio: ${serviceName}\nPeluquero: ${barberName}`
    )
    const location = encodeURIComponent("Tito's Barber Shop")

    // Format dates for Google Calendar (YYYYMMDDTHHmmssZ)
    const formatGCal = (date) => {
      const d = new Date(date)
      return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    }

    const start = formatGCal(startTime)
    const end = formatGCal(endTime)

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`
  },

  /**
   * Open Google Calendar event in a new tab
   */
  addToGoogleCalendar(appointment) {
    const url = this.generateGoogleCalendarUrl(appointment)
    window.open(url, '_blank')
  },

  /**
   * Generate ICS file content for download
   */
  generateICS(appointment) {
    const { customerName, serviceName, barberName, startTime, endTime, phone } = appointment

    const formatICS = (date) => {
      const d = new Date(date)
      return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    }

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Titos Barber Shop//ES',
      'BEGIN:VEVENT',
      `DTSTART:${formatICS(startTime)}`,
      `DTEND:${formatICS(endTime)}`,
      `SUMMARY:${serviceName} - ${customerName}`,
      `DESCRIPTION:Cliente: ${customerName}\\nTeléfono: ${phone || 'N/A'}\\nServicio: ${serviceName}\\nPeluquero: ${barberName}`,
      `LOCATION:Tito's Barber Shop`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n')

    return ics
  },

  /**
   * Download ICS file
   */
  downloadICS(appointment) {
    const ics = this.generateICS(appointment)
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cita-${appointment.customerName.replace(/\s/g, '-')}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }
}

