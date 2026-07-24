import { createWebHistory, createRouter } from "vue-router";

const routes = [
  {
    path: "/",
    name: "Landing",
    component: () => import("../views/LandingPage.vue"),
  },
  {
    path: "/reservar",
    name: "Booking",
    component: () => import("../views/BookingPage.vue"),
  },
  {
    path: "/mis-citas",
    name: "MyAppointments",
    component: () => import("../views/MyAppointmentsPage.vue"),
  },
  {
    path: "/admin/login",
    name: "AdminLogin",
    component: () => import("../views/AdminLoginPage.vue"),
  },
  {
    path: "/admin",
    name: "Admin",
    component: () => import("../views/admin/AdminLayout.vue"),
    meta: { requiresAdmin: true },
    children: [
      {
        path: "",
        name: "AdminDashboard",
        component: () => import("../views/admin/DashboardView.vue"),
      },
      {
        path: "calendario",
        name: "AdminCalendar",
        component: () => import("../views/admin/CalendarView.vue"),
      },
      {
        path: "clientes",
        name: "AdminClients",
        component: () => import("../views/admin/ClientsView.vue"),
      },
      {
        path: "servicios",
        name: "AdminServices",
        component: () => import("../views/admin/ServicesView.vue"),
      },
      {
        path: "peluqueros",
        name: "AdminBarbers",
        component: () => import("../views/admin/BarbersView.vue"),
      },
      {
        path: "horarios",
        name: "AdminSchedule",
        component: () => import("../views/admin/ScheduleView.vue"),
      },
      {
        path: "bloqueos",
        name: "AdminBlocks",
        component: () => import("../views/admin/BlocksView.vue"),
      },
      {
        path: "ingresos",
        name: "AdminRevenue",
        component: () => import("../views/admin/RevenueView.vue"),
      },
      {
        path: "negocio",
        name: "AdminBusiness",
        component: () => import("../views/admin/BusinessView.vue"),
      },
      {
        path: "ajustes",
        name: "AdminSettings",
        component: () => import("../views/admin/SettingsView.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0, behavior: "smooth" };
  },
});

// Auth guard
router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAdmin)) {
    const isAuth = sessionStorage.getItem('admin_auth') === 'true'
    const expiry = parseInt(sessionStorage.getItem('admin_auth_expiry') || '0')
    if (!isAuth || Date.now() > expiry) {
      sessionStorage.removeItem('admin_auth')
      sessionStorage.removeItem('admin_auth_expiry')
      next('/admin/login')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router;
