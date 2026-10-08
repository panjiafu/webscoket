import express from 'express'
import pool from "../database.js"
import middleware from "../middleware/middleware.js"
import upload from "../middleware/multer.js"

const router = express.Router()
router.post('/avatar', upload.single('image'), middleware, async (req, res) => {
	try {
		const path = "http://localhost:3000/" + req.file.path.replace(/^\\$/g, '/')
		// const path = "https://7ick.cn/ChatServe/" + req.file.path.replace(/^\\$/g, '/')
		const {
			id,
			name
		} = req.body
		const sqlUser = 'UPDATE user SET avatar = ? WHERE id = ? AND username = ?'
		const [rows] = await pool.execute(sqlUser, [path, id, name])

		const [sqlUserInfo] = await pool.execute('SELECT * FROM user WHERE username = ?', [name])
		if ([rows].length > 0) {
			res.status(200).json({
				code: 200,
				message: sqlUserInfo
			})
		}
	} catch (e) {
		console.log(e);
		//TODO handle the exception
	}
})

export default router
