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
              <a href="https://www.google.com/maps/search/?api=1&query=Calle+San+Adolfo+4+3er+piso" target="_blank" rel="noopener noreferrer" class="contact-text contact-link">Calle San Adolfo, Número 4, 3er piso</a>
            </div>
            <div class="contact-item">
              <a href="https://wa.me/34666999212" target="_blank" rel="noopener noreferrer" class="contact-icon whatsapp-link" title="Abrir chat en WhatsApp">
                <svg class="whatsapp-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
              <a href="https://wa.me/34666999212" target="_blank" rel="noopener noreferrer" class="contact-text contact-link">666 999 212</a>
            </div>
            <div class="contact-item">
              <span class="contact-icon">✉️</span>
              <a href="mailto:nacho.titobarber@gmail.com" class="contact-text contact-link">nacho.titobarber@gmail.com</a>
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

.contact-link {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s;
}

.contact-link:hover {
  color: var(--accent);
}

.whatsapp-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #25d366;
  transition: transform 0.2s, color 0.2s;
}

.whatsapp-link:hover {
  color: #128c7e;
  transform: scale(1.15);
}

.whatsapp-icon {
  width: 22px;
  height: 22px;
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

