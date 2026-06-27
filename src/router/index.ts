import { createRouter, createWebHistory } from 'vue-router'
import ScheduleView from '../views/ScheduleView.vue'
import StatementView from '../views/StatementView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: ScheduleView },
    { path: '/statement', component: StatementView },
  ],
})
