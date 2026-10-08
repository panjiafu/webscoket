import express from 'express'
import pool from '../database.js'
const router = express.Router()
router.post('/messages',async (req, res) => {
	// console.log(req.body);
	try {
		const {
			user_from_id,
			user_to_id,
			content,
			send_at
		} = req.body
		// 查询session记录(两人是否存在会话)
		const sessionsql = `SELECT *
		  FROM sessions 
		  WHERE (user_from_id = ? AND user_to_id = ?)
		  OR (user_from_id = ? AND user_to_id = ?)`
		const [rows] = await pool.execute(sessionsql, [user_from_id, user_to_id, user_to_id, user_from_id])
		// 
		let sessionID

		// 不存在session记录
		if (rows.length === 0) {
			// 创建双向会话
			const createSessionSql = `
						        INSERT INTO sessions (user_from_id, user_to_id, status, created_at)
						        VALUES (?, ?, '1', ?),
						               (?, ?, '1', ?)
						      `
			const [result] = await pool.execute(createSessionSql, [
				user_from_id, user_to_id, send_at,
				user_to_id, user_from_id, send_at
			])

			// 获取第一条记录的ID作为当前会话ID
			sessionID = result.insertId
		} else {
			//存在session记录，找到发送方对应的会话
			const senderSession = rows.find(row => row.user_from_id === user_from_id)
			sessionID = senderSession ? senderSession.id : rows[0].id
		}

		// 添加messages
		const addMessages = `INSERT INTO messages (session_id,send_id,content,send_at) VALUES (?,?,?,?)`
		const [addMessageResult] = await pool.execute(addMessages, [sessionID, user_from_id, content,
			send_at
		])

		// 查找message记录
		// const messageResult = `SELECT s.*,m.session_id,m.send_id
		// 						FROM sessions s
		// 						LEFT JOIN messages m ON s.id = m.session_id
		// 						WHERE m.send_id = ?`
		const chatHistorySql = `
		  SELECT m.*,u.avatar
		  FROM messages m
		  INNER JOIN sessions s ON m.session_id = s.id
		  LEFT JOIN user u ON m.send_id = u.id
		  WHERE (s.user_from_id = ? AND s.user_to_id = ?)
		     OR (s.user_from_id = ? AND s.user_to_id = ?)
		  ORDER BY m.send_at ASC
		`
		const messageRows = await pool.execute(chatHistorySql, [user_from_id, user_to_id, user_to_id,
			user_from_id
		])
		// console.log(messageRows[0]);

		res.status(200).json({
			success: true,
			msg: messageRows[0]
		})
	} catch (e) {
		console.error('发送消息失败:', e)
		res.status(500).json({
			success: false,
			msg: '消息发送失败',
			error: e.message
		})
	}
})

// 
router.get('/message/user', async (req, res) => {
	try {
		const {
			user_from_id,
			user_to_id
		} = req.query
		const chatHistorySql = `
		  SELECT m.*,u.avatar
		  FROM messages m
		  INNER JOIN sessions s ON m.session_id = s.id
		  LEFT JOIN user u ON m.send_id = u.id
		  WHERE (s.user_from_id = ? AND s.user_to_id = ?)
		     OR (s.user_from_id = ? AND s.user_to_id = ?)
		  ORDER BY m.send_at ASC
		`
		const messageRows = await pool.execute(chatHistorySql, [user_from_id, user_to_id, user_to_id,
			user_from_id
		])
		// console.log(messageRows[0]);/

		res.status(200).json({
			success: true,
			msg: messageRows[0]
		})
	} catch (e) {
		console.error('发送消息失败:', e)
		res.status(500).json({
			success: false,
			msg: '消息发送失败',
			error: e.message
		})
	}
})
export default router
