<template>
  <div class="business-view">
    <h1 class="page-title">Mi Negocio</h1>
    <p class="page-desc">Edita la información que se muestra en la página principal</p>

    <div v-if="loading" class="loading">Cargando...</div>

    <template v-else>
      <!-- Contact Info -->
      <div class="section">
        <h2 class="section-title">Datos de contacto</h2>
        <div class="card business-card">
          <form @submit.prevent="save" class="business-form">
            <div class="form-group">
              <label class="label">Teléfono (WhatsApp)</label>
              <input class="input" type="tel" v-model="form.phone" placeholder="666 999 212" />
            </div>
            <div class="form-group">
              <label class="label">Email</label>
              <input class="input" type="email" v-model="form.email" placeholder="contacto@ejemplo.com" />
            </div>
            <div class="form-group">
              <label class="label">Dirección</label>
              <input class="input" type="text" v-model="form.address" placeholder="Calle San Adolfo, Número 4, 3er piso" />
            </div>
          </form>
        </div>
      </div>

      <!-- Schedule -->
      <div class="section">
        <h2 class="section-title">Horario de apertura</h2>
        <div class="card business-card">
          <div class="schedule-editor">
            <div class="schedule-day" v-for="(day, index) in form.schedule" :key="index">
              <div class="day-header">
                <label class="checkbox-item">
                  <input type="checkbox" v-model="day.open" />
                  <span class="day-label">{{ day.name }}</span>
                </label>
              </div>
              <div class="day-times" v-if="day.open">
                <input class="input time-input" type="time" v-model="day.start" />
                <span class="time-sep">—</span>
                <input class="input time-input" type="time" v-model="day.end" />
              </div>
              <div class="day-closed" v-else>
                <span>Cerrado</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Save -->
      <button class="btn btn-primary save-btn" @click="save" :disabled="saving">
        {{ saving ? 'Guardando...' : 'Guardar cambios' }}
      </button>
    </template>
  </div>
</template>

<script>
import { supabase } from '../../lib/supabase'
import { useToast } from '../../composables/useToast'

const DEFAULT_SCHEDULE = [
  { name: 'Lunes', open: true, start: '09:00', end: '15:00' },
  { name: 'Martes', open: true, start: '09:00', end: '15:00' },
  { name: 'Miércoles', open: true, start: '09:00', end: '15:00' },
  { name: 'Jueves', open: true, start: '09:00', end: '15:00' },
  { name: 'Viernes', open: true, start: '09:00', end: '15:00' },
  { name: 'Sábado', open: false, start: '09:00', end: '14:00' },
  { name: 'Domingo', open: false, start: '09:00', end: '14:00' }
]

export default {
  name: 'BusinessView',
  data() {
    return {
      loading: true,
      saving: false,
      form: {
        phone: '',
        email: '',
        address: '',
        schedule: JSON.parse(JSON.stringify(DEFAULT_SCHEDULE))
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
        const { data } = await supabase
          .from('settings')
          .select('key, value')
          .in('key', ['business_phone', 'business_email', 'business_address', 'business_schedule'])

        if (data) {
          data.forEach(item => {
            const val = JSON.parse(item.value)
            if (item.key === 'business_phone') this.form.phone = val || ''
            if (item.key === 'business_email') this.form.email = val || ''
            if (item.key === 'business_address') this.form.address = val || ''
            if (item.key === 'business_schedule' && Array.isArray(val)) this.form.schedule = val
          })
        }
      } catch (e) {
        console.error('Error loading business info:', e)
      }
      this.loading = false
    },
    async save() {
      this.saving = true
      try {
        const updates = [
          { key: 'business_phone', value: JSON.stringify(this.form.phone) },
          { key: 'business_email', value: JSON.stringify(this.form.email) },
          { key: 'business_address', value: JSON.stringify(this.form.address) },
          { key: 'business_schedule', value: JSON.stringify(this.form.schedule) }
        ]

        const { error } = await supabase
          .from('settings')
          .upsert(updates, { onConflict: 'key' })

        if (error) throw error
        useToast().success('Información guardada correctamente')
      } catch (e) {
        console.error('Error saving:', e)
        useToast().error('Error al guardar')
      }
      this.saving = false
    }
  }
}
</script>

<style scoped>
.page-title { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
.page-desc { color: var(--text-secondary); font-size: 15px; margin-bottom: 32px; }

.section { margin-bottom: 32px; }
.section-title { font-size: 18px; font-weight: 700; margin-bottom: 12px; }

.business-card { max-width: 600px; }
.business-form { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; }

.loading { color: var(--text-secondary); padding: 40px 0; }

.schedule-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.schedule-day {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
  gap: 12px;
  flex-wrap: wrap;
}

.schedule-day:last-child { border-bottom: none; }

.day-header {
  min-width: 130px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  cursor: pointer;
}

.checkbox-item input {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
}

.day-label {
  font-weight: 500;
}

.day-times {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-input {
  width: 110px;
  text-align: center;
  padding: 8px 10px;
  font-size: 14px;
}

.time-sep {
  color: var(--text-tertiary);
}

.day-closed {
  font-size: 13px;
  color: var(--text-tertiary);
  font-style: italic;
}

.save-btn {
  margin-top: 8px;
}

@media (max-width: 768px) {
  .schedule-day {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .day-times {
    width: 100%;
  }

  .time-input {
    flex: 1;
    width: auto;
    min-width: 0;
  }
}
</style>

