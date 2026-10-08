<script setup>
	import {
		User,
		ChatRound
	} from '@element-plus/icons-vue'
	import {
		ref
	} from 'vue'
	import {
		useUserStore
	} from '@/stores/index'
	const squareUrl = ref('')
	const userInfo = useUserStore()
	// const useChat = useChatStore()
	squareUrl.value = userInfo.getUserInfo().avatar
	const Exit=()=>{
		// useChat.clearChat()
		userInfo.removeToken()
		userInfo.removeUserInfo()
		// localStorage.removeItem('chatMessage')
		
	}
</script>
<template>
	<div class="common-layout">
		<el-container>
			<!-- 左侧菜单 -->
			<el-aside width="120px">
				<el-avatar shape="square" :size="50" :src="squareUrl" />
				<el-menu active-text-color="#ffd04b" background-color="#545c64" text-color="#fff" router
					default-active="/ChatMessage">
					<el-menu-item index="/ChatMessage">
						<el-icon>
							<ChatRound />
						</el-icon>
					</el-menu-item>
					<el-menu-item index="/FriendList">
						<el-icon>
							<User />
						</el-icon>
					</el-menu-item>
					<el-sub-menu index="4">
						<template #title>个人中心</template>
						<el-menu-item index="/user/basic">基本资料</el-menu-item>
						<el-menu-item index="/user/avatar">更换头像</el-menu-item>
						<el-menu-item index="/user/password">重置密码</el-menu-item>
						<el-menu-item index="/login" @click="Exit()">退出登录</el-menu-item>
					</el-sub-menu>
				</el-menu>
			</el-aside>
			<!-- 右侧整体 -->
			<!-- <el-container> -->
			<RouterView></RouterView>
			<!-- </el-container> -->
		</el-container>
	</div>
</template>


<style scoped>
	* {
		margin: 0;
		padding: 0;
	}

	.common-layout,
	.el-container,
	.el-aside {
		height: 100%;
	}

	.el-aside {
		height: 100%;
		padding: 0 !important;
		overflow: hidden;
	}

	.el-aside:first-of-type {
		background-color: #545c64;
		padding: 0;
		overflow: hidden;
	}

	.el-aside:first-of-type .el-avatar {
		display: block;
		margin: 30px auto 16px;
	}

	.el-menu {
		height: 100%;
		border-right: none;
	}

	.el-aside:first-of-type .el-menu-item,
	.el-aside:first-of-type .el-sub-menu__title {
		text-align: center;
		justify-content: center;
	}

	.el-menu-item {
		padding: 20px;
	}


	/* 右侧 aside */
	/* Main（关键） */
</style>
