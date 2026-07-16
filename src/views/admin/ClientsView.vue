<template>
  <div class="clients-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">Clientes</h1>
        <p class="page-desc">{{ customers.length }} clientes registrados</p>
      </div>
      <div class="search-box">
        <input class="input" v-model="searchQuery" placeholder="Buscar por nombre, teléfono..." @input="debounceSearch" />
      </div>
    </div>

    <div v-if="loading" class="skeleton-list">
      <div class="skeleton" style="height: 60px" v-for="i in 5" :key="i"></div>
    </div>

    <div v-else-if="filteredCustomers.length === 0" class="empty-card card">
      <p>No se encontraron clientes</p>
    </div>

    <div v-else class="table-container">
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Teléfono</th>
            <th>Email</th>
            <th>Visitas</th>
            <th>Registro</th>
            <th>Notas</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in filteredCustomers" :key="c.id" @click="selectCustomer(c)">
            <td><strong>{{ c.name }}</strong></td>
            <td>{{ c.phone }}</td>
            <td>{{ c.email || '-' }}</td>
            <td><span class="badge badge-info">{{ c.total_visits || 0 }}</span></td>
            <td>{{ formatDate(c.created_at) }}</td>
            <td class="notes-cell">{{ c.notes || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Customer detail modal -->
    <div v-if="selectedCustomer" class="modal-overlay" @click.self="selectedCustomer = null">
      <div class="modal-content">
        <h3 class="modal-title">{{ selectedCustomer.name }}</h3>
        <div class="customer-detail">
          <p><strong>Teléfono:</strong> {{ selectedCustomer.phone }}</p>
          <p><strong>Email:</strong> {{ selectedCustomer.email || 'No registrado' }}</p>
          <p><strong>Visitas:</strong> {{ selectedCustomer.total_visits || 0 }}</p>
          <p><strong>Notas:</strong> {{ selectedCustomer.notes || 'Sin notas' }}</p>
        </div>

        <div class="form-group" style="margin-top: 16px">
          <label class="label">Editar notas</label>
          <textarea class="input" v-model="selectedCustomer.notes" rows="3"></textarea>
        </div>

        <h4 style="margin-top: 20px; margin-bottom: 12px; font-size: 14px; font-weight: 600;">Historial</h4>
        <div v-if="customerHistory.length === 0" class="empty-card card" style="padding: 16px;">
          <p style="font-size: 13px;">Sin historial</p>
        </div>
        <div v-else class="history-list">
          <div v-for="h in customerHistory" :key="h.id" class="history-item">
            <span class="history-date">{{ formatDateTime(h.start_time) }}</span>
            <span class="history-service">{{ h.services?.name }}</span>
            <span class="badge" :class="'badge-' + statusClass(h.status)">{{ h.status }}</span>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-danger btn-sm" @click="deleteCustomer">Eliminar cliente</button>
          <button class="btn btn-secondary" @click="selectedCustomer = null">Cerrar</button>
          <button class="btn btn-primary" @click="saveCustomerNotes">Guardar notas</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { customersService } from '../../services/customersService'
import { useToast } from '../../composables/useToast'

export default {
  name: 'ClientsView',
  data() {
    return {
      loading: true,
      customers: [],
      searchQuery: '',
      selectedCustomer: null,
      customerHistory: [],
      searchTimeout: null
    }
  },
  computed: {
    filteredCustomers() {
      if (!this.searchQuery) return this.customers
      const q = this.searchQuery.toLowerCase()
      return this.customers.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.email?.toLowerCase().includes(q)
      )
    }
  },
  async mounted() {
    await this.loadCustomers()
  },
  methods: {
    async loadCustomers() {
      this.loading = true
      try {
        this.customers = await customersService.getAll()
      } catch (e) {
        useToast().error('Error al cargar clientes')
      }
      this.loading = false
    },
    async selectCustomer(c) {
      this.selectedCustomer = { ...c }
      try {
        this.customerHistory = await customersService.getHistory(c.id)
      } catch (e) {
        this.customerHistory = []
      }
    },
    async saveCustomerNotes() {
      try {
        await customersService.update(this.selectedCustomer.id, { notes: this.selectedCustomer.notes })
        const idx = this.customers.findIndex(c => c.id === this.selectedCustomer.id)
        if (idx >= 0) this.customers[idx].notes = this.selectedCustomer.notes
        useToast().success('Notas guardadas')
        this.selectedCustomer = null
      } catch (e) {
        useToast().error('Error al guardar')
      }
    },
    async deleteCustomer() {
      if (!confirm(`¿Eliminar a "${this.selectedCustomer.name}"? Esta acción no se puede deshacer.`)) return
      try {
        await customersService.delete(this.selectedCustomer.id)
        this.customers = this.customers.filter(c => c.id !== this.selectedCustomer.id)
        this.selectedCustomer = null
        useToast().success('Cliente eliminado')
      } catch (e) {
        useToast().error('Error al eliminar. Puede tener citas asociadas.')
      }
    },
    debounceSearch() {
      clearTimeout(this.searchTimeout)
      this.searchTimeout = setTimeout(() => {}, 300)
    },
    formatDate(dt) {
      return new Date(dt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    },
    formatDateTime(dt) {
      return new Date(dt).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    },
    statusClass(status) {
      const map = { confirmed: 'info', completed: 'success', cancelled: 'danger', no_show: 'warning' }
      return map[status] || 'info'
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

.page-title { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
.page-desc { color: var(--text-secondary); font-size: 15px; }

.search-box { min-width: 250px; }

.skeleton-list { display: flex; flex-direction: column; gap: 8px; }
.empty-card { text-align: center; padding: 32px; color: var(--text-secondary); font-size: 14px; }
.notes-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.customer-detail p { font-size: 14px; margin-bottom: 8px; color: var(--text-secondary); }
.customer-detail strong { color: var(--text-primary); }

.history-list { display: flex; flex-direction: column; gap: 8px; }
.history-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px; background: var(--bg-tertiary); border-radius: var(--radius-sm); font-size: 13px;
}
.history-date { color: var(--text-tertiary); min-width: 100px; }
.history-service { flex: 1; }

.modal-title { font-size: 18px; font-weight: 700; margin-bottom: 16px; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }

tr { cursor: pointer; }
</style>

