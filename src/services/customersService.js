import { supabase } from '../lib/supabase'

export const customersService = {
  async getAll() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async search(query) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
      .order('name')
    if (error) throw error
    return data
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async findOrCreate(customer) {
    // Try to find by phone
    const { data: existing } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', customer.phone)
      .single()

    if (existing) {
      // Update name/email if provided
      const { data, error } = await supabase
        .from('customers')
        .update({
          name: customer.name,
          email: customer.email || existing.email,
          notes: customer.notes || existing.notes,
          total_visits: (existing.total_visits || 0) + 1
        })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      return data
    }

    const { data, error } = await supabase
      .from('customers')
      .insert({ ...customer, total_visits: 1 })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async getHistory(customerId) {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, services(name), barbers(name)')
      .eq('customer_id', customerId)
      .order('start_time', { ascending: false })
    if (error) throw error
    return data
  }
}

