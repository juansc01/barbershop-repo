<template>
  <div class="settings-view">
    <h1 class="page-title">Ajustes</h1>
    <p class="page-desc">Configuración del panel de administración</p>

    <!-- Change PIN -->
    <div class="section">
      <h2 class="section-title">Cambiar PIN de acceso</h2>
      <div class="card settings-card">
        <form @submit.prevent="changePin" class="pin-form">
          <div class="form-group">
            <label class="label">PIN actual</label>
            <input class="input" type="password" v-model="currentPin" placeholder="PIN actual" />
          </div>
          <div class="form-group">
            <label class="label">Nuevo PIN</label>
            <input class="input" type="password" v-model="newPin" placeholder="Nuevo PIN" />
          </div>
          <div class="form-group">
            <label class="label">Confirmar nuevo PIN</label>
            <input class="input" type="password" v-model="confirmPin" placeholder="Confirmar" />
          </div>
          <button class="btn btn-primary" type="submit" :disabled="saving">
            {{ saving ? 'Guardando...' : 'Cambiar PIN' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Google Calendar -->
    <div class="section">
      <h2 class="section-title">Google Calendar</h2>
      <div class="card settings-card">
        <p class="setting-desc">
          Cuando se crea una nueva cita, se abrirá automáticamente Google Calendar para añadirla.
          Asegúrate de tener la sesión iniciada con <strong>nacho.titobarber@gmail.com</strong> en tu navegador.
        </p>
        <div class="form-group">
          <label class="checkbox-item">
            <input type="checkbox" v-model="calendarEnabled" @change="saveCalendarSetting" />
            <span>Añadir citas automáticamente a Google Calendar</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Logout -->
    <div class="section">
      <h2 class="section-title">Sesión</h2>
      <div class="card settings-card">
        <p class="setting-desc">Cerrar sesión del panel de administración.</p>
        <button class="btn btn-danger" @click="logout">Cerrar sesión</button>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../../lib/supabase'
import { useToast } from '../../composables/useToast'

export default {
  name: 'SettingsView',
  data() {
    return {
      currentPin: '',
      newPin: '',
      confirmPin: '',
      saving: false,
      calendarEnabled: localStorage.getItem('gcal_enabled') !== 'false'
    }
  },
  methods: {
    async changePin() {
      if (!this.currentPin || !this.newPin) {
        useToast().error('Completa todos los campos')
        return
      }
      if (this.newPin !== this.confirmPin) {
        useToast().error('Los PINs no coinciden')
        return
      }
      if (this.newPin.length < 4) {
        useToast().error('El PIN debe tener al menos 4 caracteres')
        return
      }

      this.saving = true
      try {
        // Verify current PIN
        const { data } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'admin_pin')
          .single()

        const storedPin = JSON.parse(data.value)
        if (this.currentPin !== storedPin) {
          useToast().error('PIN actual incorrecto')
          this.saving = false
          return
        }

        // Update PIN
        await supabase
          .from('settings')
          .update({ value: JSON.stringify(this.newPin) })
          .eq('key', 'admin_pin')

        useToast().success('PIN cambiado correctamente')
        this.currentPin = ''
        this.newPin = ''
        this.confirmPin = ''
      } catch (e) {
        useToast().error('Error al cambiar PIN')
      }
      this.saving = false
    },
    saveCalendarSetting() {
      localStorage.setItem('gcal_enabled', this.calendarEnabled)
      useToast().success(this.calendarEnabled ? 'Google Calendar activado' : 'Google Calendar desactivado')
    },
    logout() {
      sessionStorage.removeItem('admin_auth')
      this.$router.push('/admin/login')
    }
  }
}
</script>

<style scoped>
.page-title { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
.page-desc { color: var(--text-secondary); font-size: 15px; margin-bottom: 32px; }

.section { margin-bottom: 32px; }
.section-title { font-size: 18px; font-weight: 700; margin-bottom: 12px; }

.settings-card { max-width: 500px; }
.setting-desc { font-size: 14px; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.5; }

.pin-form { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; }

.checkbox-item { display: flex; align-items: center; gap: 10px; font-size: 14px; cursor: pointer; }
.checkbox-item input { width: 16px; height: 16px; accent-color: var(--accent); }
</style>

