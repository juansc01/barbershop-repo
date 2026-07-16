import { supabase } from '../lib/supabase'

export const barbersService = {
  async getAll() {
    const { data, error } = await supabase
      .from('barbers')
      .select('*, barber_services(service_id)')
      .order('sort_order')
    if (error) throw error
    return data
  },

  async getActive() {
    const { data, error } = await supabase
      .from('barbers')
      .select('*, barber_services(service_id)')
      .eq('active', true)
      .order('sort_order')
    if (error) throw error
    return data
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('barbers')
      .select('*, barber_services(service_id), working_hours(*)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async create(barber) {
    const { data, error } = await supabase
      .from('barbers')
      .insert(barber)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('barbers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase
      .from('barbers')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async assignServices(barberId, serviceIds) {
    await supabase
      .from('barber_services')
      .delete()
      .eq('barber_id', barberId)

    if (serviceIds.length > 0) {
      const rows = serviceIds.map(sid => ({ barber_id: barberId, service_id: sid }))
      const { error } = await supabase
        .from('barber_services')
        .insert(rows)
      if (error) throw error
    }
  }
}

