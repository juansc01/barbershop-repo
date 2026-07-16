<template>
  <div class="schedule-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">Horarios</h1>
        <p class="page-desc">Configura el horario de trabajo de cada peluquero</p>
      </div>
    </div>

    <div class="form-group" style="max-width: 300px; margin-bottom: 24px;">
      <label class="label">Peluquero</label>
      <select class="input" v-model="selectedBarberId" @change="loadHours">
        <option value="">Seleccionar peluquero...</option>
        <option v-for="b in barbers" :key="b.id" :value="b.id">{{ b.name }}</option>
      </select>
    </div>

    <div v-if="selectedBarberId && !loading" class="schedule-grid">
      <div v-for="(day, idx) in days" :key="idx" class="day-row card">
        <div class="day-header">
          <label class="checkbox-item">
            <input type="checkbox" v-model="hours[idx].is_working" />
            <span class="day-name">{{ day }}</span>
          </label>
        </div>
        <div v-if="hours[idx].is_working" class="day-times">
          <input type="time" class="input time-input" v-model="hours[idx].start_time" />
          <span class="time-sep">a</span>
          <input type="time" class="input time-input" v-model="hours[idx].end_time" />
        </div>
        <span v-else class="closed-label">Cerrado</span>
      </div>

      <button class="btn btn-primary" @click="saveHours" style="margin-top: 16px;">Guardar horarios</button>
    </div>

    <div v-if="loading" class="skeleton-list">
      <div class="skeleton" style="height: 50px" v-for="i in 7" :key="i"></div>
    </div>
  </div>
</template>

<script>
import { barbersService } from '../../services/barbersService'
import { scheduleService } from '../../services/scheduleService'
import { useToast } from '../../composables/useToast'

export default {
  name: 'ScheduleView',
  data() {
    return {
      loading: false,
      barbers: [],
      selectedBarberId: '',
      days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
      hours: Array.from({ length: 7 }, (_, i) => ({
        day_of_week: i,
        start_time: '09:00',
        end_time: '15:00',
        is_working: i < 5
      }))
    }
  },
  async mounted() {
    try { this.barbers = await barbersService.getAll() } catch (e) {}
  },
  methods: {
    async loadHours() {
      if (!this.selectedBarberId) return
      this.loading = true
      try {
        const data = await scheduleService.getWorkingHours(this.selectedBarberId)
        if (data.length > 0) {
          this.hours = Array.from({ length: 7 }, (_, i) => {
            const existing = data.find(d => d.day_of_week === i)
            return existing
              ? { day_of_week: i, start_time: existing.start_time.slice(0, 5), end_time: existing.end_time.slice(0, 5), is_working: existing.is_working }
              : { day_of_week: i, start_time: '09:00', end_time: '15:00', is_working: false }
          })
        }
      } catch (e) { useToast().error('Error al cargar horarios') }
      this.loading = false
    },
    async saveHours() {
      try {
        const hoursData = this.hours.map(h => ({
          day_of_week: h.day_of_week,
          start_time: h.start_time,
          end_time: h.end_time,
          is_working: h.is_working
        }))
        await scheduleService.updateWorkingHours(this.selectedBarberId, hoursData)
        useToast().success('Horarios guardados')
      } catch (e) { useToast().error('Error al guardar') }
    }
  }
}
</script>

<style scoped>
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
.page-title { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
.page-desc { color: var(--text-secondary); font-size: 15px; }
.skeleton-list { display: flex; flex-direction: column; gap: 8px; }

.schedule-grid { display: flex; flex-direction: column; gap: 10px; max-width: 500px; }
.day-row { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; }
.day-header { display: flex; align-items: center; }
.checkbox-item { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 14px; }
.checkbox-item input { width: 16px; height: 16px; accent-color: var(--accent); }
.day-name { font-weight: 500; min-width: 90px; }
.day-times { display: flex; align-items: center; gap: 8px; }
.time-input { width: 110px; text-align: center; }
.time-sep { color: var(--text-tertiary); font-size: 13px; }
.closed-label { font-size: 13px; color: var(--text-tertiary); }
.form-group { margin-bottom: 0; }
</style>

