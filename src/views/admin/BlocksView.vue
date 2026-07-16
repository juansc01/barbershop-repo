<template>
  <div class="blocks-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">Bloqueos</h1>
        <p class="page-desc">Vacaciones, descansos y ausencias</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="openVacationModal">+ Vacaciones</button>
        <button class="btn btn-primary" @click="openBlockModal">+ Bloqueo</button>
      </div>
    </div>

    <!-- Vacations -->
    <div class="section">
      <h2 class="section-title">Vacaciones</h2>
      <div v-if="vacations.length === 0" class="empty-card card">
        <p>No hay vacaciones programadas</p>
      </div>
      <div v-else class="blocks-list">
        <div v-for="v in vacations" :key="v.id" class="block-item card">
          <div class="block-info">
            <strong>{{ v.barbers?.name || 'Peluquero' }}</strong>
            <span>{{ formatDate(v.start_date) }} - {{ formatDate(v.end_date) }}</span>
            <span class="block-reason" v-if="v.reason">{{ v.reason }}</span>
          </div>
          <button class="btn btn-ghost btn-sm" style="color: var(--danger)" @click="removeVacation(v.id)">Eliminar</button>
        </div>
      </div>
    </div>

    <!-- Blocked times -->
    <div class="section">
      <h2 class="section-title">Bloqueos horarios</h2>
      <div v-if="blocks.length === 0" class="empty-card card">
        <p>No hay bloqueos activos</p>
      </div>
      <div v-else class="blocks-list">
        <div v-for="b in blocks" :key="b.id" class="block-item card">
          <div class="block-info">
            <strong>{{ b.barbers?.name || 'Peluquero' }}</strong>
            <span>{{ formatDateTime(b.start_datetime) }} - {{ formatDateTime(b.end_datetime) }}</span>
            <span class="block-reason" v-if="b.reason">{{ b.reason }}</span>
            <span class="badge badge-warning">{{ blockTypeLabel(b.block_type) }}</span>
          </div>
          <button class="btn btn-ghost btn-sm" style="color: var(--danger)" @click="removeBlock(b.id)">Eliminar</button>
        </div>
      </div>
    </div>

    <!-- Vacation Modal -->
    <div v-if="showVacationModal" class="modal-overlay" @click.self="showVacationModal = false">
      <div class="modal-content">
        <h3 class="modal-title">Añadir vacaciones</h3>
        <div class="form-group">
          <label class="label">Peluquero</label>
          <select class="input" v-model="vacForm.barber_id">
            <option value="">Seleccionar...</option>
            <option v-for="b in barbers" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="label">Tipo de periodo</label>
          <div class="quick-options">
            <button class="btn btn-sm" :class="vacQuick === 'today' ? 'btn-primary' : 'btn-secondary'" @click="setVacQuick('today')">Hoy</button>
            <button class="btn btn-sm" :class="vacQuick === 'tomorrow' ? 'btn-primary' : 'btn-secondary'" @click="setVacQuick('tomorrow')">Mañana</button>
            <button class="btn btn-sm" :class="vacQuick === 'week' ? 'btn-primary' : 'btn-secondary'" @click="setVacQuick('week')">Esta semana</button>
            <button class="btn btn-sm" :class="vacQuick === 'custom' ? 'btn-primary' : 'btn-secondary'" @click="setVacQuick('custom')">Personalizado</button>
          </div>
        </div>
        <div v-if="vacQuick === 'custom'" class="form-row">
          <div class="form-group">
            <label class="label">Desde</label>
            <input class="input" type="date" v-model="vacForm.start_date" />
          </div>
          <div class="form-group">
            <label class="label">Hasta</label>
            <input class="input" type="date" v-model="vacForm.end_date" />
          </div>
        </div>
        <div v-else class="date-preview">
          📅 {{ formatDate(vacForm.start_date) }} → {{ formatDate(vacForm.end_date) }}
        </div>
        <div class="form-group">
          <label class="label">Motivo (opcional)</label>
          <input class="input" v-model="vacForm.reason" placeholder="Motivo" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showVacationModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="saveVacation">Guardar</button>
        </div>
      </div>
    </div>

    <!-- Block Modal -->
    <div v-if="showBlockModal" class="modal-overlay" @click.self="showBlockModal = false">
      <div class="modal-content">
        <h3 class="modal-title">Añadir bloqueo horario</h3>
        <div class="form-group">
          <label class="label">Peluquero</label>
          <select class="input" v-model="blockForm.barber_id" @change="onBlockBarberChange">
            <option value="">Seleccionar...</option>
            <option v-for="b in barbers" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="label">Fecha</label>
          <input class="input" type="date" v-model="blockForm.date" @change="loadBlockSlots" />
        </div>
        <div class="form-group">
          <label class="label">Tipo</label>
          <select class="input" v-model="blockForm.block_type">
            <option value="absence">Ausencia</option>
          </select>
        </div>

        <!-- Slot selection -->
        <div v-if="blockForm.barber_id && blockForm.date" class="form-group">
          <label class="label">Selecciona los slots a bloquear</label>
          <div v-if="loadingSlots" class="skeleton" style="height: 40px; margin-top: 8px;"></div>
          <div v-else-if="daySlots.length === 0" class="empty-slots">
            <p>No hay slots disponibles para este día</p>
          </div>
          <div v-else class="slots-selector">
            <div
              v-for="slot in daySlots"
              :key="slot.time"
              class="slot-option"
              :class="{ selected: selectedBlockSlots.includes(slot.time), booked: slot.booked }"
              @click="toggleBlockSlot(slot)"
            >
              <span class="slot-time">{{ slot.time }}</span>
              <span v-if="slot.booked" class="slot-booked-badge">Reservado</span>
              <span v-else-if="selectedBlockSlots.includes(slot.time)" class="slot-check">✓</span>
            </div>
          </div>
        </div>

        <!-- Booked slot warning -->
        <div v-if="bookedWarnings.length > 0" class="booked-warnings">
          <div v-for="w in bookedWarnings" :key="w.time" class="warning-item">
            <span class="warning-icon">⚠️</span>
            <div class="warning-text">
              <strong>{{ w.time }}</strong> está reservado por <strong>{{ w.customerName }}</strong>
              <span v-if="w.phone"> ({{ w.phone }})</span>
              <p class="warning-note">Contacta con el cliente para avisarle del bloqueo.</p>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="label">Motivo (opcional)</label>
          <input class="input" v-model="blockForm.reason" placeholder="Motivo" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showBlockModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="saveBlock" :disabled="selectedBlockSlots.length === 0">
            Bloquear {{ selectedBlockSlots.length }} slot{{ selectedBlockSlots.length !== 1 ? 's' : '' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { scheduleService } from '../../services/scheduleService'
import { barbersService } from '../../services/barbersService'
import { appointmentsService } from '../../services/appointmentsService'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../composables/useToast'

export default {
  name: 'BlocksView',
  data() {
    return {
      barbers: [],
      vacations: [],
      blocks: [],
      showVacationModal: false,
      showBlockModal: false,
      vacQuick: 'today',
      vacForm: { barber_id: '', start_date: '', end_date: '', reason: '' },
      blockForm: { barber_id: '', date: '', block_type: 'absence', reason: '' },
      daySlots: [],
      selectedBlockSlots: [],
      bookedWarnings: [],
      loadingSlots: false
    }
  },
  async mounted() {
    await this.loadData()
  },
  methods: {
    async loadData() {
      try {
        const [barbers, vacations, blocks] = await Promise.all([
          barbersService.getAll(),
          scheduleService.getAllVacations(),
          scheduleService.getAllBlockedTimes()
        ])
        this.barbers = barbers
        this.vacations = vacations
        this.blocks = blocks
      } catch (e) { useToast().error('Error al cargar datos') }
    },
    openVacationModal() {
      this.vacQuick = 'today'
      this.setVacQuick('today')
      this.vacForm.barber_id = ''
      this.vacForm.reason = ''
      this.showVacationModal = true
    },
    openBlockModal() {
      this.blockForm = { barber_id: '', date: '', block_type: 'absence', reason: '' }
      this.daySlots = []
      this.selectedBlockSlots = []
      this.bookedWarnings = []
      this.showBlockModal = true
    },
    setVacQuick(type) {
      this.vacQuick = type
      const today = new Date()
      const toDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

      if (type === 'today') {
        this.vacForm.start_date = toDateStr(today)
        this.vacForm.end_date = toDateStr(today)
      } else if (type === 'tomorrow') {
        const tom = new Date(today)
        tom.setDate(tom.getDate() + 1)
        this.vacForm.start_date = toDateStr(tom)
        this.vacForm.end_date = toDateStr(tom)
      } else if (type === 'week') {
        const monday = new Date(today)
        monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1))
        const friday = new Date(monday)
        friday.setDate(monday.getDate() + 4)
        this.vacForm.start_date = toDateStr(monday)
        this.vacForm.end_date = toDateStr(friday)
      }
    },
    onBlockBarberChange() {
      if (this.blockForm.date) this.loadBlockSlots()
    },
    async loadBlockSlots() {
      if (!this.blockForm.barber_id || !this.blockForm.date) return
      this.loadingSlots = true
      this.selectedBlockSlots = []
      this.bookedWarnings = []

      try {
        // Get working hours for the barber on this day
        const jsDate = new Date(this.blockForm.date + 'T12:00:00')
        let dayOfWeek = jsDate.getDay() - 1
        if (dayOfWeek < 0) dayOfWeek = 6

        const { data: wh } = await supabase
          .from('working_hours')
          .select('*')
          .eq('barber_id', this.blockForm.barber_id)
          .eq('day_of_week', dayOfWeek)
          .single()

        if (!wh || !wh.is_working) {
          this.daySlots = []
          this.loadingSlots = false
          return
        }

        // Get appointments for this day
        const dayStart = new Date(this.blockForm.date + 'T00:00:00')
        const dayEnd = new Date(this.blockForm.date + 'T23:59:59')

        const { data: apts } = await supabase
          .from('appointments')
          .select('*, customers(name, phone), services(name)')
          .eq('barber_id', this.blockForm.barber_id)
          .gte('start_time', dayStart.toISOString())
          .lte('start_time', dayEnd.toISOString())
          .neq('status', 'cancelled')

        // Generate standard 45-min slots
        const [startH, startM] = wh.start_time.split(':').map(Number)
        const [endH, endM] = wh.end_time.split(':').map(Number)
        const workStart = startH * 60 + startM
        const workEnd = endH * 60 + endM

        const slots = []
        for (let min = workStart; min + 45 <= workEnd; min += 45) {
          const h = Math.floor(min / 60)
          const m = min % 60
          const timeStr = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`

          const slotStart = new Date(this.blockForm.date + 'T00:00:00')
          slotStart.setHours(h, m, 0, 0)
          const slotEnd = new Date(slotStart)
          slotEnd.setMinutes(slotEnd.getMinutes() + 45)

          // Check if booked
          const bookedApt = (apts || []).find(apt => {
            const aptStart = new Date(apt.start_time)
            const aptEnd = new Date(apt.end_time)
            return slotStart < aptEnd && slotEnd > aptStart
          })

          slots.push({
            time: timeStr,
            datetime: slotStart.toISOString(),
            booked: !!bookedApt,
            customerName: bookedApt?.customers?.name || '',
            customerPhone: bookedApt?.customers?.phone || '',
            serviceName: bookedApt?.services?.name || ''
          })
        }

        this.daySlots = slots
      } catch (e) {
        this.daySlots = []
      }
      this.loadingSlots = false
    },
    toggleBlockSlot(slot) {
      if (slot.booked) {
        // Show warning but still allow selecting
        const alreadyWarned = this.bookedWarnings.some(w => w.time === slot.time)
        if (!alreadyWarned) {
          this.bookedWarnings.push({
            time: slot.time,
            customerName: slot.customerName,
            phone: slot.customerPhone
          })
        }
      }
      const idx = this.selectedBlockSlots.indexOf(slot.time)
      if (idx >= 0) {
        this.selectedBlockSlots.splice(idx, 1)
        this.bookedWarnings = this.bookedWarnings.filter(w => w.time !== slot.time)
      } else {
        this.selectedBlockSlots.push(slot.time)
      }
    },
    async saveVacation() {
      if (!this.vacForm.barber_id || !this.vacForm.start_date || !this.vacForm.end_date) {
        useToast().error('Selecciona peluquero y fechas'); return
      }
      try {
        await scheduleService.createVacation(this.vacForm)
        useToast().success('Vacaciones añadidas')
        this.showVacationModal = false
        await this.loadData()
      } catch (e) { useToast().error('Error') }
    },
    async saveBlock() {
      if (!this.blockForm.barber_id || !this.blockForm.date || this.selectedBlockSlots.length === 0) {
        useToast().error('Selecciona al menos un slot'); return
      }
      try {
        // Create a block for each selected slot
        for (const time of this.selectedBlockSlots) {
          const [h, m] = time.split(':').map(Number)
          const start = new Date(this.blockForm.date + 'T00:00:00')
          start.setHours(h, m, 0, 0)
          const end = new Date(start)
          end.setMinutes(end.getMinutes() + 45)

          await scheduleService.createBlock({
            barber_id: this.blockForm.barber_id,
            block_type: this.blockForm.block_type,
            start_datetime: start.toISOString(),
            end_datetime: end.toISOString(),
            reason: this.blockForm.reason || null
          })
        }
        useToast().success(`${this.selectedBlockSlots.length} slot(s) bloqueado(s)`)
        this.showBlockModal = false
        await this.loadData()
      } catch (e) { useToast().error('Error al crear bloqueo') }
    },
    async removeVacation(id) {
      if (!confirm('¿Eliminar vacaciones?')) return
      try { await scheduleService.deleteVacation(id); await this.loadData(); useToast().success('Eliminado') } catch (e) { useToast().error('Error') }
    },
    async removeBlock(id) {
      if (!confirm('¿Eliminar bloqueo?')) return
      try { await scheduleService.deleteBlock(id); await this.loadData(); useToast().success('Eliminado') } catch (e) { useToast().error('Error') }
    },
    formatDate(d) {
      if (!d) return ''
      return new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    },
    formatDateTime(dt) { return new Date(dt).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) },
    blockTypeLabel(t) { const m = { block: 'Bloqueo', break: 'Descanso', absence: 'Ausencia' }; return m[t] || t }
  }
}
</script>

<style scoped>
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
.page-title { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
.page-desc { color: var(--text-secondary); font-size: 15px; }
.header-actions { display: flex; gap: 8px; }

.section { margin-bottom: 32px; }
.section-title { font-size: 18px; font-weight: 700; margin-bottom: 16px; }
.empty-card { text-align: center; padding: 24px; color: var(--text-secondary); font-size: 14px; }

.blocks-list { display: flex; flex-direction: column; gap: 8px; }
.block-item { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; gap: 16px; }
.block-info { display: flex; flex-direction: column; gap: 4px; font-size: 14px; }
.block-info strong { font-size: 14px; }
.block-info span { color: var(--text-secondary); font-size: 13px; }
.block-reason { font-style: italic; }

.form-group { margin-bottom: 16px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.modal-title { font-size: 18px; font-weight: 700; margin-bottom: 24px; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }

.quick-options { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
.date-preview { padding: 12px 16px; background: var(--bg-tertiary); border-radius: var(--radius-md); font-size: 14px; color: var(--text-secondary); margin-bottom: 16px; }

.slots-selector { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.slot-option {
  padding: 10px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: var(--transition);
  display: flex;
  align-items: center;
  gap: 8px;
}
.slot-option:hover { border-color: var(--border-light); }
.slot-option.selected { border-color: var(--accent); background: var(--accent-light); }
.slot-option.booked { border-color: var(--warning); opacity: 0.8; }
.slot-option.booked.selected { border-color: var(--warning); background: rgba(245, 158, 11, 0.1); }
.slot-booked-badge { font-size: 10px; background: rgba(245, 158, 11, 0.2); color: var(--warning); padding: 2px 6px; border-radius: 4px; }
.slot-check { color: var(--accent); font-weight: 700; }
.empty-slots { padding: 16px; color: var(--text-tertiary); font-size: 13px; }

.booked-warnings { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.warning-item {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: var(--radius-md);
  font-size: 13px;
}
.warning-icon { font-size: 16px; flex-shrink: 0; }
.warning-text { flex: 1; }
.warning-text strong { color: var(--text-primary); }
.warning-note { color: var(--text-tertiary); font-size: 12px; margin-top: 4px; }
</style>

