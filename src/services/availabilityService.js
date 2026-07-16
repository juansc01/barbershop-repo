import { supabase } from '../lib/supabase'

export const availabilityService = {
  /**
   * Get available time slots for a barber on a specific date
   */
  async getAvailableSlots(barberId, date, serviceDuration) {
    const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date
    const jsDate = new Date(dateStr + 'T12:00:00')

    // Get day of week (0=Monday, 6=Sunday)
    let dayOfWeek = jsDate.getDay() - 1
    if (dayOfWeek < 0) dayOfWeek = 6

    // Get working hours for this day
    const { data: workingHours } = await supabase
      .from('working_hours')
      .select('*')
      .eq('barber_id', barberId)
      .eq('day_of_week', dayOfWeek)
      .single()

    if (!workingHours || !workingHours.is_working) return []

    // Check vacations
    const { data: vacations } = await supabase
      .from('vacations')
      .select('id')
      .eq('barber_id', barberId)
      .lte('start_date', dateStr)
      .gte('end_date', dateStr)
      .limit(1)

    if (vacations && vacations.length > 0) return []

    // Get existing appointments
    const dayStart = new Date(dateStr + 'T00:00:00')
    const dayEnd = new Date(dateStr + 'T23:59:59')

    const { data: appointments } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('barber_id', barberId)
      .gte('start_time', dayStart.toISOString())
      .lte('start_time', dayEnd.toISOString())
      .neq('status', 'cancelled')

    // Get blocked times
    const { data: blocks } = await supabase
      .from('blocked_times')
      .select('start_datetime, end_datetime')
      .eq('barber_id', barberId)
      .gte('end_datetime', dayStart.toISOString())
      .lte('start_datetime', dayEnd.toISOString())

    // Generate available slots
    const slots = []
    const [startH, startM] = workingHours.start_time.split(':').map(Number)
    const [endH, endM] = workingHours.end_time.split(':').map(Number)

    const workStart = startH * 60 + startM
    const workEnd = endH * 60 + endM
    const standardInterval = 45 // Standard session slot

    // Helper to check if a slot conflicts
    const hasConflictAt = (start, end) => {
      const hasAptConflict = (appointments || []).some(apt => {
        const aptStart = new Date(apt.start_time)
        const aptEnd = new Date(apt.end_time)
        return start < aptEnd && end > aptStart
      })
      const hasBlockConflict = (blocks || []).some(block => {
        const blockStart = new Date(block.start_datetime)
        const blockEnd = new Date(block.end_datetime)
        return start < blockEnd && end > blockStart
      })
      return hasAptConflict || hasBlockConflict
    }

    const now = new Date()

    // 1. Generate standard 45-min slots
    for (let minutes = workStart; minutes + serviceDuration <= workEnd; minutes += standardInterval) {
      const slotStart = new Date(dateStr + 'T00:00:00')
      slotStart.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)

      const slotEnd = new Date(slotStart)
      slotEnd.setMinutes(slotEnd.getMinutes() + serviceDuration)

      if (slotStart <= now) continue
      if (hasConflictAt(slotStart, slotEnd)) continue

      slots.push({
        time: `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`,
        datetime: slotStart.toISOString()
      })
    }

    // 2. If service is short (< 45 min, e.g. Barba = 20 min), find gap slots
    //    after existing short appointments within the same 45-min block
    if (serviceDuration < standardInterval) {
      for (const apt of (appointments || [])) {
        const aptStart = new Date(apt.start_time)
        const aptEnd = new Date(apt.end_time)
        const aptDuration = (aptEnd - aptStart) / 60000

        // Only create gap slot if the existing appointment is also short (< 45 min)
        if (aptDuration < standardInterval) {
          // The gap slot starts when the short appointment ends
          const gapStart = new Date(aptEnd)
          const gapEnd = new Date(gapStart)
          gapEnd.setMinutes(gapEnd.getMinutes() + serviceDuration)

          // Check this gap fits within the working hours
          const gapMinutes = gapStart.getHours() * 60 + gapStart.getMinutes()
          if (gapMinutes + serviceDuration > workEnd) continue

          // Check it doesn't go past the next standard slot's appointment
          if (gapStart <= now) continue
          if (hasConflictAt(gapStart, gapEnd)) continue

          // Check it's not already in our slots list
          const gapTimeStr = `${String(gapStart.getHours()).padStart(2, '0')}:${String(gapStart.getMinutes()).padStart(2, '0')}`
          if (slots.some(s => s.time === gapTimeStr)) continue

          slots.push({
            time: gapTimeStr,
            datetime: gapStart.toISOString()
          })
        }
      }
    }

    // Sort slots by time
    slots.sort((a, b) => a.time.localeCompare(b.time))

    return slots
  },

  /**
   * Get available dates for the next N days
   */
  async getAvailableDates(barberId, days = 30) {
    const dates = []
    const now = new Date()
    // Use local date string to avoid UTC timezone shift
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    // Get all working hours for this barber
    const { data: workingHours } = await supabase
      .from('working_hours')
      .select('*')
      .eq('barber_id', barberId)

    // Get all vacations
    const { data: vacations } = await supabase
      .from('vacations')
      .select('start_date, end_date')
      .eq('barber_id', barberId)
      .gte('end_date', todayStr)

    for (let i = 0; i < days; i++) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

      // Skip past dates (safety check)
      if (dateStr < todayStr) continue

      let dayOfWeek = date.getDay() - 1
      if (dayOfWeek < 0) dayOfWeek = 6

      const dayHours = (workingHours || []).find(h => h.day_of_week === dayOfWeek)
      if (!dayHours || !dayHours.is_working) continue

      // Check vacations
      const onVacation = (vacations || []).some(v => dateStr >= v.start_date && dateStr <= v.end_date)

      dates.push({ date: dateStr, onVacation })
    }

    return dates
  }
}

