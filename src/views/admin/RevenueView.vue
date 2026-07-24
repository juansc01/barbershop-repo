<template>
  <div class="revenue-view">
    <div class="page-header">
      <h1 class="page-title">💰 Ingresos</h1>
      <p class="page-subtitle">Ingresos mensuales por peluquero</p>
    </div>

    <!-- Month selector -->
    <div class="filters-bar card">
      <div class="month-nav">
        <button class="btn btn-ghost btn-sm" @click="prevMonth">← Anterior</button>
        <span class="current-month">{{ monthLabel }}</span>
        <button class="btn btn-ghost btn-sm" @click="nextMonth">Siguiente →</button>
      </div>
    </div>

    <!-- Summary cards -->
    <div class="summary-cards" v-if="!loading">
      <div class="summary-card card">
        <div class="summary-label">Total del mes</div>
        <div class="summary-value">{{ totalRevenue }}€</div>
      </div>
      <div class="summary-card card">
        <div class="summary-label">Citas completadas</div>
        <div class="summary-value">{{ totalAppointments }}</div>
      </div>
      <div class="summary-card card">
        <div class="summary-label">Media por cita</div>
        <div class="summary-value">{{ averagePerAppointment }}€</div>
      </div>
    </div>

    <!-- Per barber breakdown -->
    <div v-if="loading" class="loading-state">
      <div class="skeleton" style="height: 120px;" v-for="i in 2" :key="i"></div>
    </div>

    <div v-else class="barber-revenue-list">
      <div v-for="barber in barberStats" :key="barber.id" class="barber-revenue-card card">
        <div class="barber-rev-header">
          <div class="barber-rev-info">
            <div class="barber-rev-avatar" :style="{ background: barber.color }">
              {{ barber.name.charAt(0) }}
            </div>
            <div>
              <h3 class="barber-rev-name">{{ barber.name }}</h3>
              <span class="barber-rev-count">{{ barber.count }} citas</span>
            </div>
          </div>
          <div class="barber-rev-total">{{ barber.revenue }}€</div>
        </div>

        <!-- Progress bar relative to max -->
        <div class="revenue-bar">
          <div class="revenue-bar-fill" :style="{ width: barber.percentage + '%', background: barber.color }"></div>
        </div>

        <!-- Service breakdown -->
        <div class="service-breakdown" v-if="barber.services.length > 0">
          <div v-for="svc in barber.services" :key="svc.name" class="svc-row">
            <span class="svc-name">{{ svc.name }}</span>
            <span class="svc-count">×{{ svc.count }}</span>
            <span class="svc-total">{{ svc.total }}€</span>
          </div>
        </div>
      </div>

      <div v-if="barberStats.length === 0" class="empty-state card">
        <p>No hay ingresos registrados para este mes.</p>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../../lib/supabase'

export default {
  name: 'RevenueView',
  data() {
    return {
      loading: false,
      selectedMonth: new Date(),
      appointments: [],
      barbers: []
    }
  },
  computed: {
    monthLabel() {
      return this.selectedMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    },
    monthStart() {
      const d = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth(), 1)
      d.setHours(0, 0, 0, 0)
      return d.toISOString()
    },
    monthEnd() {
      const d = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1, 0)
      d.setHours(23, 59, 59, 999)
      return d.toISOString()
    },
    completedAppointments() {
      return this.appointments.filter(a => a.status !== 'cancelled')
    },
    totalRevenue() {
      return this.completedAppointments.reduce((sum, a) => sum + (a.price || a.services?.price || 0), 0).toFixed(0)
    },
    totalAppointments() {
      return this.completedAppointments.length
    },
    averagePerAppointment() {
      if (this.totalAppointments === 0) return '0'
      return (this.totalRevenue / this.totalAppointments).toFixed(1)
    },
    maxRevenue() {
      if (this.barberStats.length === 0) return 1
      return Math.max(...this.barberStats.map(b => b.revenue)) || 1
    },
    barberStats() {
      const stats = {}

      this.barbers.forEach(b => {
        stats[b.id] = {
          id: b.id,
          name: b.name,
          color: b.color || '#7c5cbf',
          revenue: 0,
          count: 0,
          percentage: 0,
          servicesMap: {}
        }
      })

      this.completedAppointments.forEach(apt => {
        const barberId = apt.barber_id
        if (!stats[barberId]) return
        const price = apt.price || apt.services?.price || 0
        stats[barberId].revenue += price
        stats[barberId].count++

        const svcName = apt.services?.name || 'Sin servicio'
        if (!stats[barberId].servicesMap[svcName]) {
          stats[barberId].servicesMap[svcName] = { name: svcName, count: 0, total: 0 }
        }
        stats[barberId].servicesMap[svcName].count++
        stats[barberId].servicesMap[svcName].total += price
      })

      const result = Object.values(stats)
        .filter(b => b.count > 0)
        .sort((a, b) => b.revenue - a.revenue)

      const max = result.length > 0 ? result[0].revenue : 1
      result.forEach(b => {
        b.percentage = (b.revenue / max) * 100
        b.services = Object.values(b.servicesMap).sort((a, b) => b.total - a.total)
        b.revenue = b.revenue.toFixed(0)
        b.services.forEach(s => { s.total = s.total.toFixed(0) })
      })

      return result
    }
  },
  methods: {
    prevMonth() {
      const d = new Date(this.selectedMonth)
      d.setMonth(d.getMonth() - 1)
      this.selectedMonth = d
      this.loadData()
    },
    nextMonth() {
      const d = new Date(this.selectedMonth)
      d.setMonth(d.getMonth() + 1)
      this.selectedMonth = d
      this.loadData()
    },
    async loadData() {
      this.loading = true
      try {
        const [barbersRes, aptsRes] = await Promise.all([
          supabase.from('barbers').select('id, name, color').order('sort_order'),
          supabase
            .from('appointments')
            .select('*, services(name, price)')
            .gte('start_time', this.monthStart)
            .lte('start_time', this.monthEnd)
            .neq('status', 'cancelled')
        ])

        this.barbers = barbersRes.data || []
        this.appointments = aptsRes.data || []
      } catch (e) {
        console.error('Error loading revenue data:', e)
      }
      this.loading = false
    }
  },
  mounted() {
    this.loadData()
  }
}
</script>

<style scoped>
.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 14px;
}

.filters-bar {
  padding: 16px;
  margin-bottom: 20px;
}

.month-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.current-month {
  font-weight: 600;
  font-size: 16px;
  text-transform: capitalize;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.summary-card {
  padding: 16px;
  text-align: center;
}

.summary-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--accent);
}

.barber-revenue-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.barber-revenue-card {
  padding: 20px;
}

.barber-rev-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.barber-rev-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.barber-rev-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  color: white;
}

.barber-rev-name {
  font-size: 16px;
  font-weight: 600;
}

.barber-rev-count {
  font-size: 13px;
  color: var(--text-secondary);
}

.barber-rev-total {
  font-size: 24px;
  font-weight: 700;
  color: var(--accent);
}

.revenue-bar {
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 12px;
}

.revenue-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.service-breakdown {
  border-top: 1px solid var(--border-color);
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.svc-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.svc-name {
  flex: 1;
  color: var(--text-secondary);
}

.svc-count {
  color: var(--text-tertiary);
  min-width: 30px;
}

.svc-total {
  font-weight: 600;
  min-width: 50px;
  text-align: right;
}

.loading-state {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }

  .barber-rev-header {
    flex-wrap: wrap;
    gap: 8px;
  }

  .barber-rev-total {
    font-size: 20px;
  }

  .month-nav button {
    font-size: 12px;
    padding: 6px 8px;
  }
}
</style>

