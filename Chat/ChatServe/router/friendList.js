import express from "express"
import pool from "../database.js"

const router = express.Router()

//获取请求信息
router.get('/addfriendList', async (req, res) => {
	const {
		user_id
	} = req.query
	const sql = `
	    SELECT fr.*, u.username, u.avatar, u.nickname 
	    FROM friend_request fr
	    LEFT JOIN user u ON fr.from_user_id = u.id
	    WHERE fr.to_user_id = ? AND fr.status = 0
	`
	try {
		const [rows] = await pool.execute(sql, [user_id])
		res.status(200).json({
			success: true,
			data: rows
		})
	} catch (error) {
		console.error('查询好友请求失败:', error)
		res.status(500).json({
			success: false,
			message: '服务器内部错误'
		})
	}
})
//同意请求
router.post('/acceptRequest', async (req, res) => {
	try {
		const {
			obj
		} = req.body
		// 更新好友请求状态为已接受（1）
		const SQLFriendRequest =
			`UPDATE friend_request SET status = ? WHERE from_user_id = ? AND to_user_id = ?`;
		const [updateResult] = await pool.execute(SQLFriendRequest, [1, obj.from_user_id, obj.to_user_id]);
		// 检查是否有行被更新
		if (updateResult.affectedRows === 0) {
			return res.status(404).json({
				message: '未找到对应的好友请求'
			});
		}
		// 添加两条记录（双向关系）
		const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

		const SQLAddFriend =
			`INSERT INTO friendships(user_id, friend_id, status, created_at) VALUES (?, ?, ?, ?)`
		const paramas1 = [obj.from_user_id, obj.to_user_id, 1, now]
		const paramas2 = [obj.to_user_id, obj.from_user_id, 1, now]

		const [insertResult1] = await pool.execute(SQLAddFriend, paramas1);
		const [insertResult2] = await pool.execute(SQLAddFriend, paramas2);
		if (insertResult1.affectedRows > 0 && insertResult2.affectedRows > 0) {
			res.status(200).json({
				message: '添加成功'
			})
		} else {
			res.status(500).json({
				code: 500,
				msg: "服务器内部错误"
			});
		}

	} catch (e) {
		console.error('获取用户信息失败:', e);
		//TODO handle the exception
	}
})
//拒绝请求
router.post('/rejectRequest', async (req, res) => {
	try {
		const {
			obj
		} = req.body
		// 更新好友请求状态为已拒绝（2）
		const SQLFriendRequest =
			`UPDATE friend_request SET status = ? WHERE from_user_id = ? AND to_user_id = ?`;
		const [updateResult] = await pool.execute(SQLFriendRequest, [2, obj.from_user_id, obj.to_user_id]);
		console.log(updateResult);
		// 检查是否有行被更新
		if (updateResult.affectedRows === 1) {
			return res.status(200).json({
				message: '已拒绝好友请求'
			})
		} else {
			res.status(500).json({
				code: 500,
				msg: "服务器内部错误"
			});
		}

	} catch (e) {
		console.error('获取用户信息失败:', e);
		//TODO handle the exception
	}
})
//好友列表
router.get('/List', async (req, res) => {
	try {
		const {
			user_id
		} = req.query
		// SELECT 
		//   fs.*,        -- friendships 表的所有字段（可根据需求精简）
		//   u.username,  -- 好友的用户名
		//   u.avatar     -- 好友的头像
		// FROM friendships fs
		// -- 关联 user 表：friendships 的 friend_id 对应 user 的 id
		// INNER JOIN user u ON fs.friend_id = u.id
		// -- 筛选条件：friendships 的 user_id 为目标用户（如从 req.query 获取的 user_id）
		// WHERE fs.user_id = ?;
		const sql = `SELECT fs.*,u.id,u.username,u.avatar 
		FROM friendships fs
		LEFT JOIN user u ON fs.friend_id = u.id
		WHERE fs.user_id = ? `
		const [rows] = await pool.execute(sql, [user_id])
		// console.log(rows);

		res.status(200).json({
			success: true,
			data: rows
		})
	} catch (e) {
		console.error('查询好友请求失败:', e)
		res.status(500).json({
			success: false,
			message: '服务器内部错误'
		})
	}

})
export default router
