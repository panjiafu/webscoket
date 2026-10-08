import express from 'express'
import pool from '../database.js'
import middleware from '../middleware/middleware.js'
const router = express.Router()

router.post('/addFriend', middleware, async (req, res) => {
	const {
		from_user_id,
		to_user_id,
		created_at,
		status
	} = req.body

	// 检查是否已有未处理的请求
	const checkSQL = `SELECT count(*) as count FROM friend_request 
	                      WHERE ((from_user_id = ? AND to_user_id = ?) 
	                         OR (from_user_id = ? AND to_user_id = ?))
	                        AND status = '0'`
	const [result] = await pool.execute(checkSQL, [from_user_id, to_user_id, to_user_id, from_user_id])

	if (result[0].count > 0) {
		return res.status(200).json({
			code: 200,
			success: false,
			message: '已经存在未处理的好友请求'
		})
	}

	// 插入新的好友请求
	const insertSQL = `INSERT INTO friend_request(from_user_id, to_user_id, created_at, status) 
	                       VALUES (?, ?, ?, ?)`
	const [rows] = await pool.execute(insertSQL, [from_user_id, to_user_id, created_at, status])

	if (rows.affectedRows > 0) {
		res.status(200).json({
			success: true,
			message: '好友请求发送成功'
		})
	} else {
		res.status(500).json({
			success: false,
			message: '好友请求发送失败'
		})
	}
})







export default router
