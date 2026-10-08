<script setup>
	import {
		ref,
		computed,
		onMounted

	} from 'vue'

	import {
		Search,
		ChatRound,
		Microphone,
		VideoPlay,
		Edit,
		Plus,
		Check,
		Close
	} from '@element-plus/icons-vue'

	import {
		pinyin
	} from 'pinyin-pro'
	import {
		searchuserInfo,
		addFriends,
		addFriendList,
		AcceptRequest,
		RejectRequest,
		List,
		GroupList
	} from '@/api/index'
	import {
		ElMessage
	} from 'element-plus'
	import {
		useUserStore,
		useChatStore
	} from '@/stores/index'
	import {
		useRouter
	} from 'vue-router'

	// 状态管理
	const searchInput = ref('')
	const searchResult = ref(null)
	const isFriend = ref(true)
	const activeCollapse = ref(['friends']) // 默认展开好友分组
	const newFriendRequests = ref([])

	const friends = ref([])
	// const group = ref([])

	const userStore = useUserStore()
	const newFriends = async () => {
		const res = await addFriendList({
			params: {
				user_id: userStore.getUserInfo().id
			}
		})
		newFriendRequests.value = res.data.data
		
	}
	onMounted(async () => {
		newFriends()
		groupLists()
		// 列表
		const res = await List({
			params: {
				user_id: userStore.getUserInfo().id
			}
		})
		friends.value = res.data.data
		// console.log(res.data.data);



	})
	// 
	const numMap = {
		'0': '零',
		'1': '一',
		'2': '二',
		'3': '三',
		'4': '四',
		'5': '五',
		'6': '六',
		'7': '七',
		'8': '八',
		'9': '九',
	}
	// 获取首字母
	const getInitial = (name) => {
		if (!name) return '#'
		const str = String(name).split('').map(item => numMap[item] || item).join('')
		const firstChar = str.charAt(0).toUpperCase()
		if (/[A-Z]/.test(firstChar)) {
			return firstChar
		}
		const py = pinyin(firstChar, {
			pattern: 'first'
		})
		return py ? py.toUpperCase() : '#'
	}

	// 按首字母分组
	const letterGroups = computed(() => {
		const obj = {}
		friends.value.forEach(item => {
			const initial = getInitial(item.username)
			if (!obj[initial]) {
				obj[initial] = []
			}
			obj[initial].push(item)
		})
		return Object.keys(obj)
			.sort()
			.map(key => ({
				letter: key,
				list: obj[key]
			}))
	})

	// 搜索好友
	const userLoginInfo = JSON.parse(localStorage.getItem('userLoginInfo'))
	const searchFriend = async () => {
		if (!searchInput.value.trim()) {
			ElMessage.warning('请输入搜索关键词')
			return
		}
		try {
			const res = await searchuserInfo({
				params: {
					username: searchInput.value,
					user_id: userLoginInfo.id
				}
			})
			searchResult.value = res.data.data
			isFriend.value = res.data.isFriend
		} catch (error) {
			if (error.response?.status === 404) {
				ElMessage.warning('未找到该用户')
			} else if (error.response?.status === 401) {
				ElMessage.error('登录已过期，请重新登录')
			} else {
				ElMessage.error('未找到该用户')
			}
		}
	}

	// 接受好友请求
	const acceptRequest = async (request) => {
		const res = await AcceptRequest({
			obj: request
		})
		ElMessage.success(res.data.message)
		newFriends()

	}

	// 拒绝好友请求
	const rejectRequest = async (request) => {
		const res = await RejectRequest({
			obj: request
		})
		ElMessage.success(res.data.message)
		newFriends()
	}

	// 添加好友
	const addFriend = async (value) => {
		const obj = {
			from_user_id: userLoginInfo.id,
			to_user_id: value.id,
			created_at: new Date().toLocaleString(),
			status: 0
		}
		const res = await addFriends(obj)
		ElMessage.success(res.data.message)

		searchResult.value = null
		searchInput.value = ''
	}

	//groupList
	const group_List = ref([])
	const selectgroupListed = ref(null)
	const groupLists = async ()=>{
		const res = await GroupList({
			params:{user_id:userStore.getUserInfo().id}
		})
		// console.log(res.data.data);
		group_List.value = res.data.data
	}
	const selectgroupList = (item)=>{
selectgroupListed.value = item
	}
	const clickGroup = ()=>{
		useChat.addChat(selectgroupListed.value)
		localStorage.setItem("chatMessage", JSON.stringify(selectgroupListed.value))
		router.push('/ChatMessage')
	}
	// 
	const selectedFriend = ref(null)
	const useChat = useChatStore()
	
	const selectFriend = (friend) => {
	
		selectedFriend.value = friend
		useChat.addChat(friend)
		// 清空搜索结果（如果有的话）
		searchResult.value = null
		selectgroupListed.value = null
	}

	const router = useRouter()
	// 快捷操作
	const sendMessage = (friend) => {
		localStorage.setItem("chatMessage", JSON.stringify(friend))
		router.push('/ChatMessage')

	}

	const voiceCall = (friend) => {
		ElMessage.success(`正在呼叫 ${friend.name}`)
	}

	const videoCall = (friend) => {
		ElMessage.success(`正在发起视频通话 ${friend.name}`)
	}
</script>

<template>
	<el-container class="friend-container">
		<!-- 左侧好友列表 -->
		<el-aside width="280px" class="friend-sidebar">
			<!-- 搜索栏 -->
			<div class="search-section">
				<el-input v-model="searchInput" placeholder="搜索好友" :prefix-icon="Search" clearable
					@keyup.enter="searchFriend">
					<template #append>
						<el-button @click="searchFriend">搜索</el-button>
					</template>
				</el-input>
			</div>

			<!-- 折叠面板 -->
			<el-collapse v-model="activeCollapse" class="friend-collapse">
				<!-- 新的朋友 -->
				<el-collapse-item title="新的朋友" name="newFriends">
					<div class="request-list">
						<div v-for="request in newFriendRequests" :key="request.id" class="request-item">
							<el-avatar :size="40" :src="request.avatar || undefined" icon="User" />
							<div class="request-info">
								<span class="request-name">{{ request.username }}</span>
								<span
									class="request-time">{{ new Date(request.created_at).toLocaleDateString() }}</span>
							</div>
							<div class="request-actions">
								<el-button type="success" circle size="small" @click="acceptRequest(request)">
									<el-icon>
										<Check />
									</el-icon>
								</el-button>
								<el-button type="danger" circle size="small" @click="rejectRequest(request)">
									<el-icon>
										<Close />
									</el-icon>
								</el-button>
							</div>
						</div>
						<el-empty v-if="newFriendRequests.length === 0" description="暂无新朋友请求" />
					</div>
				</el-collapse-item>
				<!-- 群聊 -->
				<el-collapse-item title="群聊" name="group">
					<div class="request-list">
						<div v-for="request in group_List" :key="request.id" class="request-item" @click="selectgroupList(request)">
							<el-avatar :size="40" :src="request.avatar || undefined" icon="User" />
							<div class="request-info">
								<span class="request-name">{{ request.name }}</span>
							</div>
							
						</div>
						<el-empty v-if="group_List.length === 0" description="暂无聊天群" />
					</div>
				</el-collapse-item>

				<!-- 好友列表 -->
				<el-collapse-item title="我的好友" name="friends">
					<div class="friend-groups">
						<div v-for="(group, index) in letterGroups" :key="index" class="letter-group">
							<div class="letter-header">{{ group.letter }}</div>
							<div v-for="friend in group.list" :key="friend.name" class="friend-item"
								@click="selectFriend(friend)">
								<el-avatar :size="36" :src="friend.avatar || undefined" icon="User" />
								<span class="friend-name">{{ friend.username }}</span>
							</div>
						</div>
						<el-empty v-if="letterGroups.length === 0" description="暂无好友" />
					</div>
				</el-collapse-item>
			</el-collapse>
		</el-aside>

		<!-- 右侧主内容区 -->
		<el-main class="friend-main">
			<!-- 搜索结果显示 -->
			<template v-if="searchResult">
				<el-card class="result-card" shadow="hover">
					<template #header>
						<div class="card-header">
							<div class="user-info">
								<el-avatar :size="70" :src="searchResult.avatar || undefined" icon="User" />
								<div class="user-detail">
									<span class="username">{{ searchResult.username }}</span>
									<span class="nickname"> 在线 </span>
								</div>
							</div>
							<el-button v-if="!isFriend" type="primary" :icon="Plus" @click="addFriend(searchResult)">
								添加好友
							</el-button>
						</div>
					</template>

					<template v-if="isFriend">
						<div class="friend-info">
							<div class="info-row">
								<span class="label">备 注</span>
								<el-input v-model="searchResult.username" placeholder="设置备注" :suffix-icon="Edit"
									style="width: 300px" />
							</div>
							<div class="info-row">
								<span class="label">个性签名</span>
								<span class="value">这个人很懒，什么都没有留下~</span>
							</div>
						</div>
					</template>

					<template #footer>
						<div class="action-buttons" v-if="isFriend">
							<el-button type="primary" :icon="ChatRound" @click="sendMessage(searchResult)">
								发消息
							</el-button>
							<el-button type="success" :icon="Microphone" @click="voiceCall(searchResult)">
								语音聊天
							</el-button>
							<el-button type="warning" :icon="VideoPlay" @click="videoCall(searchResult)">
								视频聊天
							</el-button>
						</div>
					</template>
				</el-card>
			</template>
			<!-- 默认欢迎页 / 选中好友详情 -->
			<template v-else>
				<!-- 群 -->
				<el-card v-if="selectgroupListed" class="result-card" shadow="hover">
						<div style="min-height: 300px;display: flex; flex-direction: column; align-items: center; justify-content: center;gap: 20px;">
							<div>
								<el-avatar :size="70" :src="selectgroupListed.avatar || undefined" icon="User" />
							</div>
							<p class="username">{{ selectgroupListed.name }}</p>
							<el-button type="success" @click="clickGroup">进入群聊</el-button>
						</div>
				</el-card>
				<!-- 选中了某个好友 -->
				<el-card v-else-if="selectedFriend" class="result-card" shadow="hover">
					<template #header>
						<div class="card-header">
							<div class="user-info">
								<el-avatar :size="70" :src="selectedFriend.avatar || undefined" icon="User" />
								<div class="user-detail">
									<span class="username">{{ selectedFriend.username }}</span>
									<span class="nickname">在线</span>
								</div>
							</div>
						</div>
					</template>

					<div class="friend-info">
						<div class="info-row">
							<span class="label">备 注</span>
							<el-input v-model="selectedFriend.username" placeholder="设置备注" :suffix-icon="Edit"
								style="width: 300px" />
						</div>
						<div class="info-row">
							<span class="label">个性签名</span>
							<span class="value">这个人很懒，什么都没有留下~</span>
						</div>
					</div>

					<template #footer>
						<div class="action-buttons">
							<el-button type="primary" :icon="ChatRound" @click="sendMessage(selectedFriend)">
								发消息
							</el-button>
							<el-button type="success" :icon="Microphone" @click="voiceCall(selectedFriend)">
								语音聊天
							</el-button>
							<el-button type="warning" :icon="VideoPlay" @click="videoCall(selectedFriend)">
								视频聊天
							</el-button>
						</div>
					</template>
				</el-card>
				<!-- 没有选中任何好友，也没有搜索结果 -->
				<el-empty v-else description="选择一个好友开始聊天" :image-size="200" />
			</template>
		</el-main>
	</el-container>
</template>

<style scoped>
	.friend-container {
		height: 100vh;
		background: #f5f7fa;
	}

	/* 左侧边栏 */
	.friend-sidebar {
		background: #fff;
		border-right: 1px solid #e4e7ed;
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}

	.search-section {
		padding: 12px;
		border-bottom: 1px solid #ebeef5;
	}

	.friend-collapse {
		flex: 1;
		overflow-y: auto;
	}
	.friend-collapse .el-collapse-item{
		padding: 0 10px;
	}

	/* 请求列表 */
	.request-list {
		padding: 8px 0;
	}

	.request-item {
		display: flex;
		align-items: center;
		padding: 8px 16px;
		gap: 12px;
		transition: background 0.2s;
	}

	.request-item:hover {
		background: #f5f7fa;
	}

	.request-info {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.request-name {
		font-weight: 500;
		font-size: 14px;
	}

	.request-time {
		font-size: 12px;
		color: #909399;
	}

	.request-actions {
		display: flex;
		gap: 8px;
	}

	/* 好友分组 */
	.friend-groups {
		padding: 4px 0;
	}

	.letter-group {
		margin-bottom: 4px;
	}

	.letter-header {
		padding: 6px 16px;
		font-size: 13px;
		color: #909399;
		font-weight: 600;
		background: #f5f7fa;
	}

	.friend-item {
		display: flex;
		align-items: center;
		padding: 8px 16px;
		gap: 12px;
		cursor: pointer;
		transition: all 0.2s;
		border-radius: 4px;
		margin: 2px 8px;
	}

	.friend-item:hover {
		background: #ecf5ff;
		transform: translateX(4px);
	}

	.friend-name {
		font-size: 14px;
		color: #303133;
	}

	/* 右侧主内容 */
	.friend-main {
		display: flex;
		justify-content: center;
		align-items: flex-start;
		padding: 24px;
		background: #f5f7fa;
	}

	.result-card {
		width: 520px;
		max-width: 90%;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.user-detail {
		display: flex;
		flex-direction: column;
	}

	.username {
		font-size: 22px;
		font-weight: 600;
		color: #303133;
	}

	.nickname {
		font-size: 14px;
		color: #909399;
		margin-top: 4px;
	}

	.friend-info {
		padding: 8px 0;
	}

	.info-row {
		display: flex;
		align-items: center;
		margin-bottom: 16px;
	}

	.label {
		width: 80px;
		text-align: right;
		margin-right: 16px;
		color: #606266;
		font-size: 14px;
	}

	.value {
		font-size: 14px;
		color: #303133;
	}

	.action-buttons {
		display: flex;
		justify-content: center;
		gap: 16px;
		padding: 8px 0;
	}

	.action-buttons .el-button {
		min-width: 120px;
	}

	/* 滚动条美化 */
	.friend-sidebar::-webkit-scrollbar {
		width: 6px;
	}

	.friend-sidebar::-webkit-scrollbar-thumb {
		background: #c0c4cc;
		border-radius: 3px;
	}

	.friend-sidebar::-webkit-scrollbar-track {
		background: transparent;
	}
</style>
