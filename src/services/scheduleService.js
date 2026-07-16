import { supabase } from '../lib/supabase'

export const scheduleService = {
  async getWorkingHours(barberId) {
    const { data, error } = await supabase
      .from('working_hours')
      .select('*')
      .eq('barber_id', barberId)
      .order('day_of_week')
    if (error) throw error
    return data
  },

  async updateWorkingHours(barberId, hours) {
    // Delete existing hours
    await supabase
      .from('working_hours')
      .delete()
      .eq('barber_id', barberId)

    // Insert new hours
    const rows = hours.map(h => ({ ...h, barber_id: barberId }))
    const { error } = await supabase
      .from('working_hours')
      .insert(rows)
    if (error) throw error
  },

  async getVacations(barberId) {
    const { data, error } = await supabase
      .from('vacations')
      .select('*')
      .eq('barber_id', barberId)
      .order('start_date', { ascending: false })
    if (error) throw error
    return data
  },

  async getAllVacations() {
    const { data, error } = await supabase
      .from('vacations')
      .select('*, barbers(name)')
      .order('start_date', { ascending: false })
    if (error) throw error
    return data
  },

  async createVacation(vacation) {
    const { data, error } = await supabase
      .from('vacations')
      .insert(vacation)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteVacation(id) {
    const { error } = await supabase
      .from('vacations')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async getBlockedTimes(barberId) {
    const { data, error } = await supabase
      .from('blocked_times')
      .select('*')
      .eq('barber_id', barberId)
      .order('start_datetime', { ascending: false })
    if (error) throw error
    return data
  },

  async getAllBlockedTimes() {
    const { data, error } = await supabase
      .from('blocked_times')
      .select('*, barbers(name)')
      .order('start_datetime', { ascending: false })
    if (error) throw error
    return data
  },

  async createBlock(block) {
    const { data, error } = await supabase
      .from('blocked_times')
      .insert(block)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteBlock(id) {
    const { error } = await supabase
      .from('blocked_times')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async isBarberAvailable(barberId, date) {
    const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date

    // Check vacations
    const { data: vacations } = await supabase
      .from('vacations')
      .select('id')
      .eq('barber_id', barberId)
      .lte('start_date', dateStr)
      .gte('end_date', dateStr)
      .limit(1)

    if (vacations && vacations.length > 0) return false

    // Check working hours
    const jsDate = new Date(dateStr + 'T12:00:00')
    let dayOfWeek = jsDate.getDay() - 1
    if (dayOfWeek < 0) dayOfWeek = 6

    const { data: hours } = await supabase
      .from('working_hours')
      .select('*')
      .eq('barber_id', barberId)
      .eq('day_of_week', dayOfWeek)
      .single()

    if (!hours || !hours.is_working) return false
    return true
  }
}

