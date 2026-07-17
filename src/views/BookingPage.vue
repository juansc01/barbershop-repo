<template>
  <div class="booking-page">
    <!-- Header -->
    <header class="booking-header">
      <div class="container header-inner">
        <router-link to="/" class="back-link">← Volver</router-link>
        <span class="header-title">Reservar cita</span>
        <span v-if="currentStep <= 5" class="step-indicator">Paso {{ currentStep }} de 5</span>
      </div>
    </header>

    <!-- Progress bar -->
    <div v-if="currentStep <= 5" class="progress-bar">
      <div class="progress-fill" :style="{ width: (currentStep / 5) * 100 + '%' }"></div>
    </div>

    <!-- Steps -->
    <main class="booking-main container">
      <!-- Step 1: Select Service -->
      <div v-if="currentStep === 1" class="step fade-in">
        <h2 class="step-title">Elige tu servicio</h2>
        <p class="step-desc">Selecciona el servicio que deseas reservar</p>

        <div v-if="loading" class="skeleton-grid">
          <div class="skeleton" style="height: 100px;" v-for="i in 3" :key="i"></div>
        </div>

        <div v-else class="services-grid">
          <div
            v-for="service in services"
            :key="service.id"
            class="service-card card"
            :class="{ selected: selectedService?.id === service.id }"
            @click="selectService(service)"
          >
            <div class="service-color" :style="{ background: service.color }"></div>
            <div class="service-info">
              <h3 class="service-name">{{ service.name }}</h3>
              <p class="service-desc">{{ service.description }}</p>
              <div class="service-meta">
                <span class="service-duration">{{ service.duration }} min</span>
                <span class="service-price">{{ service.price }}€</span>
              </div>
            </div>
            <div class="service-check" v-if="selectedService?.id === service.id">✓</div>
          </div>
        </div>
      </div>

      <!-- Step 2: Select Barber -->
      <div v-if="currentStep === 2" class="step fade-in">
        <h2 class="step-title">Elige tu peluquero</h2>
        <p class="step-desc">Selecciona quién te atenderá</p>

        <div v-if="loading" class="skeleton-grid">
          <div class="skeleton" style="height: 80px;" v-for="i in 2" :key="i"></div>
        </div>

        <div v-else class="barbers-grid">
          <div
            v-for="barber in availableBarbers"
            :key="barber.id"
            class="barber-card card"
            :class="{ selected: selectedBarber?.id === barber.id }"
            @click="selectBarber(barber)"
          >
            <img v-if="barber.photo_url && (barber.photo_url.startsWith('http') || barber.photo_url.startsWith('data:'))" :src="barber.photo_url" class="barber-avatar-img" />
            <div v-else class="barber-avatar" :style="{ background: barber.color }">
              {{ barber.name.charAt(0) }}
            </div>
            <div class="barber-info">
              <h3 class="barber-name">{{ barber.name }}</h3>
              <p class="barber-bio">{{ barber.bio || 'Barbero profesional' }}</p>
            </div>
            <div class="service-check" v-if="selectedBarber?.id === barber.id">✓</div>
          </div>
        </div>
      </div>

      <!-- Step 3: Select Date -->
      <div v-if="currentStep === 3" class="step fade-in">
        <h2 class="step-title">Elige fecha</h2>
        <p class="step-desc">Selecciona el día que prefieras</p>

        <div v-if="loading" class="skeleton-grid">
          <div class="skeleton" style="height: 50px;" v-for="i in 5" :key="i"></div>
        </div>

        <div v-else class="dates-grid">
          <div
            v-for="d in availableDates"
            :key="d.date"
            class="date-card"
            :class="{ selected: selectedDate === d.date, vacation: d.onVacation }"
            @click="!d.onVacation && selectDate(d.date)"
          >
            <span class="date-day">{{ formatDay(d.date) }}</span>
            <span class="date-full">{{ formatDate(d.date) }}</span>
            <span v-if="d.onVacation" class="vacation-label">Vacaciones</span>
          </div>
        </div>
      </div>

      <!-- Step 4: Select Time -->
      <div v-if="currentStep === 4" class="step fade-in">
        <h2 class="step-title">Elige hora</h2>
        <p class="step-desc">Horarios disponibles para {{ formatDate(selectedDate) }}</p>

        <div v-if="loading" class="skeleton-grid slots">
          <div class="skeleton" style="height: 44px; width: 80px;" v-for="i in 8" :key="i"></div>
        </div>

        <div v-else-if="availableSlots.length === 0" class="empty-state">
          <p>No hay horarios disponibles para este día.</p>
          <button class="btn btn-secondary" @click="currentStep = 3">Elegir otra fecha</button>
        </div>

        <div v-else class="slots-grid">
          <button
            v-for="slot in availableSlots"
            :key="slot.time"
            class="slot-btn"
            :class="{ selected: selectedTime === slot.time }"
            @click="selectTime(slot)"
          >
            {{ slot.time }}
          </button>
        </div>
      </div>

      <!-- Step 5: Customer Data & Confirm -->
      <div v-if="currentStep === 5" class="step fade-in">
        <h2 class="step-title">Tus datos</h2>
        <p class="step-desc">Completa tu información para confirmar</p>

        <form @submit.prevent="confirmBooking" class="customer-form">
          <div class="form-group">
            <label class="label">Nombre *</label>
            <input class="input" v-model="customer.name" placeholder="Tu nombre" required />
          </div>
          <div class="form-group">
            <label class="label">Teléfono *</label>
            <input
              class="input"
              :class="{ 'input-error': phoneError }"
              v-model="customer.phone"
              placeholder="612 345 678"
              type="tel"
              maxlength="15"
              @input="validatePhone"
              required
            />
            <span v-if="phoneError" class="field-error">{{ phoneError }}</span>
          </div>
          <div class="form-group">
            <label class="label">Email (opcional)</label>
            <input class="input" v-model="customer.email" type="email" placeholder="tu@email.com" />
          </div>
          <div class="form-group">
            <label class="label">Observaciones (opcional)</label>
            <textarea class="input" v-model="customer.notes" placeholder="Algo que debamos saber..." rows="3"></textarea>
          </div>

          <!-- Summary -->
          <div class="booking-summary card">
            <h3 class="summary-title">Resumen de tu cita</h3>
            <div class="summary-grid">
              <div class="summary-row">
                <span class="summary-label">Servicio</span>
                <span class="summary-value">{{ selectedService?.name }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Peluquero</span>
                <span class="summary-value">{{ selectedBarber?.name }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Fecha</span>
                <span class="summary-value">{{ formatDate(selectedDate) }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Hora</span>
                <span class="summary-value">{{ selectedTime }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Duración</span>
                <span class="summary-value">{{ selectedService?.duration }} min</span>
              </div>
              <div class="summary-row highlight">
                <span class="summary-label">Precio</span>
                <span class="summary-value">{{ selectedService?.price }}€</span>
              </div>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-lg confirm-btn" :disabled="submitting">
            {{ submitting ? 'Confirmando...' : 'Confirmar reserva' }}
          </button>
        </form>
      </div>

      <!-- Success -->
      <div v-if="currentStep === 6" class="step fade-in success-step">
        <div class="success-icon">✓</div>
        <h2 class="step-title">¡Cita confirmada!</h2>
        <p class="step-desc">Tu reserva ha sido registrada correctamente.</p>
        <div class="booking-summary card">
          <div class="summary-grid">
            <div class="summary-row">
              <span class="summary-label">Servicio</span>
              <span class="summary-value">{{ selectedService?.name }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Peluquero</span>
              <span class="summary-value">{{ selectedBarber?.name }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Fecha y hora</span>
              <span class="summary-value">{{ formatDate(selectedDate) }} a las {{ selectedTime }}</span>
            </div>
          </div>
        </div>
        <router-link to="/" class="btn btn-secondary btn-lg">Volver al inicio</router-link>
      </div>
    </main>

    <!-- Navigation buttons -->
    <div v-if="currentStep >= 1 && currentStep <= 5" class="booking-nav container">
      <button v-if="currentStep > 1" class="btn btn-secondary" @click="prevStep">← Anterior</button>
      <div v-else></div>
      <button
        v-if="currentStep < 5"
        class="btn btn-primary"
        :disabled="!canAdvance"
        @click="nextStep"
      >
        Siguiente →
      </button>
    </div>
  </div>
</template>

<script>
import { servicesService } from '../services/servicesService'
import { barbersService } from '../services/barbersService'
import { availabilityService } from '../services/availabilityService'
import { appointmentsService } from '../services/appointmentsService'
import { customersService } from '../services/customersService'
import { useToast } from '../composables/useToast'

export default {
  name: 'BookingPage',
  data() {
    return {
      currentStep: 1,
      loading: false,
      submitting: false,
      services: [],
      barbers: [],
      availableDates: [],
      availableSlots: [],
      selectedService: null,
      selectedBarber: null,
      selectedDate: null,
      selectedTime: null,
      selectedSlot: null,
      phoneError: '',
      customer: {
        name: '',
        phone: '',
        email: '',
        notes: ''
      }
    }
  },
  computed: {
    canAdvance() {
      switch (this.currentStep) {
        case 1: return !!this.selectedService
        case 2: return !!this.selectedBarber
        case 3: return !!this.selectedDate
        case 4: return !!this.selectedTime
        default: return true
      }
    },
    availableBarbers() {
      if (!this.selectedService) return this.barbers
      return this.barbers.filter(b =>
        b.barber_services?.some(bs => bs.service_id === this.selectedService.id)
      )
    }
  },
  async mounted() {
    await this.loadServices()
  },
  methods: {
    async loadServices() {
      this.loading = true
      try {
        this.services = await servicesService.getActive()
      } catch (e) {
        console.error('Error al cargar servicios:', e)
        useToast().error('Error al cargar servicios: ' + (e.message || e.code || 'conexión fallida'))
      }
      this.loading = false
    },
    async loadBarbers() {
      this.loading = true
      try {
        this.barbers = await barbersService.getActive()
      } catch (e) {
        useToast().error('Error al cargar peluqueros')
      }
      this.loading = false
    },
    async loadDates() {
      this.loading = true
      try {
        this.availableDates = await availabilityService.getAvailableDates(this.selectedBarber.id)
      } catch (e) {
        useToast().error('Error al cargar fechas')
      }
      this.loading = false
    },
    async loadSlots() {
      this.loading = true
      try {
        this.availableSlots = await availabilityService.getAvailableSlots(
          this.selectedBarber.id,
          this.selectedDate,
          this.selectedService.duration
        )
      } catch (e) {
        useToast().error('Error al cargar horarios')
      }
      this.loading = false
    },
    selectService(service) {
      this.selectedService = service
    },
    selectBarber(barber) {
      this.selectedBarber = barber
    },
    selectDate(date) {
      this.selectedDate = date
    },
    selectTime(slot) {
      this.selectedTime = slot.time
      this.selectedSlot = slot
    },
    async nextStep() {
      if (!this.canAdvance) return
      this.currentStep++
      if (this.currentStep === 2) await this.loadBarbers()
      if (this.currentStep === 3) await this.loadDates()
      if (this.currentStep === 4) await this.loadSlots()
    },
    prevStep() {
      this.currentStep--
    },
    validatePhone() {
      const phone = this.customer.phone.replace(/[\s\-().]/g, '')
      if (!phone) {
        this.phoneError = ''
        return false
      }
      // Solo dígitos y opcionalmente un + al inicio
      if (!/^\+?\d+$/.test(phone)) {
        this.phoneError = 'Solo números y un + al inicio están permitidos'
        return false
      }
      const digits = phone.replace(/\D/g, '')
      if (digits.length < 9) {
        this.phoneError = 'El teléfono debe tener al menos 9 dígitos'
        return false
      }
      if (digits.length > 15) {
        this.phoneError = 'El teléfono no puede tener más de 15 dígitos'
        return false
      }
      // Validar formato español: empieza por 6, 7, 8 o 9 (sin prefijo) o con +34
      const isSpanish = /^(\+34)?\d{9}$/.test(phone)
      const isInternational = /^\+\d{9,15}$/.test(phone)
      const isLocalValid = /^[6-9]\d{8}$/.test(phone)
      if (!isSpanish && !isInternational && !isLocalValid) {
        this.phoneError = 'Introduce un teléfono válido (ej: 612345678 o +34612345678)'
        return false
      }
      this.phoneError = ''
      return true
    },
    async confirmBooking() {
      if (!this.customer.name || !this.customer.phone) {
        useToast().error('Nombre y teléfono son obligatorios')
        return
      }
      if (!this.validatePhone()) {
        useToast().error('Introduce un número de teléfono válido')
        return
      }
      this.submitting = true
      try {
        // Create or find customer
        const customerData = await customersService.findOrCreate({
          name: this.customer.name,
          phone: this.customer.phone,
          email: this.customer.email || null,
          notes: this.customer.notes || null
        })

        // Calculate end time
        const startTime = new Date(this.selectedSlot.datetime)
        const endTime = new Date(startTime)
        endTime.setMinutes(endTime.getMinutes() + this.selectedService.duration)

        // Create appointment (includes concurrency check)
        await appointmentsService.create({
          barber_id: this.selectedBarber.id,
          service_id: this.selectedService.id,
          customer_id: customerData.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          price: this.selectedService.price,
          notes: this.customer.notes || null
        })


        this.currentStep = 6
        useToast().success('¡Cita reservada con éxito!')
      } catch (e) {
        if (e.message === 'SLOT_TAKEN') {
          useToast().error('¡Esa hora ya ha sido reservada por otro cliente! Por favor elige otra hora.')
          // Go back to time selection step and refresh slots
          this.currentStep = 3
          this.selectedSlot = null
          this.loadSlots()
        } else {
          useToast().error('Error al confirmar la cita. Inténtalo de nuevo.')
        }
      }
      this.submitting = false
    },
    formatDay(dateStr) {
      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
      const d = new Date(dateStr + 'T12:00:00')
      return days[d.getDay()]
    },
    formatDate(dateStr) {
      if (!dateStr) return ''
      const d = new Date(dateStr + 'T12:00:00')
      return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    }
  }
}
</script>

<style scoped>
.booking-page {
  min-height: 100vh;
  padding-bottom: 100px;
}

.booking-header {
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

.step-indicator {
  font-size: 13px;
  color: var(--text-tertiary);
}

.progress-bar {
  height: 2px;
  background: var(--border-color);
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.4s ease;
}

.booking-main {
  max-width: 600px;
  padding-top: 48px;
}

.step-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}

.step-desc {
  color: var(--text-secondary);
  font-size: 15px;
  margin-bottom: 32px;
}

.skeleton-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-grid.slots {
  flex-direction: row;
  flex-wrap: wrap;
}

/* Services */
.services-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.service-card {
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  padding: 20px;
  position: relative;
}

.service-card.selected {
  border-color: var(--accent);
  background: var(--accent-light);
}

.service-color {
  width: 4px;
  height: 40px;
  border-radius: 4px;
  flex-shrink: 0;
}

.service-info {
  flex: 1;
}

.service-name {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
}

.service-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.service-meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
}

.service-duration {
  color: var(--text-tertiary);
}

.service-price {
  font-weight: 600;
  color: var(--accent);
}

.service-check {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
}

/* Barbers */
.barbers-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.barber-card {
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  padding: 20px;
}

.barber-card.selected {
  border-color: var(--accent);
  background: var(--accent-light);
}

.barber-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.barber-avatar-img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.barber-name {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 2px;
}

.barber-bio {
  font-size: 13px;
  color: var(--text-secondary);
}

.barber-info {
  flex: 1;
}

/* Dates */
.dates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.date-card {
  padding: 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  cursor: pointer;
  text-align: center;
  transition: var(--transition);
}

.date-card:hover {
  border-color: var(--border-light);
}

.date-card.selected {
  border-color: var(--accent);
  background: var(--accent-light);
}

.date-card.vacation {
  border-color: rgba(245, 158, 11, 0.3);
  background: rgba(245, 158, 11, 0.05);
  cursor: not-allowed;
  opacity: 0.7;
}

.date-card.vacation:hover {
  border-color: rgba(245, 158, 11, 0.3);
}

.vacation-label {
  display: block;
  font-size: 10px;
  color: var(--warning);
  font-weight: 600;
  margin-top: 4px;
}

.date-day {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  margin-bottom: 4px;
}

.date-full {
  font-size: 13px;
  font-weight: 500;
}

/* Slots */
.slots-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.slot-btn {
  padding: 12px 20px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  font-variant-numeric: tabular-nums;
}

.slot-btn:hover {
  border-color: var(--border-light);
  background: var(--bg-hover);
}

.slot-btn.selected {
  border-color: var(--accent);
  background: var(--accent);
  color: white;
}

/* Customer form */
.customer-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.input-error {
  border-color: var(--danger);
}

.field-error {
  font-size: 12px;
  color: var(--danger);
  margin-top: 4px;
}

/* Summary */
.booking-summary {
  margin-top: 8px;
}

.summary-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
}

.summary-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.summary-label {
  color: var(--text-secondary);
}

.summary-value {
  font-weight: 500;
}

.summary-row.highlight .summary-value {
  color: var(--accent);
  font-weight: 700;
  font-size: 16px;
}

.confirm-btn {
  width: 100%;
  margin-top: 8px;
}

/* Success */
.success-step {
  text-align: center;
}

.success-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  margin: 0 auto 24px;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.empty-state .btn {
  margin-top: 16px;
}

/* Navigation */
.booking-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 16px 24px;
  background: rgba(10, 10, 11, 0.9);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--border-color);
  max-width: 600px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .dates-grid {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  }
}
</style>

