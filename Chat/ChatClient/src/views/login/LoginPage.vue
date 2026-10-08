<script setup>
	import {
		ref,
		watch
	} from 'vue'
	import {
		User,
		Lock
	} from '@element-plus/icons-vue'
	import {
		userRegister,
		userLogin
	} from '@/api/index'
	import {
		ElMessage
	} from 'element-plus'
	import {
		useRouter
	} from 'vue-router'
	import {
		useUserStore
	} from "@/stores/index";
	const isRestiger = ref(true)
	const isToggle = () => {
		isRestiger.value = !isRestiger.value
	}
	const RegisterFrom = ref()
	const LoginFrom = ref()
	const RegRulesFrom = ref({
		username: '',
		password: '',
		repassword: ''
	})
	const LoginRulesFrom = ref({
		username: '',
		password: '',
	})

	// 登录校验
	const LoginRules = {
		username: [{
				required: true,
				message: '请输入用户名',
				trigger: 'blur'
			},
			{
				min: 1,
				max: 6,
				message: '请输入1-6位数的字符',
				trigger: 'blur'
			}
		],
		password: [{
				required: true,
				message: '请输入密码',
				trigger: 'blur'
			},
			{
				pattern: /^\S{6,15}$/,
				message: '请输入6-15位数的非空字符',
				trigger: 'blur'
			}
		],

	}
	//注册校验
	const RegRules = {
		...LoginRules,
		repassword: [{
				required: true,
				message: '请再次输入密码确认',
				trigger: 'blur'
			},
			{
				pattern: /^\S{6,15}$/,
				message: '请输入6-15位数的非空字符',
				trigger: 'blur'
			},
			{
				validator: (rule, value, callback) => {
					if (value !== RegRulesFrom.value.password) {
						callback(new Error('两次密码输入不一致！'))
					} else {
						callback()
					}
				},
				trigger: 'blur'
			}
		]
	}

	//userRegiter
	const userRegiter = async () => {
		//进行校验 校验成功，发送请求，失败=>消息提示
		await RegisterFrom.value.validate()
		console.log(RegRulesFrom.value);
		const obj = {
			username: RegRulesFrom.value.username,
			password: RegRulesFrom.value.password,
			create_at: new Date().toLocaleString()
		}
		//注册接口
		const res = await userRegister(obj)
		ElMessage.success(res.data.message)
		isRestiger.value = false
	}
	// UserLoginer
	const router = useRouter()
	const userStore = useUserStore()
	const UserLoginer = async () => {
		//进行校验 校验成功，发送请求，失败=>消息提示
		await LoginFrom.value.validate()
		const res = await userLogin(LoginRulesFrom.value)
// console.log(res.data.data);

		userStore.setToken(res.data.data.token, res.data.data.data)
		userStore.setUserInfo(res.data.data.data)

		ElMessage.success(res.data.message)
		router.push('/')

	}

	watch(isRestiger, () => {
		RegRulesFrom.value = {
			username: '',
			password: '',
			repassword: ''
		};
		LoginRulesFrom.value = {
			username: '',
			password: '',
		}
	})
</script>
<template>
	<el-row justify="center" align="middle" class="login-row">
		<!-- 左侧图片 -->
		<el-col :xs="0" :sm="0" :md="12" :lg="12" class="left-banner">
		</el-col>

		<!-- 右侧登录表单 -->
		<el-col :xs="24" :sm="24" :md="12" :lg="12" class="form-col">
			<!-- ------------------------------------------登录-------------------- -->
			<el-form ref="LoginFrom" :model="LoginRulesFrom" :rules="LoginRules" label-width="50px" v-if="isRestiger">
				<el-form-item>
					<h1>登录</h1>
				</el-form-item>
				<el-form-item prop="username">
					<el-input v-model="LoginRulesFrom.username" :prefix-icon="User" placeholder="请输入用户名" />
				</el-form-item>
				<el-form-item prop="password">
					<el-input v-model="LoginRulesFrom.password" :prefix-icon="Lock" placeholder="请输入密码" />
				</el-form-item>
				<el-form-item>
					<div style="width:100%;display: flex;justify-content: space-between;align-items: center;">
						<el-checkbox>
							记住我
						</el-checkbox>
						<el-link type="primary" underline="never">忘记密码？</el-link>
					</div>
				</el-form-item>
				<el-form-item>
					<el-button @click="UserLoginer" type="primary" style="width: 100%;">登录</el-button>
				</el-form-item>
				<el-form-item>
					<el-link underline="never" @click="isToggle()">注册 →</el-link>
				</el-form-item>
			</el-form>
			<!-- -----------------------------注册------------------------------ -->
			<el-form ref="RegisterFrom" :model="RegRulesFrom" :rules="RegRules" label-width="50px" v-else>
				<el-form-item>
					<h1>注册</h1>
				</el-form-item>
				<el-form-item prop="username">
					<el-input v-model="RegRulesFrom.username" :prefix-icon="User" placeholder="请输入用户名" />
				</el-form-item>
				<el-form-item prop="password">
					<el-input v-model="RegRulesFrom.password" :prefix-icon="Lock" placeholder="请输入密码" />
				</el-form-item>
				<el-form-item prop="repassword">
					<el-input v-model="RegRulesFrom.repassword" :prefix-icon="Lock" placeholder="请再次确认密码" />
				</el-form-item>
				<el-form-item>
					<el-button @click="userRegiter" type="primary" style="width: 100%;">注册</el-button>
				</el-form-item>
				<el-form-item>
					<el-link underline="never" @click="isToggle()">← 返回</el-link>
				</el-form-item>
			</el-form>
		</el-col>
	</el-row>
</template>
<style scoped>
	.login-row {
		height: 100%;
	}

	/* 左侧背景图 */
	.left-banner {
		height: 100%;
		background: url('../../../public/assets/05.png') no-repeat center center;
		background-size: cover;
	}

	/* 右侧表单 */
	.form-col {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
	}
</style>
