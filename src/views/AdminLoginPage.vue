<template>
  <div class="admin-login">
    <div class="login-card card">
      <div class="login-icon">🔒</div>
      <h1 class="login-title">Panel de Administración</h1>
      <p class="login-desc">Introduce el PIN de acceso</p>

      <!-- Login form -->
      <form v-if="!showReset" @submit.prevent="login" class="login-form">
        <input
          class="input pin-input"
          v-model="pin"
          type="password"
          placeholder="PIN"
          maxlength="10"
          autocomplete="off"
          required
        />
        <button class="btn btn-primary" type="submit" :disabled="loading">
          {{ loading ? 'Verificando...' : 'Acceder' }}
        </button>
        <button type="button" class="btn btn-ghost btn-sm" @click="showReset = true">
          ¿Olvidaste el PIN?
        </button>
      </form>

      <!-- Reset form -->
      <form v-else @submit.prevent="resetPin" class="login-form">
        <p class="reset-desc">Introduce el email autorizado para resetear el PIN</p>
        <input
          class="input"
          v-model="resetEmail"
          type="email"
          placeholder="Email autorizado"
          required
        />
        <button class="btn btn-primary" type="submit" :disabled="loading">
          {{ loading ? 'Verificando...' : 'Resetear PIN' }}
        </button>
        <button type="button" class="btn btn-ghost btn-sm" @click="showReset = false">
          Volver al login
        </button>
      </form>

      <!-- Reset success -->
      <div v-if="resetSuccess" class="reset-success">
        <p>✅ PIN reseteado correctamente.</p>
        <p>Tu nuevo PIN es: <strong class="new-pin">{{ newPin }}</strong></p>
        <p class="reset-note">Cámbialo desde Ajustes en el panel admin.</p>
      </div>

      <router-link to="/" class="back-home">← Volver al inicio</router-link>
    </div>
  </div>
</template>

<script>
import { supabase } from '../lib/supabase'
import { useToast } from '../composables/useToast'

export default {
  name: 'AdminLoginPage',
  data() {
    return {
      pin: '',
      loading: false,
      showReset: false,
      resetEmail: '',
      resetSuccess: false,
      newPin: ''
    }
  },
  methods: {
    async login() {
      if (!this.pin) return
      this.loading = true
      try {
        const { data } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'admin_pin')
          .single()

        const storedPin = JSON.parse(data.value)
        if (this.pin === storedPin) {
          const expiry = Date.now() + (4 * 60 * 60 * 1000) // 4 hours
          sessionStorage.setItem('admin_auth', 'true')
          sessionStorage.setItem('admin_auth_expiry', String(expiry))
          this.$router.push('/admin')
        } else {
          useToast().error('PIN incorrecto')
        }
      } catch (e) {
        useToast().error('Error de conexión')
      }
      this.loading = false
    },
    async resetPin() {
      if (!this.resetEmail) return
      this.loading = true
      try {
        const { data } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'admin_email')
          .single()

        const authorizedEmail = JSON.parse(data.value)
        if (this.resetEmail.trim().toLowerCase() === authorizedEmail.toLowerCase()) {
          // Generate new PIN
          this.newPin = String(Math.floor(1000 + Math.random() * 9000))
          await supabase
            .from('settings')
            .update({ value: JSON.stringify(this.newPin) })
            .eq('key', 'admin_pin')
          this.resetSuccess = true
          this.showReset = false
        } else {
          useToast().error('Email no autorizado')
        }
      } catch (e) {
        useToast().error('Error al resetear')
      }
      this.loading = false
    }
  }
}
</script>

<style scoped>
.admin-login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: radial-gradient(ellipse at center top, rgba(99, 102, 241, 0.05) 0%, transparent 60%);
}

.login-card {
  max-width: 380px;
  width: 100%;
  text-align: center;
  padding: 40px 32px;
}

.login-icon {
  font-size: 40px;
  margin-bottom: 16px;
}

.login-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
}

.login-desc {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 28px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pin-input {
  text-align: center;
  font-size: 24px;
  letter-spacing: 8px;
  padding: 16px;
}

.reset-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.reset-success {
  margin-top: 20px;
  padding: 16px;
  background: rgba(16, 185, 129, 0.1);
  border-radius: var(--radius-md);
  font-size: 14px;
}

.new-pin {
  font-size: 24px;
  color: var(--accent);
  letter-spacing: 4px;
}

.reset-note {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 8px;
}

.back-home {
  display: inline-block;
  margin-top: 24px;
  font-size: 13px;
  color: var(--text-tertiary);
}

.back-home:hover {
  color: var(--text-primary);
}
</style>

