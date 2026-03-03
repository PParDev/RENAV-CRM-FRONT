import './index.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { FrappeUI, setConfig } from 'frappe-ui'
import App from './App.vue'

const routes = [
    {
        path: '/',
        name: 'Layout',
        component: () => import('./components/Layout.vue'),
        children: [
            {
                path: '',
                name: 'Dashboard',
                component: () => import('./views/Dashboard.vue'),
            },
            {
                path: 'leads',
                name: 'Leads',
                component: () => import('./views/Placeholder.vue'),
                meta: { title: 'Leads' }
            },
            {
                path: 'contacts',
                name: 'Contacts',
                component: () => import('./views/Placeholder.vue'),
                meta: { title: 'Contacts' }
            },
            {
                path: 'properties',
                name: 'Properties',
                component: () => import('./views/Placeholder.vue'),
                meta: { title: 'Properties' }
            },
            {
                path: 'opportunities',
                name: 'Opportunities',
                component: () => import('./views/Placeholder.vue'),
                meta: { title: 'Opportunities' }
            },
            {
                path: 'account',
                name: 'Account',
                component: () => import('./views/Placeholder.vue'),
                meta: { title: 'Account' }
            },
            {
                path: 'invoices',
                name: 'Invoices',
                component: () => import('./views/Placeholder.vue'),
                meta: { title: 'Invoices' }
            },
            {
                path: 'tasks',
                name: 'Tasks',
                component: () => import('./views/Placeholder.vue'),
                meta: { title: 'Tasks' }
            },
            {
                path: 'meetings',
                name: 'Meetings',
                component: () => import('./views/Placeholder.vue'),
                meta: { title: 'Meetings' }
            },
            {
                path: 'calls',
                name: 'Calls',
                component: () => import('./views/Placeholder.vue'),
                meta: { title: 'Calls' }
            },
            {
                path: 'emails',
                name: 'Emails',
                component: () => import('./views/Placeholder.vue'),
                meta: { title: 'Emails' }
            },
            {
                path: 'email-templates',
                name: 'EmailTemplates',
                component: () => import('./views/Placeholder.vue'),
                meta: { title: 'Email Templates' }
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

const pinia = createPinia()
const app = createApp(App)

// Mock fetcher for frontend-only demo
setConfig('resourceFetcher', async (args) => {
    console.log('Mock API call:', args)
    return {}
})

app.use(pinia)
app.use(router)
app.use(FrappeUI)

app.mount('#app')
