import axios from "axios";
import {
	useUserStore
} from '@/stores/index'
const instance = axios.create({
	// baseURL: 'http://localhost:3000',
	baseURL:'/api',
	timeout: 5000
})
// 请求拦截器
instance.interceptors.request.use(config => {
	// const store = useUserStore()

	// if (store.token) {
	//     config.headers.Authorization = "Bearer " + store.token
	// }
	const token = localStorage.getItem('token')
	if (token) {
		config.headers.Authorization = "Bearer " + token
	}
	return config
}, error => {
	return Promise.reject(error)
})

// 响应拦截器
instance.interceptors.response.use(config => {
	return config
}, error => {
	return Promise.reject(error)
})

export default instance
