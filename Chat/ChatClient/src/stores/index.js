import {
	createPinia
} from "pinia";
import persistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(persistedstate)

export * from '@/stores/modules/user'
export * from '@/stores/modules/chatList'

export default pinia
