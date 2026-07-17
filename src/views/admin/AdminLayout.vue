<template>
  <div class="admin-layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-header">
        <span class="sidebar-logo">✂</span>
        <span class="sidebar-title">Tito's Admin</span>
      </div>
      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: $route.path === item.path }"
          @click="sidebarOpen = false"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <router-link to="/" class="nav-item">
          <span class="nav-icon">🏠</span>
          <span class="nav-label">Volver a la web</span>
        </router-link>
      </div>
    </aside>

    <!-- Mobile header -->
    <header class="mobile-header">
      <button class="hamburger" @click="sidebarOpen = !sidebarOpen">☰</button>
      <span class="mobile-title">{{ currentTitle }}</span>
    </header>

    <!-- Overlay -->
    <div class="sidebar-overlay" v-if="sidebarOpen" @click="sidebarOpen = false"></div>

    <!-- Main content -->
    <main class="admin-main">
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: 'AdminLayout',
  data() {
    return {
      sidebarOpen: false,
      navItems: [
        { path: '/admin', icon: '📊', label: 'Dashboard' },
        { path: '/admin/calendario', icon: '📅', label: 'Calendario' },
        { path: '/admin/clientes', icon: '👥', label: 'Clientes' },
        { path: '/admin/servicios', icon: '💇', label: 'Servicios' },
        { path: '/admin/peluqueros', icon: '✂️', label: 'Peluqueros' },
        { path: '/admin/horarios', icon: '🕐', label: 'Horarios' },
        { path: '/admin/bloqueos', icon: '🚫', label: 'Bloqueos' },
        { path: '/admin/negocio', icon: '🏪', label: 'Mi Negocio' },
        { path: '/admin/ajustes', icon: '⚙️', label: 'Ajustes' }
      ]
    }
  },
  computed: {
    currentTitle() {
      const item = this.navItems.find(i => i.path === this.$route.path)
      return item ? item.label : 'Admin'
    }
  }
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 200;
  transition: transform 0.3s ease;
}

.sidebar-header {
  padding: 20px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-logo {
  font-size: 20px;
}

.sidebar-title {
  font-weight: 700;
  font-size: 15px;
}

.sidebar-nav {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-secondary);
  transition: var(--transition);
  text-decoration: none;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--accent-light);
  color: var(--accent);
}

.nav-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid var(--border-color);
}

.admin-main {
  flex: 1;
  margin-left: 240px;
  padding: 32px;
  min-height: 100vh;
}

.mobile-header {
  display: none;
}

.sidebar-overlay {
  display: none;
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 199;
  }

  .admin-main {
    margin-left: 0;
    padding: 80px 16px 24px;
  }

  .mobile-header {
    display: flex;
    align-items: center;
    gap: 12px;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 56px;
    padding: 0 16px;
    background: rgba(10, 10, 11, 0.9);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border-color);
    z-index: 100;
  }

  .hamburger {
    background: none;
    border: none;
    color: var(--text-primary);
    font-size: 20px;
    padding: 8px;
  }

  .mobile-title {
    font-weight: 600;
    font-size: 15px;
  }
}
</style>

