<template>
	<div class="profile-page">
		<h2 class="page-title">基本资料</h2>
		<el-form ref="formRef" :model="formData" :rules="rules" label-width="100px" class="profile-form">
			<el-form-item label="用户名" prop="username">
				<el-input v-model="formData.username" placeholder="请输入用户名" />
			</el-form-item>

			<el-form-item label="昵称" prop="nickname">
				<el-input v-model="formData.nickname" placeholder="请输入昵称" />
			</el-form-item>

			<el-form-item label="邮箱" prop="email">
				<el-input v-model="formData.email" placeholder="请输入邮箱" />
			</el-form-item>

			<el-form-item label="手机号" prop="phone">
				<el-input v-model="formData.phone" placeholder="请输入手机号" />
			</el-form-item>

			<el-form-item label="性别" prop="gender">
				<el-radio-group v-model="formData.gender">
					<el-radio value="male">男</el-radio>
					<el-radio value="female">女</el-radio>
					<el-radio value="other">保密</el-radio>
				</el-radio-group>
			</el-form-item>

			<el-form-item label="出生日期" prop="birthday">
				<el-date-picker v-model="formData.birthday" type="date" placeholder="选择出生日期"
					value-format="YYYY-MM-DD" />
			</el-form-item>

			<el-form-item label="个人简介" prop="bio">
				<el-input v-model="formData.bio" type="textarea" :rows="4" placeholder="介绍一下自己..." maxlength="200"
					show-word-limit />
			</el-form-item>

			<el-form-item>
				<el-button type="primary" @click="handleSubmit">保存修改</el-button>
				<el-button @click="handleReset">重置</el-button>
			</el-form-item>
		</el-form>
	</div>
</template>

<script setup>
	import {
		reactive,
		ref
	} from 'vue'
	import {
		ElMessage
	} from 'element-plus'

	const formRef = ref(null)

	const formData = reactive({
		username: 'zhangsan',
		nickname: '张三',
		email: 'zhangsan@example.com',
		phone: '13800138000',
		gender: 'male',
		birthday: '1995-06-15',
		bio: '热爱编程的全栈工程师'
	})

	const rules = {
		username: [{
				required: true,
				message: '请输入用户名',
				trigger: 'blur'
			},
			{
				min: 3,
				max: 20,
				message: '长度在 3 到 20 个字符',
				trigger: 'blur'
			}
		],
		nickname: [{
			required: true,
			message: '请输入昵称',
			trigger: 'blur'
		}],
		email: [{
				required: true,
				message: '请输入邮箱地址',
				trigger: 'blur'
			},
			{
				type: 'email',
				message: '请输入正确的邮箱格式',
				trigger: 'blur'
			}
		],
		phone: [{
			pattern: /^1[3-9]\d{9}$/,
			message: '请输入正确的手机号',
			trigger: 'blur'
		}]
	}

	const handleSubmit = async () => {
		if (!formRef.value) return

		try {
			await formRef.value.validate()
			// 模拟 API 请求
			console.log('提交数据:', formData)
			ElMessage.success('保存成功！')
		} catch (error) {
			console.log(error);

			ElMessage.error('请检查表单信息')
		}
	}

	const handleReset = () => {
		formRef.value?.resetFields()
	}
</script>

<style scoped>
	.profile-page {
		padding: 30px;
		max-width: 600px;
		margin: 0 auto;
	}

	.page-title {
		margin-bottom: 24px;
		color: #303133;
		font-size: 22px;
	}

	.profile-form {
		background: #fff;
		padding: 25px;
		border-radius: 8px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
	}
</style>
