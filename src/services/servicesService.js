import { supabase } from '../lib/supabase'

export const servicesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('sort_order')
    if (error) throw error
    return data
  },

  async getActive() {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('active', true)
      .order('sort_order')
    if (error) throw error
    return data
  },

  async create(service) {
    const { data, error } = await supabase
      .from('services')
      .insert(service)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}

