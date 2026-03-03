<template>
  <div class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
      <div class="flex gap-2">
         <DatePicker v-model="selectionDate" />
         <Button variant="solid">Sync Data</Button>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="stat in stats" :key="stat.label" class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between mb-2">
           <component :is="stat.icon" :class="stat.iconColor" class="w-5 h-5" />
           <span class="text-xs font-semibold px-2 py-0.5 rounded-full" :class="stat.trendClass">
             {{ stat.trend }}
           </span>
        </div>
        <p class="text-sm font-medium text-gray-500">{{ stat.label }}</p>
        <p class="text-2xl font-bold text-gray-900">{{ stat.value }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Recent Activity / Leads Table -->
      <div class="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div class="p-4 border-b border-gray-50 flex items-center justify-between">
          <h2 class="font-semibold text-gray-900">Recent Leads</h2>
          <router-link to="/leads" class="text-xs font-semibold text-blue-600 hover:text-blue-700">View All</router-link>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-gray-50/50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-50">
                <th class="px-6 py-3">Name</th>
                <th class="px-6 py-3">Source</th>
                <th class="px-6 py-3">Status</th>
                <th class="px-6 py-3">Assigned To</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="lead in recentLeads" :key="lead.name" class="hover:bg-gray-50 transition-colors cursor-pointer group">
                <td class="px-6 py-4 flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 text-xs shadow-sm">
                    {{ lead.initials }}
                  </div>
                  <span class="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{{ lead.name }}</span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">{{ lead.source }}</td>
                <td class="px-6 py-4">
                  <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" :class="lead.statusClass">
                    {{ lead.status }}
                  </span>
                </td>
                <td class="px-6 py-4 flex items-center gap-2">
                   <div class="w-6 h-6 rounded-full bg-gray-200 border border-white"></div>
                   <span class="text-sm text-gray-600">{{ lead.assignedTo }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Actions / Next Events -->
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col space-y-4">
        <h2 class="font-semibold text-gray-900">Upcoming Tasks</h2>
        <div class="space-y-3">
           <div v-for="task in upcomingTasks" :key="task.title" class="p-3 bg-gray-50 rounded-lg flex items-start gap-3 border border-transparent hover:border-blue-100 hover:bg-white hover:shadow-sm transition-all group">
             <div class="mt-1 w-2 h-2 rounded-full flex-shrink-0" :class="task.priorityColor"></div>
             <div class="flex-1 min-w-0">
               <p class="text-sm font-semibold text-gray-900 truncate tracking-tight">{{ task.title }}</p>
               <p class="text-xs text-gray-500 mt-0.5">{{ task.due }}</p>
             </div>
             <button class="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-900 transition-all">
                <MoreHorizontal class="w-4 h-4" />
             </button>
           </div>
        </div>
        <Button class="w-full mt-2" variant="subtle">Create Task</Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { 
  Users, 
  Zap, 
  CheckCircle, 
  ArrowUpRight,
  TrendingUp,
  MoreHorizontal
} from 'lucide-vue-next'
import { Button, DatePicker } from 'frappe-ui'

const selectionDate = ref(new Date())

const stats = [
  { label: 'Total Leads', value: '1,280', icon: Users, iconColor: 'text-blue-600', trend: '+12%', trendClass: 'bg-green-100 text-green-700' },
  { label: 'New Opportunities', value: '45', icon: Zap, iconColor: 'text-amber-600', trend: '+5%', trendClass: 'bg-green-100 text-green-700' },
  { label: 'Deals Closed', value: '28', icon: CheckCircle, iconColor: 'text-green-600', trend: '-2%', trendClass: 'bg-red-100 text-red-700' },
  { label: 'Avg Sale Value', value: '$25,000', icon: TrendingUp, iconColor: 'text-indigo-600', trend: '+8%', trendClass: 'bg-green-100 text-green-700' },
]

const recentLeads = [
  { initials: 'DR', name: 'Dianne Russell', source: 'Website', status: 'Contacted', statusClass: 'bg-blue-100 text-blue-700', assignedTo: 'Faris Ansari' },
  { initials: 'JP', name: 'Jayaprakash P', source: 'Referral', status: 'New', statusClass: 'bg-gray-100 text-gray-700', assignedTo: 'Timeless' },
  { initials: 'BC', name: 'Bessie Cooper', source: 'Social', status: 'Nurture', statusClass: 'bg-amber-100 text-amber-700', assignedTo: 'Ankush Menat' },
  { initials: 'MM', name: 'Marvin McKinney', source: 'Direct', status: 'Qualified', statusClass: 'bg-green-100 text-green-700', assignedTo: 'Suraj Shetty' },
]

const upcomingTasks = [
  { title: 'Call with Bessie Cooper', due: 'Today, 2:00 PM', priorityColor: 'bg-red-500' },
  { title: 'Send contract to Dianne', due: 'Tomorrow, 9:00 AM', priorityColor: 'bg-blue-500' },
  { title: 'Property viewing: Villa Marina', due: 'Thursday, 4:30 PM', priorityColor: 'bg-amber-500' },
]
</script>
