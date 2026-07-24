<template>
  <div class="my-appointments">
    <header class="page-header-bar">
      <div class="container header-inner">
        <router-link to="/" class="back-link">← Volver</router-link>
        <span class="header-title">Mis citas</span>
        <span></span>
      </div>
    </header>

    <main class="container main-content">
      <!-- Search form -->
      <div v-if="!searched" class="search-section fade-in">
        <h1 class="page-title">Consulta tus citas</h1>
        <p class="page-desc">Introduce tu teléfono para ver y gestionar tus citas</p>
        <form @submit.prevent="searchAppointments" class="search-form">
          <input
            class="input"
            v-model="phone"
            placeholder="Tu número de teléfono"
            type="tel"
            maxlength="15"
            required
          />
          <button class="btn btn-primary" type="submit" :disabled="loading || phone.replace(/\s/g,'').length < 9">
            {{ loading ? 'Buscando...' : 'Buscar mis citas' }}
          </button>
        </form>
      </div>

      <!-- Results -->
      <div v-else class="results-section fade-in">
        <div class="results-header">
          <h2 class="page-title">Citas para {{ phone }}</h2>
          <button class="btn btn-ghost btn-sm" @click="reset">Buscar otro teléfono</button>
        </div>

        <div v-if="appointments.length === 0" class="empty-state card">
          <p>No se encontraron citas próximas para este teléfono.</p>
        </div>

        <div v-else class="appointments-list">
          <div v-for="apt in appointments" :key="apt.id" class="appointment-card card">
            <div class="apt-header">
              <span class="apt-date">{{ formatDate(apt.start_time) }}</span>
              <span class="badge" :class="'badge-' + statusClass(apt.status)">
                {{ statusLabel(apt.status) }}
              </span>
            </div>
            <div class="apt-details">
              <div class="apt-row">
                <span class="apt-label">Servicio</span>
                <span class="apt-value">{{ apt.services?.name }}</span>
              </div>
              <div class="apt-row">
                <span class="apt-label">Peluquero</span>
                <span class="apt-value">{{ apt.barbers?.name }}</span>
              </div>
              <div class="apt-row">
                <span class="apt-label">Hora</span>
                <span class="apt-value">{{ formatTime(apt.start_time) }} - {{ formatTime(apt.end_time) }}</span>
              </div>
              <div class="apt-row">
                <span class="apt-label">Precio</span>
                <span class="apt-value">{{ apt.price }}€</span>
              </div>
            </div>
            <div class="apt-actions" v-if="apt.status === 'confirmed'">
              <button
                class="btn btn-danger btn-sm"
                @click="cancelAppointment(apt)"
                :disabled="cancelling === apt.id"
              >
                {{ cancelling === apt.id ? 'Cancelando...' : 'Cancelar cita' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { supabase } from '../lib/supabase'
import { useToast } from '../composables/useToast'

export default {
  name: 'MyAppointmentsPage',
  data() {
    return {
      phone: '',
      searched: false,
      loading: false,
      cancelling: null,
      appointments: []
    }
  },
  methods: {
    async searchAppointments() {
      if (!this.phone.trim()) return
      this.loading = true
      try {
        const now = new Date().toISOString()
        const { data, error } = await supabase
          .from('appointments')
          .select('*, services(name), barbers(name)')
          .eq('customers.phone', this.phone.trim())
          .gte('start_time', now)
          .neq('status', 'cancelled')
          .order('start_time')

        // Query through customers table since we can't filter by join directly
        const { data: customers } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', this.phone.trim())

        if (customers && customers.length > 0) {
          const customerIds = customers.map(c => c.id)
          const { data: apts } = await supabase
            .from('appointments')
            .select('*, services(name), barbers(name), customers(name, phone)')
            .in('customer_id', customerIds)
            .eq('status', 'confirmed')
            .gte('start_time', now)
            .order('start_time')
            .order('start_time')
          this.appointments = apts || []
        } else {
          this.appointments = []
        }

        this.searched = true
      } catch (e) {
        useToast().error('Error al buscar citas')
      }
      this.loading = false
    },
    async cancelAppointment(apt) {
      if (!confirm('¿Estás seguro de que quieres cancelar esta cita?')) return
      this.cancelling = apt.id
      try {
        const { error } = await supabase
          .from('appointments')
          .update({ status: 'cancelled' })
          .eq('id', apt.id)
        if (error) throw error
        apt.status = 'cancelled'
        useToast().success('Cita cancelada correctamente')

        // Send email notification (non-blocking)
        import('../services/emailService.js').then(({ emailService }) => {
          emailService.notifyCancelledAppointment({
            customerName: apt.customers?.name || this.phone,
            customerPhone: this.phone,
            service: apt.services?.name || '-',
            barber: apt.barbers?.name || '-',
            date: new Date(apt.start_time).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
            time: new Date(apt.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            price: apt.price
          })
        }).catch(() => {})
      } catch (e) {
        useToast().error('Error al cancelar la cita')
      }
      this.cancelling = null
    },
    reset() {
      this.searched = false
      this.appointments = []
      this.phone = ''
    },
    formatDate(dt) {
      return new Date(dt).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    },
    formatTime(dt) {
      return new Date(dt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    },
    statusClass(status) {
      const map = { confirmed: 'info', completed: 'success', cancelled: 'danger', no_show: 'warning' }
      return map[status] || 'info'
    },
    statusLabel(status) {
      const map = { confirmed: 'Confirmada', completed: 'Completada', cancelled: 'Cancelada', no_show: 'No show' }
      return map[status] || status
    }
  }
}
</script>

<style scoped>
.my-appointments {
  min-height: 100vh;
}

.page-header-bar {
  position: sticky;
  top: 0;
  background: rgba(10, 10, 11, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color);
  z-index: 50;
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
}

.back-link {
  font-size: 14px;
  color: var(--text-secondary);
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--text-primary);
}

.header-title {
  font-weight: 600;
  font-size: 15px;
}

.main-content {
  max-width: 600px;
  padding-top: 60px;
  padding-bottom: 60px;
  text-align: center;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}

.page-desc {
  color: var(--text-secondary);
  font-size: 15px;
  margin-bottom: 32px;
}

.search-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 350px;
  margin: 0 auto;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 12px;
  flex-wrap: wrap;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.appointments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.appointment-card {
  padding: 20px;
}

.apt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.apt-date {
  font-weight: 600;
  font-size: 15px;
  text-transform: capitalize;
}

.apt-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.apt-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.apt-label {
  color: var(--text-secondary);
}

.apt-value {
  font-weight: 500;
}

.apt-actions {
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}
</style>

