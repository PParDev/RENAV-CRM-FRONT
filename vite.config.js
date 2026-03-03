import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import path from 'path'
import frappeui from 'frappe-ui/vite'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        vueJsx(),
        frappeui({
            frappeProxy: false,
            lucideIcons: true,
            jinjaBootData: false,
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    optimizeDeps: {
        include: [
            'feather-icons',
            'interactjs',
            'prosemirror-state',
            'prosemirror-view',
            'lowlight',
            'debug'
        ],
    },
})
