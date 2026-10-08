import {
	defineStore
} from "pinia";
import {
	ref
} from "vue";

export const useUserStore = defineStore('user', () => {

	const token = ref('')
	const userLoginInfo = ref('')
	const setToken = (newtoken) => {
		token.value = newtoken
		localStorage.setItem('token', newtoken)
	}
	const removeToken = () => {
		localStorage.removeItem('token')
	}
	const setUserInfo = (newvalue) => {
		userLoginInfo.value = newvalue
		localStorage.setItem('userLoginInfo', JSON.stringify(newvalue))
	}
	const getUserInfo = () => {
		return JSON.parse(localStorage.getItem('userLoginInfo'))
	}
	const removeUserInfo = () => {
		localStorage.removeItem('userLoginInfo')
	}
	return {
		token,
		userLoginInfo,
		setToken,
		removeToken,
		setUserInfo,
		getUserInfo,
		removeUserInfo
	}
}, {
	persist: true //开启持久化
})
