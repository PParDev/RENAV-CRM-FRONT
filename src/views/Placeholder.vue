<template>
  <div class="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
    <div class="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100 mb-2">
      <LayoutTemplate class="w-8 h-8" />
    </div>
    <h2 class="text-xl font-bold text-gray-900 leading-tight">{{ $route.meta.title || $route.name }} Module</h2>
    <p class="text-sm text-gray-500 max-w-sm mx-auto">Esta sección está actualmente en desarrollo. Pronto podrás gestionar tus datos de {{ $route.meta.title?.toLowerCase() || 'este módulo' }} desde esta vista.</p>
    <Button variant="solid" @click="$router.push('/')">Volver al Dashboard</Button>
  </div>
</template>

<script setup>
import { LayoutTemplate } from 'lucide-vue-next'
import { Button } from 'frappe-ui'
</script>
