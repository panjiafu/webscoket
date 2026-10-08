import {
	defineStore
} from "pinia"
import {
	ref,
	watch
} from 'vue'

export const useChatStore = defineStore('chat', () => {
	// 
	const ToList = ref(null)
	//是否存在chatlist,
	// 空值判断
	const localNull = () => {
		const localnull = localStorage.getItem("chatlist")
		if (!localnull) return []
		const pased = JSON.parse(localnull)
		return Array.isArray(pased) ? pased : []
	}

	const chatList = ref(localNull())
	// 只要 chatList 发生变化，自动保存到 LocalStorage
	watch(chatList, (newvalue) => {
		localStorage.setItem("chatlist", JSON.stringify(newvalue))
	}, {
		deep: true
	})
	const addChat = (newvalue) => {
		// //去重
		if (chatList.value.some(item => item.id === newvalue.id)) return
		// chatList.value = [...chatList.value, newvalue]
		chatList.value.unshift(newvalue)
	}
	// 清空
	const clearChat = () => {
		chatList.value = []
		localStorage.removeItem('chatList')
	}
	return {
		ToList,
		chatList,
		addChat,
		clearChat
	}
},{
	persist:true
})
