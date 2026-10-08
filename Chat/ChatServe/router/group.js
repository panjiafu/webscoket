import express from "express"
import pool from "../database.js"

const router = express.Router()
router.post('/group', async (req, res) => {
	const {
		arrList
	} = req.body
	//校验
	if (!Array.isArray(arrList) || arrList.length < 2) {
		return res.status(400).json({
			success: false,
			message: '至少需要2个人才能建群'
		})
	}
	//群主
	const ownerid = arrList[0].owner_id
	try {
		const groupSQL = 'INSERT INTO `group` (name,owner_id,status) VALUES (?,?,?)'
		const groupname = `${arrList.length}人群聊`
		const [groupResult] = await pool.execute(groupSQL, [groupname, ownerid, 1])
		//获取自增ID
		const groupId = groupResult.insertId

		// 成员
		const member = arrList.map((user,index)=>{
			return [
				groupId,
				user.id,
				index === 0?1:3,
				new Date().toISOString().slice(0, 19).replace('T', ' '),
				1
			]
		})
		const memberSQL = `INSERT INTO group_member (group_id, user_id, role, join_time, status) VALUES ?`
		await pool.query(memberSQL, [member])
		res.status(200).json({
			success: true,
			message: '建群成功',
			data: {
				groupId, // 返回自增ID
				groupName:`${arrList.length}人群聊`,
				memberCount: arrList.length,
				ownerid
			}
		})
	} catch (e) {
		console.error('建群失败:', e)
		        res.status(500).json({
		            success: false,
		            message: '建群失败，请稍后重试'
		        })
	}
	
})
export default router
