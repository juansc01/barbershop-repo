<template>
  <div class="landing">
    <!-- Navbar -->
    <nav class="navbar">
      <div class="container navbar-inner">
        <div class="navbar-brand">
          <span class="logo-icon">✂</span>
          <span class="logo-text">Tito's Barber Shop</span>
        </div>
        <router-link to="/admin" class="btn btn-ghost btn-sm">Panel Admin</router-link>
      </div>
    </nav>

    <!-- Hero -->
    <section class="hero">
      <div class="container hero-content">
        <img src="/favicon.png" alt="Tito's Barber Shop" class="hero-logo" />
        <p class="hero-subtitle">Reserva tu cita en menos de un minuto.</p>
        <div class="hero-buttons">
          <router-link to="/reservar" class="btn btn-primary btn-lg hero-cta">
            Reservar cita
            <span class="arrow">→</span>
          </router-link>
          <router-link to="/mis-citas" class="btn btn-secondary btn-lg">
            Mis citas
          </router-link>
        </div>
      </div>
    </section>

    <!-- Schedule -->
    <section class="schedule-section">
      <div class="container">
        <div class="schedule-card card">
          <h2 class="section-title">Horario</h2>
          <div class="schedule-grid">
            <div class="schedule-row" v-for="day in schedule" :key="day.name">
              <span class="day-name">{{ day.name }}</span>
              <span class="day-hours" :class="{ closed: !day.open }">
                {{ day.open ? day.hours : 'Cerrado' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact -->
    <section class="contact-section">
      <div class="container">
        <div class="contact-card card">
          <h2 class="section-title">Contacto</h2>
          <div class="contact-grid">
            <div class="contact-item">
              <span class="contact-icon">📍</span>
              <span class="contact-text">Dirección por confirmar</span>
            </div>
            <div class="contact-item">
              <span class="contact-icon">📞</span>
              <span class="contact-text">Teléfono por confirmar</span>
            </div>
            <div class="contact-item">
              <span class="contact-icon">✉️</span>
              <span class="contact-text">Email por confirmar</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container footer-inner">
        <span class="footer-text">© {{ new Date().getFullYear() }} Tito's Barber Shop</span>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'LandingPage',
  data() {
    return {
      schedule: [
        { name: 'Lunes', open: true, hours: '09:00 - 15:00' },
        { name: 'Martes', open: true, hours: '09:00 - 15:00' },
        { name: 'Miércoles', open: true, hours: '09:00 - 15:00' },
        { name: 'Jueves', open: true, hours: '09:00 - 15:00' },
        { name: 'Viernes', open: true, hours: '09:00 - 15:00' },
        { name: 'Sábado', open: false, hours: '' },
        { name: 'Domingo', open: false, hours: '' }
      ]
    }
  }
}
</script>

<style scoped>
.landing {
  min-height: 100vh;
}

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(10, 10, 11, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color);
}

.navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 16px;
}

.logo-icon {
  font-size: 20px;
}

.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 100px 24px;
  background: radial-gradient(ellipse at center top, rgba(99, 102, 241, 0.08) 0%, transparent 60%);
}

.hero-content {
  animation: fadeIn 0.8s ease;
}

.hero-logo {
  width: 280px;
  height: auto;
  object-fit: contain;
  margin-bottom: 32px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 100px;
  font-size: 13px;
  color: var(--success);
  margin-bottom: 32px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--success);
  animation: pulse 2s ease infinite;
}

.hero-title {
  font-size: clamp(40px, 8vw, 72px);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin-bottom: 16px;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 18px;
  color: var(--text-secondary);
  margin-bottom: 40px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.hero-cta {
  font-size: 16px;
  padding: 16px 36px;
}

.hero-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.hero-cta .arrow {
  transition: transform 0.2s ease;
}

.hero-cta:hover .arrow {
  transform: translateX(4px);
}

.schedule-section,
.contact-section {
  padding: 40px 0;
}

.schedule-card,
.contact-card {
  max-width: 500px;
  margin: 0 auto;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 24px;
}

.schedule-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.schedule-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
}

.schedule-row:last-child {
  border-bottom: none;
}

.day-name {
  font-weight: 500;
  font-size: 14px;
}

.day-hours {
  font-size: 14px;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.day-hours.closed {
  color: var(--text-tertiary);
}

.contact-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--text-secondary);
}

.contact-icon {
  font-size: 18px;
}

.footer {
  padding: 40px 0;
  border-top: 1px solid var(--border-color);
  margin-top: 60px;
}

.footer-inner {
  text-align: center;
}

.footer-text {
  font-size: 13px;
  color: var(--text-tertiary);
}
</style>

