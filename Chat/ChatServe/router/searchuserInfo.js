import express from 'express'
import pool from "../database.js"
import middleware from "../middleware/middleware.js"

const router = express.Router()
router.get('/searchuserInfo', middleware, async (req, res) => {

	try {
		// console.log(req.query);
		const {
			username,
			user_id
		} = req.query

		const sql = `SELECT * FROM user WHERE username = ?`
		const [rows] = await pool.execute(sql, [username])

		// 检查好友关系
		const sqlFriends = `
		            SELECT COUNT(*) as count 
		            FROM friendships 
		            WHERE user_id = ? AND friend_id = ? AND status IN (0,1,3) 
		        `
		const [friendsResult] = await pool.execute(sqlFriends, [user_id, rows[0].id])
		const isFriend = friendsResult[0].count > 0
		if (rows.length > 0) {
			res.status(200).json({
				code: 200,
				data: rows[0],
				isFriend: Number(user_id) === Number(rows[0].id) ? true : isFriend
			})
		} else {
			res.status(200).json({
				code: 200,
				message: '该用户不存在！'
			})
		}


	} catch (e) {
		//TODO handle the exception
		console.error('获取用户信息失败:', e);
		return res.status(500).json({
			code: 500,
			msg: "服务器内部错误"
		});
	}
})


export default router
