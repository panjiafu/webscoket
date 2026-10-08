import express from "express"
import pool from "../database.js"

const router = express.Router()
router.get('/grouplist', async (req, res) => {
	// console.log(req.query);
	const {
		user_id
	} = req.query
	const selectSQL =
		'SELECT g.* , gm.role,gm.user_id FROM `group` g JOIN group_member gm  ON g.id = gm.group_id WHERE gm.user_id = ? AND gm.status = 1 AND g.status = 1'
		const [resultrows] = await pool.execute(selectSQL,[user_id])
		
	res.status(200).json({
		success: '成功',
		data:resultrows
	})
})

//GroupMessage 获取群消息
router.post('/group/messages',async (req,res)=>{
	const { group_id, user_id } = req.body
	const selectSQL = 'SELECT gm.*,u.* from `group_message` gm JOIN `user` u ON u.id = gm.sender_id WHERE gm.group_id = ? ORDER BY gm.send_at ASC'
	const [resultRows] = await pool.execute(selectSQL,[group_id])
	res.status(200).json({
		success:'成功',
		msg:resultRows
	})
})

//发送消息SendGroupMessage
router.post('/group/send',async (req,res)=>{
	// console.log(req.body);
	const {group_id,user_id,content,send_at} = req.body
	try{
		const selectSQL = 'INSERT INTO group_message (group_id,sender_id,content,send_at) VALUES (?,?,?,?)'
		const [resultRows] = await pool.execute(selectSQL,[group_id,user_id,content,send_at])
		res.status(200).json({
			success:'成功',
			data:resultRows
		})
	}catch(e){
		//TODO handle the exception
		console.log(e); 
	}
	
})

export default router
