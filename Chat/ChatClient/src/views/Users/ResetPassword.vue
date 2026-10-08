<template>
	<div class="password-page">
		<h2 class="page-title">重置密码</h2>

		<el-form ref="formRef" :model="formData" :rules="rules" label-width="120px" class="password-form" status-icon>
			<el-form-item label="当前密码" prop="oldPassword">
				<el-input v-model="formData.oldPassword" type="password" placeholder="请输入当前密码" show-password />
			</el-form-item>

			<el-form-item label="新密码" prop="newPassword">
				<el-input v-model="formData.newPassword" type="password" placeholder="请输入新密码" show-password />
				<div class="password-strength" v-if="formData.newPassword">
					<div class="strength-bar">
						<div class="strength-fill"
							:style="{ width: strengthPercent + '%', backgroundColor: strengthColor }"></div>
					</div>
					<span class="strength-text">{{ strengthText }}</span>
				</div>
			</el-form-item>

			<el-form-item label="确认密码" prop="confirmPassword">
				<el-input v-model="formData.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
			</el-form-item>

			<el-form-item>
				<el-divider content-position="left">密码要求</el-divider>
				<ul class="password-rules">
					<li :class="{ passed: hasMinLength }">至少 8 个字符</li>
					<li :class="{ passed: hasUpperCase }">包含大写字母</li>
					<li :class="{ passed: hasLowerCase }">包含小写字母</li>
					<li :class="{ passed: hasNumber }">包含数字</li>
					<li :class="{ passed: hasSpecialChar }">包含特殊字符 (@$!%*?&)</li>
				</ul>
			</el-form-item>

			<el-form-item>
				<el-button type="primary" size="large" @click="handleSubmit" :loading="loading">
					确认修改
				</el-button>
				<el-button size="large" @click="handleReset">清空</el-button>
			</el-form-item>
		</el-form>
	</div>
</template>

<script setup>
	import {
		reactive,
		ref,
		computed
	} from 'vue'
	import {
		ElMessage,
		ElMessageBox
	} from 'element-plus'

	const formRef = ref(null)
	const loading = ref(false)

	const formData = reactive({
		oldPassword: '',
		newPassword: '',
		confirmPassword: ''
	})

	// 密码强度计算
	const hasMinLength = computed(() => formData.newPassword.length >= 8)
	const hasUpperCase = computed(() => /[A-Z]/.test(formData.newPassword))
	const hasLowerCase = computed(() => /[a-z]/.test(formData.newPassword))
	const hasNumber = computed(() => /\d/.test(formData.newPassword))
	const hasSpecialChar = computed(() => /[@$!%*?&]/.test(formData.newPassword))

	const strengthScore = computed(() => {
		let score = 0
		if (hasMinLength.value) score += 20
		if (hasUpperCase.value) score += 20
		if (hasLowerCase.value) score += 20
		if (hasNumber.value) score += 20
		if (hasSpecialChar.value) score += 20
		return score
	})

	const strengthPercent = computed(() => strengthScore.value)
	const strengthColor = computed(() => {
		if (strengthScore.value <= 40) return '#f56c6c'
		if (strengthScore.value <= 80) return '#e6a23c'
		return '#67c23a'
	})
	const strengthText = computed(() => {
		if (strengthScore.value <= 20) return '弱'
		if (strengthScore.value <= 60) return '中'
		if (strengthScore.value <= 90) return '强'
		return '非常强'
	})

	// 验证规则
	const validatePass = (rule, value, callback) => {
		if (value === '') {
			callback(new Error('请再次输入密码'))
		} else if (value !== formData.newPassword) {
			callback(new Error('两次输入密码不一致!'))
		} else {
			callback()
		}
	}

	const rules = {
		oldPassword: [{
				required: true,
				message: '请输入当前密码',
				trigger: 'blur'
			},
			{
				min: 6,
				message: '密码长度至少为 6 位',
				trigger: 'blur'
			}
		],
		newPassword: [{
				required: true,
				message: '请输入新密码',
				trigger: 'blur'
			},
			{
				min: 8,
				message: '密码长度至少为 8 位',
				trigger: 'blur'
			},
			{
				validator: (rule, value, callback) => {
					if (value && value === formData.oldPassword) {
						callback(new Error('新密码不能与当前密码相同'))
					} else {
						callback()
					}
				},
				trigger: 'blur'
			}
		],
		confirmPassword: [{
				required: true,
				message: '请再次输入新密码',
				trigger: 'blur'
			},
			{
				validator: validatePass,
				trigger: 'blur'
			}
		]
	}

	const handleSubmit = async () => {
		if (!formRef.value) return

		try {
			await formRef.value.validate()

			// 二次确认
			await ElMessageBox.confirm(
				'确定要修改密码吗？修改后需要重新登录。',
				'确认修改', {
					confirmButtonText: '确定',
					cancelButtonText: '取消',
					type: 'warning'
				}
			)

			loading.value = true

			// 模拟 API 请求
			setTimeout(() => {
				console.log('提交数据:', {
					oldPassword: formData.oldPassword,
					newPassword: formData.newPassword
				})

				loading.value = false
				ElMessage.success('密码修改成功！请重新登录')

				// 清空表单
				formRef.value?.resetFields()
			}, 1500)

		} catch (error) {
			if (error === 'cancel') return
			loading.value = false
			ElMessage.error('请检查表单信息')
		}
	}

	const handleReset = () => {
		formRef.value?.resetFields()
	}
</script>

<style scoped>
	.password-page {
		padding: 30px;
		max-width: 550px;
		margin: 0 auto;
	}

	.page-title {
		margin-bottom: 24px;
		color: #303133;
		font-size: 22px;
	}

	.password-form {
		background: #fff;
		padding: 25px 35px 25px 25px;
		border-radius: 8px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
	}

	.password-strength {
		margin-top: 8px;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.strength-bar {
		width: 140px;
		height: 6px;
		background-color: #ebeef5;
		border-radius: 3px;
		overflow: hidden;
	}

	.strength-fill {
		height: 100%;
		border-radius: 3px;
		transition: all 0.3s;
	}

	.strength-text {
		font-size: 12px;
		color: #909399;
	}

	.password-rules {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.password-rules li {
		position: relative;
		padding-left: 20px;
		margin-bottom: 6px;
		font-size: 13px;
		color: #909399;
		line-height: 1.6;
	}

	.password-rules li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		width: 12px;
		height: 12px;
		border: 2px solid #dcdfe6;
		border-radius: 50%;
		transition: all 0.3s;
	}

	.password-rules li.passed {
		color: #67c23a;
	}

	.password-rules li.passed::before {
		background-color: #67c23a;
		border-color: #67c23a;
	}

	.password-rules li.passed::after {
		content: '';
		position: absolute;
		left: 4px;
		top: 44%;
		transform: translateY(-50%) rotate(45deg);
		width: 4px;
		height: 8px;
		border: solid #fff;
		border-width: 0 2px 2px 0;
	}
</style>
