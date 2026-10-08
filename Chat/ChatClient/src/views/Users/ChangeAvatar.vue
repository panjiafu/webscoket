<template>
	<div class="avatar-page">
		<h2 class="page-title">更换头像</h2>

		<div class="avatar-container">
			<!-- 当前头像预览 -->
			<div class="current-avatar-wrapper">
				<div class="label">当前头像</div>
				<el-avatar :size="120" :src="currentAvatar" shape="circle">
					<img src="../../../public/assets/05.png" alt="默认头像" />
				</el-avatar>
			</div>

			<!-- 上传区域 -->
			<div class="upload-section">
				<div class="label">选择新头像</div>

				<!-- 方式一：从预设头像中选择 -->
				<div class="preset-avatars">
					<p class="sub-label">推荐头像</p>
					<div class="avatar-grid">
						<div v-for="(avatar, index) in presetAvatars" :key="index" class="avatar-option"
							:class="{ active: selectedPreset === index }" @click="selectPreset(index)">
							<el-avatar :size="60" :src="avatar" shape="circle" />
						</div>
					</div>
				</div>

				<!-- 方式二：本地上传 -->
				<div class="upload-local">
					<p class="sub-label">本地上传</p>
					<el-upload ref="uploadRef" action="#" :auto-upload="false" :show-file-list="false"
						:on-change="handleFileChange" accept="image/*">
						<el-button type="primary" plain>
							<el-icon style="margin-right: 6px">
								<Upload />
							</el-icon>
							选择本地图片
						</el-button>
						<template #tip>
							<div class="el-upload__tip">
								支持 JPG/PNG/GIF 格式，文件大小不超过 5MB
							</div>
						</template>
					</el-upload>
				</div>
			</div>

			<!-- 操作按钮 -->
			<div class="action-buttons">
				<el-button type="primary" size="large" @click="handleSave">
					保存头像
				</el-button>
				<el-button size="large" @click="handleCancel">取消</el-button>
			</div>
		</div>
	</div>
</template>

<script setup>
	import {
		ref
	} from 'vue'
	import {
		ElMessage
	} from 'element-plus'
	import {
		Upload
	} from '@element-plus/icons-vue'
	import {
		userAvatar
	} from "@/api"
	import {
		useUserStore
	} from '@/stores/index'
	const currentAvatar = ref('')
	const selectedPreset = ref(-1)
	const newAvatar = ref(null)

	// 预设头像列表
	const presetAvatars = [
		'/assets/01.png',
		'/assets/02.png',
		'/assets/03.png',
		'/assets/04.png',
		'/assets/05.png',
		'/assets/06.png',
	]

	const selectPreset = (index) => {
		selectedPreset.value = index
		currentAvatar.value = presetAvatars[index]
		newAvatar.value = null
	}

	const handleFileChange = (file) => {
		const isImage = file.raw.type.startsWith('image/')
		const isLt5M = file.raw.size / 1024 / 1024 < 5

		if (!isImage) {
			ElMessage.error('只能上传图片文件！')
			return false
		}
		if (!isLt5M) {
			ElMessage.error('图片大小不能超过 5MB！')
			return false
		}

		// 创建本地预览 URL
		newAvatar.value = file.raw
		currentAvatar.value = URL.createObjectURL(file.raw)
		selectedPreset.value = -1
		ElMessage.success('图片上传成功，点击保存即可生效')
	}

	const userStore = useUserStore()
	// 显示新的头像
	currentAvatar.value = userStore.getUserInfo().avatar
	const handleSave = async () => {
		const response = await fetch(currentAvatar.value)
		const blob = await response.blob()
		const file = new File([blob], 'avatar.png', {
			type: blob.type || 'image/png'
		})

		const formData = new FormData()
		formData.append('image', file)
		formData.append('id', JSON.parse(localStorage.getItem('userLoginInfo')).id)
		formData.append('name', JSON.parse(localStorage.getItem('userLoginInfo')).username)
		const res = await userAvatar(formData)
		ElMessage.success('头像更新成功！')
		// console.log(res.data.message[0]);
		userStore.setUserInfo(res.data.message[0])
	}

	const handleCancel = () => {
		// 恢复到之前的状态
		currentAvatar.value = userStore.getUserInfo().avatar
		selectedPreset.value = -1
		newAvatar.value = null
		ElMessage.info('已取消修改')
	}
</script>

<style scoped>
	.avatar-page {
		padding: 30px;
		max-width: 700px;
		margin: 0 auto;
	}

	.page-title {
		margin-bottom: 28px;
		color: #303133;
		font-size: 22px;
	}

	.avatar-container {
		background: #fff;
		padding: 32px;
		border-radius: 8px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
	}

	.current-avatar-wrapper,
	.upload-section {
		margin-bottom: 28px;
	}

	.label {
		font-size: 14px;
		color: #606266;
		margin-bottom: 12px;
		font-weight: 500;
	}

	.sub-label {
		font-size: 13px;
		color: #909399;
		margin-bottom: 10px;
	}

	.avatar-grid {
		display: flex;
		gap: 16px;
		flex-wrap: wrap;
		margin-bottom: 20px;
	}

	.avatar-option {
		cursor: pointer;
		border: 3px solid transparent;
		border-radius: 50%;
		padding: 4px;
		transition: all 0.2s;
	}

	.avatar-option:hover {
		border-color: #409eff;
		opacity: 0.8;
	}

	.avatar-option.active {
		border-color: #409eff;
		box-shadow: 0 0 0 2px #409eff40;
	}

	.action-buttons {
		display: flex;
		gap: 12px;
		margin-top: 26px;
	}
</style>
