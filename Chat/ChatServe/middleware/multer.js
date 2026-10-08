import express from "express"
import multer from "multer"
import path from "path"
import fs from "fs"


//储存
const diskstorage = multer.diskStorage({
	destination: (req, file, callback) => {
		const dir = 'uploads/avatars/'
		// 检查目录是否存在，不存在则创建
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, {
				recursive: true
			});
		}
		callback(null, dir) //上传目录
	},
	filename: (req, file, callback) => {
		const name = Date.now() + '-' + Math.round(Math.random() * 1E9)
		// path.extname(file.originalname)) 提取原始文件的扩展名（如 .jpg、.png、.pdf）
		callback(null, name + path.extname(file.originalname))
	}
})

const upload = multer({
	storage: diskstorage
})

export default upload
