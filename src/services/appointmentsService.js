import { supabase } from '../lib/supabase'

export const appointmentsService = {
  async getAll(filters = {}) {
    let query = supabase
      .from('appointments')
      .select('*, barbers(name, color), services(name, duration, price), customers(name, phone, email)')
      .order('start_time', { ascending: true })

    if (filters.date) {
      const start = new Date(filters.date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(filters.date)
      end.setHours(23, 59, 59, 999)
      query = query.gte('start_time', start.toISOString()).lte('start_time', end.toISOString())
    }

    if (filters.barberId) {
      query = query.eq('barber_id', filters.barberId)
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.from && filters.to) {
      query = query.gte('start_time', filters.from).lte('start_time', filters.to)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async getToday() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data, error } = await supabase
      .from('appointments')
      .select('*, barbers(name, color), services(name, duration, price), customers(name, phone)')
      .gte('start_time', today.toISOString())
      .lt('start_time', tomorrow.toISOString())
      .neq('status', 'cancelled')
      .order('start_time')
    if (error) throw error
    return data
  },

  async getUpcoming(limit = 10) {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('appointments')
      .select('*, barbers(name, color), services(name, duration, price), customers(name, phone)')
      .gte('start_time', now)
      .neq('status', 'cancelled')
      .order('start_time')
      .limit(limit)
    if (error) throw error
    return data
  },

  async checkSlotAvailable(barberId, startTime, endTime) {
    const { data, error } = await supabase
      .from('appointments')
      .select('id')
      .eq('barber_id', barberId)
      .neq('status', 'cancelled')
      .lt('start_time', endTime)
      .gt('end_time', startTime)
      .limit(1)

    if (error) throw error
    return !data || data.length === 0
  },

  async create(appointment) {
    // Double-check availability before inserting (concurrency guard)
    const isAvailable = await this.checkSlotAvailable(
      appointment.barber_id,
      appointment.start_time,
      appointment.end_time
    )
    if (!isAvailable) {
      throw new Error('SLOT_TAKEN')
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert(appointment)
      .select()
      .single()
    if (error) {
      // Database trigger also prevents overlaps
      if (error.message && error.message.includes('SLOT_TAKEN')) {
        throw new Error('SLOT_TAKEN')
      }
      throw error
    }
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async cancel(id) {
    return this.update(id, { status: 'cancelled' })
  },

  async getForBarberOnDate(barberId, date) {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('barber_id', barberId)
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .neq('status', 'cancelled')
      .order('start_time')
    if (error) throw error
    return data
  },

  async getWeeklyStats() {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + 1)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('appointments')
      .select('*, services(price)')
      .gte('start_time', weekStart.toISOString())
      .lte('start_time', weekEnd.toISOString())
      .neq('status', 'cancelled')
    if (error) throw error
    return data
  }
}

