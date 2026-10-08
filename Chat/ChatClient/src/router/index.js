import {
	createRouter,
	createWebHistory
} from 'vue-router'
import {
	useUserStore
} from '@/stores/index'

const router = createRouter({
	history: createWebHistory(
		import.meta.env.BASE_URL),
	routes: [{
		path: '/login',
		component: () => import('@/views/login/LoginPage.vue')
	},
	{
		path: '/',
		component: () => import('@/views/Layout/LayoutContainer.vue'),
		redirect: '/ChatMessage',
		children: [{
			path: '/ChatMessage',
			component: () => import('@/views/Chat/ChatMessage.vue')
		},
		{
			path: '/FriendList',
			component: () => import('@/views/Friend/FriendList.vue')
		}, {
			path: '/user/basic',
			name: 'BasicProfile',
			component: () => import('@/views/Users/BasicProfile.vue')
		},
		{
			path: '/user/avatar',
			name: 'ChangeAvatar',
			component: () => import('@/views/Users/ChangeAvatar.vue')
		},
		{
			path: '/user/password',
			name: 'ResetPassword',
			component: () => import('@/views/Users/ResetPassword.vue')
		}
		]
	}
	],

})
// 登录拦截访问
router.beforeEach((to) => {
	// const store = useUserStore()
	// //没有Token，且访问非登录的页面，拦截到登录
	// if (!store.token && to.path !== '/login') return '/login'
	const token = localStorage.getItem('token')
	if (!token && to.path !== '/login') return '/login'
	return true

})
export default router
