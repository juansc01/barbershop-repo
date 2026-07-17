<template>
  <div class="services-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">Servicios</h1>
        <p class="page-desc">Gestiona los servicios de la barbería</p>
      </div>
      <button class="btn btn-primary" @click="openCreate">+ Nuevo servicio</button>
    </div>

    <div v-if="loading" class="skeleton-list">
      <div class="skeleton" style="height: 70px" v-for="i in 3" :key="i"></div>
    </div>

    <div v-else class="services-list">
      <div v-for="service in services" :key="service.id" class="service-item card">
        <div class="service-color-bar" :style="{ background: service.color }"></div>
        <div class="service-info">
          <h3>{{ service.name }}</h3>
          <p>{{ service.description }}</p>
          <div class="service-meta">
            <span>{{ service.duration }} min</span>
            <span>{{ service.price }}€</span>
            <span class="badge" :class="service.active ? 'badge-success' : 'badge-danger'">
              {{ service.active ? 'Activo' : 'Inactivo' }}
            </span>
          </div>
        </div>
        <div class="service-actions">
          <button class="btn btn-ghost btn-sm" @click="toggleActive(service)">
            {{ service.active ? 'Desactivar' : 'Activar' }}
          </button>
          <button class="btn btn-ghost btn-sm" @click="openEdit(service)">Editar</button>
          <button class="btn btn-ghost btn-sm" style="color: var(--danger)" @click="deleteService(service)">Eliminar</button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <h3 class="modal-title">{{ editing ? 'Editar servicio' : 'Nuevo servicio' }}</h3>
        <div class="form-group">
          <label class="label">Nombre</label>
          <input class="input" v-model="form.name" placeholder="Nombre del servicio" />
        </div>
        <div class="form-group">
          <label class="label">Descripción</label>
          <textarea class="input" v-model="form.description" rows="2" placeholder="Descripción"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="label">Duración (min)</label>
            <input class="input" type="number" v-model.number="form.duration" />
          </div>
          <div class="form-group">
            <label class="label">Precio (€)</label>
            <input class="input" type="number" step="0.5" v-model.number="form.price" />
          </div>
        </div>
        <div class="form-group">
          <label class="label">Color</label>
          <input type="color" v-model="form.color" class="color-input" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="saveService">Guardar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { servicesService } from '../../services/servicesService'
import { useToast } from '../../composables/useToast'

export default {
  name: 'ServicesView',
  data() {
    return {
      loading: true,
      services: [],
      showModal: false,
      editing: null,
      form: { name: '', description: '', duration: 30, price: 0, color: '#6366f1' }
    }
  },
  async mounted() {
    await this.loadServices()
  },
  methods: {
    async loadServices() {
      this.loading = true
      try { this.services = await servicesService.getAll() } catch (e) { useToast().error('Error') }
      this.loading = false
    },
    openCreate() {
      this.editing = null
      this.form = { name: '', description: '', duration: 30, price: 0, color: '#6366f1' }
      this.showModal = true
    },
    openEdit(service) {
      this.editing = service
      this.form = { name: service.name, description: service.description, duration: service.duration, price: service.price, color: service.color }
      this.showModal = true
    },
    async saveService() {
      if (!this.form.name) { useToast().error('El nombre es obligatorio'); return }
      try {
        if (this.editing) {
          await servicesService.update(this.editing.id, this.form)
          useToast().success('Servicio actualizado')
        } else {
          await servicesService.create(this.form)
          useToast().success('Servicio creado')
        }
        this.showModal = false
        await this.loadServices()
      } catch (e) { useToast().error('Error al guardar') }
    },
    async toggleActive(service) {
      try {
        await servicesService.update(service.id, { active: !service.active })
        await this.loadServices()
        useToast().success(service.active ? 'Servicio desactivado' : 'Servicio activado')
      } catch (e) { useToast().error('Error') }
    },
    async deleteService(service) {
      if (!confirm(`¿Eliminar "${service.name}"?`)) return
      try {
        await servicesService.delete(service.id)
        await this.loadServices()
        useToast().success('Servicio eliminado')
      } catch (e) { useToast().error('Error al eliminar') }
    }
  }
}
</script>

<style scoped>
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
.page-title { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
.page-desc { color: var(--text-secondary); font-size: 15px; }
.skeleton-list { display: flex; flex-direction: column; gap: 8px; }

.services-list { display: flex; flex-direction: column; gap: 12px; }
.service-item { display: flex; align-items: center; gap: 16px; padding: 20px; }
.service-color-bar { width: 4px; height: 48px; border-radius: 4px; flex-shrink: 0; }
.service-info { flex: 1; }
.service-info h3 { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
.service-info p { font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; }
.service-meta { display: flex; gap: 12px; font-size: 13px; color: var(--text-tertiary); align-items: center; }
.service-actions { display: flex; gap: 4px; flex-shrink: 0; }

.form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
.form-group { margin-bottom: 16px; min-width: 0; overflow: hidden; }
.form-row .form-group { margin-bottom: 0; }
.color-input { width: 60px; height: 36px; border: none; border-radius: var(--radius-sm); cursor: pointer; }
.modal-title { font-size: 18px; font-weight: 700; margin-bottom: 24px; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; flex-wrap: wrap; }

@media (max-width: 768px) {
  .service-item { flex-direction: column; align-items: flex-start; }
  .service-actions { align-self: flex-end; }
  .modal-actions .btn { flex: 1 1 auto; min-width: 0; padding: 10px 12px; font-size: 13px; }
  .form-row { grid-template-columns: 1fr; }
}
</style>

