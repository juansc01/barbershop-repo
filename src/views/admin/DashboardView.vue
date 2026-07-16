<template>
  <div class="dashboard">
    <h1 class="page-title">Dashboard</h1>
    <p class="page-desc">Resumen de tu barbería</p>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card card">
        <div class="stat-icon" style="background: rgba(99, 102, 241, 0.1); color: var(--accent);">📅</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.todayAppointments }}</span>
          <span class="stat-label">Citas hoy</span>
        </div>
      </div>
      <div class="stat-card card">
        <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--success);">📈</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.weeklyAppointments }}</span>
          <span class="stat-label">Citas esta semana</span>
        </div>
      </div>
      <div class="stat-card card">
        <div class="stat-icon" style="background: rgba(245, 158, 11, 0.1); color: var(--warning);">👥</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.totalCustomers }}</span>
          <span class="stat-label">Clientes registrados</span>
        </div>
      </div>
      <div class="stat-card card">
        <div class="stat-icon" style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6;">💰</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.weeklyRevenue }}€</span>
          <span class="stat-label">Ingresos semana</span>
        </div>
      </div>
    </div>

    <!-- Today's appointments -->
    <div class="section">
      <h2 class="section-title">Citas de hoy</h2>
      <div v-if="loading" class="skeleton-list">
        <div class="skeleton" style="height: 60px" v-for="i in 3" :key="i"></div>
      </div>
      <div v-else-if="todayAppointments.length === 0" class="empty-card card">
        <p>No hay citas programadas para hoy</p>
      </div>
      <div v-else class="appointments-list">
        <div v-for="apt in todayAppointments" :key="apt.id" class="appointment-item card">
          <div class="apt-time">
            {{ formatTime(apt.start_time) }}
          </div>
          <div class="apt-info">
            <span class="apt-customer">{{ apt.customers?.name }}</span>
            <span class="apt-service">{{ apt.services?.name }} · {{ apt.barbers?.name }}</span>
          </div>
          <button class="btn btn-ghost btn-sm gcal-btn" @click="addToCalendar(apt)" title="Añadir a Google Calendar">📅</button>
          <span class="badge" :class="'badge-' + statusClass(apt.status)">
            {{ statusLabel(apt.status) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Upcoming -->
    <div class="section">
      <h2 class="section-title">Próximas citas</h2>
      <div v-if="upcomingAppointments.length === 0" class="empty-card card">
        <p>No hay próximas citas</p>
      </div>
      <div v-else class="appointments-list">
        <div v-for="apt in upcomingAppointments" :key="apt.id" class="appointment-item card">
          <div class="apt-time">
            <span class="apt-date-sm">{{ formatDateShort(apt.start_time) }}</span>
            {{ formatTime(apt.start_time) }}
          </div>
          <div class="apt-info">
            <span class="apt-customer">{{ apt.customers?.name }}</span>
            <span class="apt-service">{{ apt.services?.name }} · {{ apt.barbers?.name }}</span>
          </div>
          <button class="btn btn-ghost btn-sm gcal-btn" @click="addToCalendar(apt)" title="Añadir a Google Calendar">📅</button>
          <span class="apt-phone">{{ apt.customers?.phone }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { appointmentsService } from '../../services/appointmentsService'
import { customersService } from '../../services/customersService'
import { calendarService } from '../../services/calendarService'

export default {
  name: 'DashboardView',
  data() {
    return {
      loading: true,
      todayAppointments: [],
      upcomingAppointments: [],
      stats: {
        todayAppointments: 0,
        weeklyAppointments: 0,
        totalCustomers: 0,
        weeklyRevenue: 0
      }
    }
  },
  async mounted() {
    await this.loadData()
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const [today, upcoming, weekly, customers] = await Promise.all([
          appointmentsService.getToday(),
          appointmentsService.getUpcoming(),
          appointmentsService.getWeeklyStats(),
          customersService.getAll()
        ])

        this.todayAppointments = today
        this.upcomingAppointments = upcoming.filter(a => {
          const aptDate = new Date(a.start_time).toDateString()
          const todayDate = new Date().toDateString()
          return aptDate !== todayDate
        }).slice(0, 5)

        this.stats.todayAppointments = today.length
        this.stats.weeklyAppointments = weekly.length
        this.stats.totalCustomers = customers.length
        // Only count revenue for past appointments (already completed)
        const now = new Date()
        const pastAppointments = weekly.filter(a => new Date(a.end_time || a.start_time) < now)
        this.stats.weeklyRevenue = pastAppointments.reduce((sum, a) => sum + (parseFloat(a.services?.price) || parseFloat(a.price) || 0), 0).toFixed(0)
      } catch (e) {
        console.error(e)
      }
      this.loading = false
    },
    formatTime(dt) {
      return new Date(dt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    },
    formatDateShort(dt) {
      return new Date(dt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    },
    statusClass(status) {
      const map = { confirmed: 'info', completed: 'success', cancelled: 'danger', no_show: 'warning' }
      return map[status] || 'info'
    },
    statusLabel(status) {
      const map = { confirmed: 'Confirmada', completed: 'Completada', cancelled: 'Cancelada', no_show: 'No show' }
      return map[status] || status
    },
    addToCalendar(apt) {
      calendarService.addToGoogleCalendar({
        customerName: apt.customers?.name || 'Cliente',
        serviceName: apt.services?.name || 'Servicio',
        barberName: apt.barbers?.name || 'Barbero',
        startTime: apt.start_time,
        endTime: apt.end_time,
        phone: apt.customers?.phone || ''
      })
    }
  }
}
</script>

<style scoped>
.page-title {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 4px;
}

.page-desc {
  color: var(--text-secondary);
  font-size: 15px;
  margin-bottom: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 40px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 16px;
}

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-card {
  text-align: center;
  padding: 32px;
  color: var(--text-secondary);
  font-size: 14px;
}

.appointments-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.appointment-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
}

.apt-time {
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  min-width: 60px;
}

.apt-date-sm {
  display: block;
  font-size: 11px;
  color: var(--text-tertiary);
  font-weight: 400;
}

.apt-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.apt-customer {
  font-size: 14px;
  font-weight: 500;
}

.apt-service {
  font-size: 12px;
  color: var(--text-secondary);
}

.apt-phone {
  font-size: 13px;
  color: var(--text-tertiary);
}

.gcal-btn {
  font-size: 16px;
  padding: 4px 8px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.gcal-btn:hover {
  opacity: 1;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

