<template>
  <div class="calendar-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">Calendario</h1>
        <p class="page-desc">Gestiona todas las citas</p>
      </div>
      <button class="btn btn-primary" @click="showCreateModal = true">+ Nueva cita</button>
    </div>

    <div class="calendar-wrapper card">
      <div ref="calendarEl" id="calendar"></div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal || editingAppointment" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3 class="modal-title">{{ editingAppointment ? 'Editar cita' : 'Nueva cita' }}</h3>

        <div class="form-group">
          <label class="label">Cliente (nombre)</label>
          <input class="input" v-model="form.customerName" placeholder="Nombre del cliente" />
        </div>
        <div class="form-group">
          <label class="label">Teléfono</label>
          <input class="input" v-model="form.customerPhone" placeholder="Teléfono" />
        </div>
        <div class="form-group">
          <label class="label">Servicio</label>
          <select class="input" v-model="form.serviceId">
            <option value="">Seleccionar...</option>
            <option v-for="s in services" :key="s.id" :value="s.id">{{ s.name }} ({{ s.duration }}min - {{ s.price }}€)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="label">Peluquero</label>
          <select class="input" v-model="form.barberId">
            <option value="">Seleccionar...</option>
            <option v-for="b in barbers" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="label">Fecha y hora</label>
          <input class="input" type="datetime-local" v-model="form.startTime" />
        </div>
        <div class="form-group" v-if="editingAppointment">
          <label class="label">Estado</label>
          <select class="input" v-model="form.status">
            <option value="confirmed">Confirmada</option>
            <option value="completed">Completada</option>
            <option value="cancelled">Cancelada</option>
            <option value="no_show">No show</option>
          </select>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeModal">Cancelar</button>
          <button v-if="editingAppointment" class="btn btn-danger btn-sm" @click="cancelAppointment">Cancelar cita</button>
          <button class="btn btn-primary" @click="saveAppointment">
            {{ editingAppointment ? 'Guardar' : 'Crear' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { appointmentsService } from '../../services/appointmentsService'
import { servicesService } from '../../services/servicesService'
import { barbersService } from '../../services/barbersService'
import { customersService } from '../../services/customersService'
import { useToast } from '../../composables/useToast'

export default {
  name: 'CalendarView',
  data() {
    return {
      calendar: null,
      showCreateModal: false,
      editingAppointment: null,
      services: [],
      barbers: [],
      form: {
        customerName: '',
        customerPhone: '',
        serviceId: '',
        barberId: '',
        startTime: '',
        status: 'confirmed'
      }
    }
  },
  async mounted() {
    await this.loadData()
    this.initCalendar()
  },
  beforeUnmount() {
    if (this.calendar) this.calendar.destroy()
  },
  methods: {
    async loadData() {
      const [services, barbers] = await Promise.all([
        servicesService.getAll(),
        barbersService.getAll()
      ])
      this.services = services
      this.barbers = barbers
    },
    initCalendar() {
      const el = this.$refs.calendarEl
      this.calendar = new Calendar(el, {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView: 'timeGridWeek',
        locale: 'es',
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        slotMinTime: '08:00:00',
        slotMaxTime: '21:00:00',
        allDaySlot: false,
        editable: true,
        droppable: true,
        selectable: true,
        height: 'auto',
        events: async (info, successCallback) => {
          try {
            const data = await appointmentsService.getAll({
              from: info.startStr,
              to: info.endStr
            })
            const events = data
              .filter(apt => apt.status !== 'cancelled')
              .map(apt => ({
                id: apt.id,
                title: `${apt.customers?.name || 'Cliente'} - ${apt.services?.name || 'Servicio'}`,
                start: apt.start_time,
                end: apt.end_time,
                backgroundColor: apt.barbers?.color || '#6366f1',
                borderColor: apt.barbers?.color || '#6366f1',
                extendedProps: apt
              }))
            successCallback(events)
          } catch (e) {
            successCallback([])
          }
        },
        eventClick: (info) => {
          const apt = info.event.extendedProps
          this.editingAppointment = apt
          this.form = {
            customerName: apt.customers?.name || '',
            customerPhone: apt.customers?.phone || '',
            serviceId: apt.service_id,
            barberId: apt.barber_id,
            startTime: new Date(apt.start_time).toISOString().slice(0, 16),
            status: apt.status
          }
        },
        eventDrop: async (info) => {
          try {
            const apt = info.event.extendedProps
            const service = this.services.find(s => s.id === apt.service_id)
            const newStart = info.event.start
            const newEnd = new Date(newStart)
            newEnd.setMinutes(newEnd.getMinutes() + (service?.duration || 30))

            await appointmentsService.update(apt.id, {
              start_time: newStart.toISOString(),
              end_time: newEnd.toISOString()
            })
            useToast().success('Cita movida correctamente')
          } catch (e) {
            info.revert()
            useToast().error('Error al mover la cita')
          }
        },
        eventResize: async (info) => {
          try {
            const apt = info.event.extendedProps
            await appointmentsService.update(apt.id, {
              end_time: info.event.end.toISOString()
            })
            useToast().success('Duración actualizada')
          } catch (e) {
            info.revert()
          }
        },
        dateClick: (info) => {
          this.showCreateModal = true
          this.form.startTime = info.dateStr.slice(0, 16)
        }
      })
      this.calendar.render()
    },
    closeModal() {
      this.showCreateModal = false
      this.editingAppointment = null
      this.form = { customerName: '', customerPhone: '', serviceId: '', barberId: '', startTime: '', status: 'confirmed' }
    },
    async saveAppointment() {
      if (!this.form.customerName || !this.form.customerPhone || !this.form.serviceId || !this.form.barberId || !this.form.startTime) {
        useToast().error('Completa todos los campos obligatorios')
        return
      }
      try {
        const service = this.services.find(s => s.id === this.form.serviceId)
        const startTime = new Date(this.form.startTime)
        const endTime = new Date(startTime)
        endTime.setMinutes(endTime.getMinutes() + (service?.duration || 30))

        const customer = await customersService.findOrCreate({
          name: this.form.customerName,
          phone: this.form.customerPhone
        })

        if (this.editingAppointment) {
          await appointmentsService.update(this.editingAppointment.id, {
            barber_id: this.form.barberId,
            service_id: this.form.serviceId,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            status: this.form.status
          })
          useToast().success('Cita actualizada')
        } else {
          await appointmentsService.create({
            barber_id: this.form.barberId,
            service_id: this.form.serviceId,
            customer_id: customer.id,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            price: service?.price || 0
          })
          useToast().success('Cita creada')
        }

        this.closeModal()
        this.calendar.refetchEvents()
      } catch (e) {
        useToast().error('Error al guardar la cita')
      }
    },
    async cancelAppointment() {
      if (!this.editingAppointment) return
      if (!confirm('¿Cancelar esta cita? Se eliminará del calendario.')) return
      try {
        await appointmentsService.cancel(this.editingAppointment.id)
        useToast().success('Cita cancelada y eliminada del calendario')
        this.closeModal()
        this.calendar.refetchEvents()
      } catch (e) {
        useToast().error('Error al cancelar')
      }
    }
  }
}
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 4px;
}

.page-desc {
  color: var(--text-secondary);
  font-size: 15px;
}

.calendar-wrapper {
  padding: 16px;
  overflow: hidden;
}

.form-group {
  margin-bottom: 16px;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 24px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .modal-actions .btn {
    flex: 1 1 auto;
    min-width: 0;
    padding: 10px 12px;
    font-size: 13px;
  }
}

/* FullCalendar overrides */
:deep(.fc) {
  --fc-bg-event-opacity: 0.9;
  --fc-border-color: var(--border-color);
  --fc-page-bg-color: transparent;
  --fc-neutral-bg-color: var(--bg-secondary);
  --fc-today-bg-color: rgba(99, 102, 241, 0.05);
  --fc-event-border-color: transparent;
}

:deep(.fc-toolbar-title) {
  font-size: 18px !important;
  font-weight: 700;
}

:deep(.fc-button) {
  background: var(--bg-tertiary) !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-primary) !important;
  font-size: 13px !important;
  padding: 6px 12px !important;
}

:deep(.fc-button-active) {
  background: var(--accent) !important;
  border-color: var(--accent) !important;
}

:deep(.fc-event) {
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 12px;
}

:deep(.fc-col-header-cell) {
  padding: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

:deep(.fc-timegrid-slot) {
  height: 40px;
}

:deep(.fc-daygrid-day-number) {
  color: var(--text-primary);
  font-size: 13px;
}

:deep(.fc-scrollgrid) {
  border-color: var(--border-color) !important;
}

:deep(td), :deep(th) {
  border-color: var(--border-color) !important;
}
</style>

