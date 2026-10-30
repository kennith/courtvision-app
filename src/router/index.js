import { createRouter, createWebHistory } from 'vue-router'
import BoardView from '../views/BoardView.vue'
import PlaybookView from '../views/PlaybookView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'board',
      component: BoardView
    },
    {
      path: '/playbook',
      name: 'playbook',
      component: PlaybookView
    }
  ]
})

export default router
