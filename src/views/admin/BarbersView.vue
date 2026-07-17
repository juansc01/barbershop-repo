<template>
  <div class="barbers-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">Peluqueros</h1>
        <p class="page-desc">Gestiona el equipo</p>
      </div>
      <button class="btn btn-primary" @click="openCreate">+ Nuevo peluquero</button>
    </div>

    <div v-if="loading" class="skeleton-list">
      <div class="skeleton" style="height: 80px" v-for="i in 2" :key="i"></div>
    </div>

    <div v-else class="barbers-list">
      <div v-for="barber in barbers" :key="barber.id" class="barber-item card">
        <div v-if="isValidUrl(barber.photo_url)" class="barber-avatar-img">
          <img :src="barber.photo_url" alt="" />
        </div>
        <div v-else class="barber-avatar" :style="{ background: barber.color }">
          {{ barber.name.charAt(0) }}
        </div>
        <div class="barber-info">
          <h3>{{ barber.name }}</h3>
          <p>{{ barber.bio || 'Sin biografía' }}</p>
          <div class="barber-meta">
            <span class="badge" :class="barber.active ? 'badge-success' : 'badge-danger'">
              {{ barber.active ? 'Activo' : 'Inactivo' }}
            </span>
            <span class="meta-text">{{ barber.barber_services?.length || 0 }} servicios</span>
          </div>
        </div>
        <div class="barber-actions">
          <button class="btn btn-ghost btn-sm" @click="toggleActive(barber)">
            {{ barber.active ? 'Desactivar' : 'Activar' }}
          </button>
          <button class="btn btn-ghost btn-sm" @click="openEdit(barber)">Editar</button>
          <button class="btn btn-ghost btn-sm" style="color: var(--danger)" @click="deleteBarber(barber)">Eliminar</button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <h3 class="modal-title">{{ editing ? 'Editar peluquero' : 'Nuevo peluquero' }}</h3>
        <div class="form-group">
          <label class="label">Nombre</label>
          <input class="input" v-model="form.name" placeholder="Nombre" />
        </div>
        <div class="form-group">
          <label class="label">Biografía</label>
          <textarea class="input" v-model="form.bio" rows="2" placeholder="Descripción breve"></textarea>
        </div>
        <div class="form-group">
          <label class="label">Foto</label>
          <div class="photo-upload">
            <div v-if="form.photoPreview || isValidUrl(form.photo_url)" class="photo-preview">
              <img :src="form.photoPreview || form.photo_url" alt="Foto" />
            </div>
            <div v-else class="photo-placeholder" :style="{ background: form.color }">
              {{ form.name ? form.name.charAt(0) : '?' }}
            </div>
            <div class="photo-actions">
              <label class="btn btn-secondary btn-sm upload-btn">
                Subir foto
                <input type="file" accept="image/*" @change="handlePhotoUpload" hidden />
              </label>
              <button v-if="form.photo_url" type="button" class="btn btn-ghost btn-sm" @click="removePhoto">Quitar</button>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label class="label">Teléfono</label>
          <input class="input" v-model="form.phone" placeholder="Teléfono" />
        </div>
        <div class="form-group">
          <label class="label">Email</label>
          <input class="input" v-model="form.email" placeholder="Email" />
        </div>
        <div class="form-group">
          <label class="label">Color</label>
          <input type="color" v-model="form.color" class="color-input" />
        </div>
        <div class="form-group">
          <label class="label">Servicios</label>
          <div class="services-checkboxes">
            <label v-for="s in allServices" :key="s.id" class="checkbox-item">
              <input type="checkbox" :value="s.id" v-model="form.serviceIds" />
              <span>{{ s.name }}</span>
            </label>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="saveBarber" :disabled="saving">
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { barbersService } from '../../services/barbersService'
import { servicesService } from '../../services/servicesService'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../composables/useToast'

export default {
  name: 'BarbersView',
  data() {
    return {
      loading: true,
      barbers: [],
      allServices: [],
      showModal: false,
      editing: null,
      saving: false,
      form: { name: '', bio: '', phone: '', email: '', color: '#6366f1', serviceIds: [], photo_url: '', photoPreview: '', photoFile: null }
    }
  },
  async mounted() {
    await this.loadData()
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const [barbers, services] = await Promise.all([
          barbersService.getAll(),
          servicesService.getAll()
        ])
        this.barbers = barbers
        this.allServices = services
      } catch (e) { useToast().error('Error al cargar') }
      this.loading = false
    },
    openCreate() {
      this.editing = null
      this.form = { name: '', bio: '', phone: '', email: '', color: '#6366f1', serviceIds: [], photo_url: '', photoPreview: '', photoFile: null }
      this.showModal = true
    },
    openEdit(barber) {
      this.editing = barber
      this.form = {
        name: barber.name,
        bio: barber.bio || '',
        phone: barber.phone || '',
        email: barber.email || '',
        color: barber.color || '#6366f1',
        serviceIds: (barber.barber_services || []).map(bs => bs.service_id),
        photo_url: barber.photo_url || '',
        photoPreview: '',
        photoFile: null
      }
      this.showModal = true
    },
    async saveBarber() {
      if (!this.form.name) { useToast().error('El nombre es obligatorio'); return }
      if (this.saving) return
      this.saving = true
      try {
        // Upload photo if new file selected
        let photoUrl = this.form.photo_url
        if (this.form.photoFile) {
          photoUrl = await this.uploadPhoto(this.form.photoFile)
        }

        const { serviceIds, photoPreview, photoFile, ...barberData } = this.form
        barberData.photo_url = photoUrl

        if (this.editing) {
          await barbersService.update(this.editing.id, barberData)
          await barbersService.assignServices(this.editing.id, serviceIds)
          useToast().success('Peluquero actualizado')
        } else {
          const newBarber = await barbersService.create(barberData)
          await barbersService.assignServices(newBarber.id, serviceIds)
          // Create default working hours for the new barber (Mon-Fri 09:00-15:00)
          await this.createDefaultHours(newBarber.id)
          useToast().success('Peluquero creado')
        }
        this.showModal = false
        await this.loadData()
      } catch (e) { useToast().error('Error al guardar') }
      this.saving = false
    },
    async createDefaultHours(barberId) {
      const hours = []
      for (let i = 0; i < 7; i++) {
        hours.push({
          barber_id: barberId,
          day_of_week: i,
          start_time: '09:00',
          end_time: '15:00',
          is_working: i < 5 // Mon-Fri working, Sat-Sun closed
        })
      }
      await supabase.from('working_hours').insert(hours)
    },
    async toggleActive(barber) {
      try {
        await barbersService.update(barber.id, { active: !barber.active })
        await this.loadData()
        useToast().success(barber.active ? 'Desactivado' : 'Activado')
      } catch (e) { useToast().error('Error') }
    },
    async deleteBarber(barber) {
      if (!confirm(`¿Eliminar "${barber.name}"?`)) return
      try {
        await barbersService.delete(barber.id)
        await this.loadData()
        useToast().success('Peluquero eliminado')
      } catch (e) { useToast().error('Error al eliminar') }
    },
    handlePhotoUpload(event) {
      const file = event.target.files[0]
      if (!file) return
      if (file.size > 2 * 1024 * 1024) {
        useToast().error('La imagen no puede superar 2MB')
        return
      }
      this.form.photoFile = file
      this.form.photoPreview = URL.createObjectURL(file)
    },
    async uploadPhoto(file) {
      // Compress and resize image before storing as base64
      return await this.compressImage(file, 200, 0.7)
    },
    compressImage(file, maxSize, quality) {
      return new Promise((resolve) => {
        const img = new Image()
        const reader = new FileReader()
        reader.onload = (e) => {
          img.onload = () => {
            const canvas = document.createElement('canvas')
            let width = img.width
            let height = img.height
            // Resize to max 200x200 (avatar size)
            if (width > height) {
              if (width > maxSize) { height = (height * maxSize) / width; width = maxSize }
            } else {
              if (height > maxSize) { width = (width * maxSize) / height; height = maxSize }
            }
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0, width, height)
            resolve(canvas.toDataURL('image/jpeg', quality))
          }
          img.src = e.target.result
        }
        reader.readAsDataURL(file)
      })
    },
    fileToDataUrl(file) {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.readAsDataURL(file)
      })
    },
    removePhoto() {
      this.form.photo_url = ''
      this.form.photoPreview = ''
      this.form.photoFile = null
    },
    isValidUrl(url) {
      if (!url) return false
      return url.startsWith('http') || url.startsWith('data:')
    }
  }
}
</script>

<style scoped>
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
.page-title { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
.page-desc { color: var(--text-secondary); font-size: 15px; }
.skeleton-list { display: flex; flex-direction: column; gap: 8px; }

.barbers-list { display: flex; flex-direction: column; gap: 12px; }
.barber-item { display: flex; align-items: center; gap: 16px; padding: 20px; }
.barber-avatar { width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; color: white; flex-shrink: 0; }
.barber-avatar-img { width: 52px; height: 52px; border-radius: 50%; overflow: hidden; flex-shrink: 0; }
.barber-avatar-img img { width: 100%; height: 100%; object-fit: cover; }
.barber-info { flex: 1; }
.barber-info h3 { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
.barber-info p { font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; }
.barber-meta { display: flex; gap: 12px; align-items: center; }
.meta-text { font-size: 12px; color: var(--text-tertiary); }
.barber-actions { display: flex; gap: 4px; flex-shrink: 0; }

.form-group { margin-bottom: 16px; }
.color-input { width: 60px; height: 36px; border: none; border-radius: var(--radius-sm); cursor: pointer; }
.services-checkboxes { display: flex; flex-direction: column; gap: 8px; }
.checkbox-item { display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; }
.checkbox-item input { width: 16px; height: 16px; accent-color: var(--accent); }

.photo-upload { display: flex; align-items: center; gap: 16px; }
.photo-preview { width: 64px; height: 64px; border-radius: 50%; overflow: hidden; flex-shrink: 0; }
.photo-preview img { width: 100%; height: 100%; object-fit: cover; }
.photo-placeholder { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; color: white; flex-shrink: 0; }
.photo-actions { display: flex; flex-direction: column; gap: 6px; }
.upload-btn { cursor: pointer; }
.modal-title { font-size: 18px; font-weight: 700; margin-bottom: 24px; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; flex-wrap: wrap; }

@media (max-width: 768px) {
  .barber-item { flex-direction: column; align-items: flex-start; }
  .barber-actions { align-self: flex-end; }
  .modal-actions .btn { flex: 1 1 auto; min-width: 0; padding: 10px 12px; font-size: 13px; }
}
</style>

