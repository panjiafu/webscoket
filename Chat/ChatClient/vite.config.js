import {
	fileURLToPath,
	URL
} from 'node:url'

import {
	defineConfig
} from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import {
	ElementPlusResolver
} from 'unplugin-vue-components/resolvers'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		vueDevTools(),
		// ...
		AutoImport({
			resolvers: [ElementPlusResolver()],
		}),
		Components({
			resolvers: [ElementPlusResolver()],
		}),
	],
	// 代理
	// // 跨域
	// server: {
	// 	port: 5317,
	// 	proxy: {
	// 		'/socket': { //代理路径前缀（自定义）
	// 			target: 'http://localhost:3000',
	// 			changeOrigin: true,
	// 			// 或者直接代理所有请求：'/'
	// 			//  rewrite:(path)=>path.replace(/^\/socket/,'')

	// 		}
	// 	}
	// },
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src',
				import.meta.url))
		},
	},
})
