import express from "express"
import pool from "../database.js"

import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import config from '../config.js'

const router = express.Router()
router.post('/login', async (req, res) => {
	try {
		const {
			username,
			password
		} = req.body
		if (!username && !password) {
			return res.status(400).json({
				code: 400,
				msg: "请输入用户名和密码"
			});
		}
		// 1. 查找用户
		const [rows] = await pool.execute(
			"SELECT  * FROM `user` WHERE username = ?",
			[username]
		);
		if (rows.length === 0) {
			return res.status(401).json({
				code: 401,
				msg: "用户名或密码错误"
			});
		}

		//比较密码
		const isMatch = await bcrypt.compare(password, rows[0].password)
		if (!isMatch) {
			return res.status(401).json({
				code: 401,
				msg: "用户名或密码错误"
			});
		}
		// 生成token
		//jwt.sign({用户信息},密钥,token有效时长)
		const token = jwt.sign({
			username
		}, config.JWT_SECRET, {
			expiresIn: config.JWT_TIMER
		})
		// 4. 返回 Token
		res.status(200).json({
			code: 200,
			message: "登录成功",
			data: {
				data: rows[0],
				token: token
			}
		});
	} catch (e) {
		//TODO handle the exception
		// console.log(e);
		res.status(500).json({
			code: 500,
			msg: "服务器内部错误"
		});
	}
})

export default router
