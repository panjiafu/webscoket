import jwt from "jsonwebtoken"
import config from '../config.js'

const authMiddleware = (req, res, next) => {
	// 从请求头获取Token
	//由前端Authorization字段携带
	const authHeader = req.headers.authorization
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({
			code: 401,
			msg: "未提供认证令牌"
		})
	}
	const token = authHeader.split(' ')[1]; // 提取真正的 token 字符串
	try {
		//验证Token
		const decoded = jwt.verify(token, config.JWT_SECRET)
		// 将用户信息挂载到 req 对象上，后续接口可以直接使用
		req.user = decoded; 
		next()
	} catch (error) {
		if (error.name === 'TokenExpiredError') {
		            return res.status(401).json({ code: 401, msg: "令牌已过期，请重新登录" });
		        }
		        return res.status(401).json({ code: 401, msg: "无效的令牌" });
	}
}

export default authMiddleware