<template>
  <div class="flex h-screen w-screen overflow-hidden bg-white">
    <!-- Sidebar -->
    <div
      class="flex flex-col h-full bg-gray-50 border-r border-gray-100 transition-all duration-300 ease-in-out"
      :class="isSidebarCollapsed ? 'w-16' : 'w-64'"
    >
      <!-- Logo / Header -->
      <div class="flex items-center gap-3 p-4 border-b border-gray-100">
        <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
          P
        </div>
        <span v-if="!isSidebarCollapsed" class="font-semibold text-gray-900 truncate">Prolink</span>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        <router-link
          v-for="item in menuItems"
          :key="item.name"
          :to="item.to"
          class="flex items-center gap-3 p-2 rounded-lg transition-colors group relative"
          :class="[
            $route.name === item.name 
              ? 'bg-white text-blue-600 border border-gray-200 shadow-sm' 
              : 'text-gray-600 hover:bg-white hover:text-gray-900 border border-transparent'
          ]"
        >
          <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
          <span v-if="!isSidebarCollapsed" class="text-sm font-medium">{{ item.label }}</span>
          
          <!-- Tooltip for collapsed sidebar -->
          <div v-if="isSidebarCollapsed" class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
            {{ item.label }}
          </div>
        </router-link>
      </nav>

      <!-- Sidebar Footer -->
      <div class="p-2 border-t border-gray-100 space-y-1">
         <button
          @click="isSidebarCollapsed = !isSidebarCollapsed"
          class="flex items-center gap-3 p-2 w-full text-left rounded-lg text-gray-500 hover:bg-white hover:text-gray-900 transition-colors"
        >
          <Menu class="w-5 h-5 flex-shrink-0" />
          <span v-if="!isSidebarCollapsed" class="text-sm font-medium">Colapsar</span>
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0 bg-white">
      <!-- Topbar -->
      <header class="h-16 flex items-center justify-between px-6 border-b border-gray-100 flex-shrink-0">
        <div class="flex items-center gap-4">
          <nav class="flex items-center text-sm font-medium text-gray-500 gap-2">
             <span class="hover:text-gray-900 cursor-pointer">CRM</span>
             <ChevronRight class="w-4 h-4" />
             <span class="text-gray-900">{{ currentRouteTitle }}</span>
          </nav>
        </div>
        <div class="flex items-center gap-4">
          <button class="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-colors relative">
            <Bell class="w-5 h-5" />
            <span class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
            PB
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-auto p-6 bg-gray-50/30 custom-scrollbar">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { 
  LayoutDashboard, 
  Users, 
  Contact, 
  Home, 
  Zap, 
  UserCircle, 
  FileText, 
  CheckSquare, 
  Calendar, 
  Phone, 
  Mail, 
  LayoutTemplate,
  ChevronRight,
  Bell,
  Menu
} from 'lucide-vue-next'

const route = useRoute()
const isSidebarCollapsed = ref(false)

const currentRouteTitle = computed(() => route.meta.title || route.name)

const menuItems = [
  { name: 'Dashboard', label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { name: 'Leads', label: 'Leads', to: '/leads', icon: Users },
  { name: 'Contacts', label: 'Contacts', to: '/contacts', icon: Contact },
  { name: 'Properties', label: 'Properties', to: '/properties', icon: Home },
  { name: 'Opportunities', label: 'Opportunities', to: '/opportunities', icon: Zap },
  { name: 'Account', label: 'Account', to: '/account', icon: UserCircle },
  { name: 'Invoices', label: 'Invoices', to: '/invoices', icon: FileText },
  { name: 'Tasks', label: 'Tasks', to: '/tasks', icon: CheckSquare },
  { name: 'Meetings', label: 'Meetings', to: '/meetings', icon: Calendar },
  { name: 'Calls', label: 'Calls', to: '/calls', icon: Phone },
  { name: 'Emails', label: 'Emails', to: '/emails', icon: Mail },
  { name: 'EmailTemplates', label: 'Email Templates', to: '/email-templates', icon: LayoutTemplate },
]
</script>

<style>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #E5E7EB;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #D1D5DB;
}
</style>
