import express from "express"
import pool from "../database.js"
// token
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import config from '../config.js'


const router = express.Router()
router.post('/register', async (req, res) => {
	try {
		if (req.headers['content-type'] === 'application/json') {
			const {
				username,
				password,
				create_at
			} = req.body
			// 验证
			if (!username || !password) {
				return res.status(400).json({
					code: 400,
					message: '用户名和密码不能为空！'
				})
			}
			//检测用户名是否存在
			const [existing] = await pool.execute('SELECT username FROM user WHERE username = ?', [
				username
			])
			if (existing.length > 0) {
				return res.status(409).json({
					code: 409,
					msg: "用户名已被注册"
				});
			}

			//密码加密
			const saltRound = 10
			const hashedpassword = await bcrypt.hash(password, saltRound)

			// SQL语句 (使用 ? 占位符防止 SQL 注入)
			const sql = "INSERT INTO `user` (username,password,create_at) VALUES (?,?,?)"
			//执行SQL
			const [result] = await pool.execute(sql, [username, hashedpassword, create_at])
			//生成Token
			//jwt.sign({用户信息},密钥,token有效时长)
			const token = jwt.sign({
				username
			}, config.JWT_SECRET, {
				expiresIn: config.JWT_TIMER
			})
			//返回成功响应
			res.status(200).json({
				code: 200,
				message: '注册成功',
				data: result,
				token: token
			})

		} else {
			//返回成功响应
			res.status(201).json({
				code: 201,
				message: '注册失败',
				data: result,
				token: token
			})
		}
	} catch (e) {
		res.status(500).json({
			code: 500,
			msg: "服务器内部错误"
		});
	}
})
export default router
