//引入框架
import express from "express"
import userRouter from './router/login.js'
import userRegister from './router/register.js'
import searchuserInfo from './router/searchuserInfo.js'
import userAvatar from './router/avatar.js'
import addFriend from "./router/addFriend.js"
import friendList from "./router/friendList.js"
import messages from "./router/message.js"
import group from "./router/group.js"
import groupList from "./router/groupList.js"
import pool from "./database.js"
import {
	createServer
} from "http"
import cors from 'cors';

//创建实例
const app = express()
const server = createServer(app)
app.use(cors()); // 允许所有跨域请求

//WebSocket
import {
	WebSocketServer,
	WebSocket
} from 'ws'
const wss = new WebSocketServer({
	server
})
// 存储所有连接的客户端
const clients = new Map();
// 储存群聊房间
const rooms = new Map()
wss.on('connection', (ws, req) => {
	// const urlParams = new URL(req.url, 'https://7ick.cn').searchParams
	const urlParams = new URL(req.url, 'http://localhost:3000').searchParams
	const userId = urlParams.get('userId')
	// 保存客户端连接
	clients.set(userId, ws);
	ws.on('message', (message) => {
		const data = JSON.parse(message)

		//处理不同类型的消息
		switch (data.type) {
			case 'send_message':
				// 构造完整的消息对象
				const messageObj = {
					id: data.message.id || Date.now(),
					content: data.message.content,
					send_id: data.fromUserId, // 发送者ID
					user_from_id: data.fromUserId,
					user_to_id: data.toUserId,
					send_at: data.message.send_at || new Date().toISOString(),
					avatar: data.message.avatar || '', // 如果有头像信息
					senderInfo: data.senderInfo
				};
				//转发目标用户
				const ICEtargetClient = clients.get(String(data.toUserId))
				if (ICEtargetClient && ICEtargetClient.readyState === WebSocket.OPEN) {
					ICEtargetClient.send(JSON.stringify({
						type: 'new_message',
						message: messageObj
					}))
				} else {
					console.log('目标用户不在线或连接不可用');
				}
				break
			
			case 'video_call': //发起请求通知
				// console.log(data)
				const call_targetClient = clients.get(String(data.toUserId))
				// console.log(call_targetClient)
				if (call_targetClient && call_targetClient.readyState === WebSocket.OPEN) {
					call_targetClient.send(JSON.stringify({
						type: 'video_call',
						message: data
					}))
				}
				break
			case 'video_accept': //接收
				const accept_targetClient = clients.get(String(data.toUserId))
				if (accept_targetClient && accept_targetClient.readyState === WebSocket.OPEN) {
					accept_targetClient.send(JSON.stringify({
						type: 'video_accept',
						message: data
					}))
				}
				// console.log(data)
				break
			case 'video_reject': //拒绝
				const reject_targetClient = clients.get(String(data.toUserId))
				if (reject_targetClient && reject_targetClient.readyState === WebSocket.OPEN) {
					reject_targetClient.send(JSON.stringify({
						type: 'video_reject',
						message: data
					}))
				}
				break
			case 'video_isTRCcall': //挂断通话
				const isTRCcall_targetClient = clients.get(String(data.tocallUserId))
				if (isTRCcall_targetClient && isTRCcall_targetClient.readyState === WebSocket.OPEN) {
					isTRCcall_targetClient.send(JSON.stringify({
						type: 'video_isTRCcall',
						message: data
					}))
				}
				break
			case 'video_offer': //offer(SDP)
				const offertargetClient = clients.get(String(data.toUserId))
				if (offertargetClient && offertargetClient.readyState === WebSocket.OPEN) {
					offertargetClient.send(JSON.stringify({
						type: 'video_offer',
						message: data
					}))
				}
				break
			case 'video_answer': //Answer(SDP)
				const anwseroffertargetClient = clients.get(String(data.toUserId))
				if (anwseroffertargetClient && anwseroffertargetClient.readyState === WebSocket.OPEN) {
					anwseroffertargetClient.send(JSON.stringify({
						type: 'video_answer',
						message: data
					}))
				}
				break
			case 'video_ice_candidate': //ICE Candidate
				// console.log(data)
				const targetClient = clients.get(String(data.toUserId))
				if (targetClient && targetClient.readyState === WebSocket.OPEN) {
					targetClient.send(JSON.stringify({
						type: 'video_ice_candidate',
						candidate: data.candidate
					}))
				}
				break
				
			// // 群聊相关
			// case 'group_join':
			// handleGroupJoin(data)
			// break
			case 'group_message':
				// 广播给所有群成员
				handleGroupMessage(data)
				break
		}
	})
	//心跳检测
	let heartbeatInterval = setInterval(() => {
		if (ws.readyState === WebSocket.OPEN) {
			ws.ping()
		}
	}, 30000)
	ws.on('pong', () => {
		// 客户端回应心跳
	})
	ws.on('close', () => {
		clients.delete(userId)
		// 从所有房间中移除
		    rooms.forEach((members, roomId) => {
		      members.delete(userId)
		      if (members.size === 0) {
		        rooms.delete(roomId)
		      }
		    })
	})
})

async function handleGroupMessage(data) {
	// console.log('收到群消息:', data)
	const {
		groupId,
		fromUserId,
		message
	} = data
	const roomKey = String(groupId)
	 // 查询群成员
	  const sql = 'SELECT user_id FROM group_member WHERE group_id = ?'
	  const [result] = await pool.execute(sql,[groupId])
	
	    
	    // 创建或获取房间
	    if (!rooms.has(roomKey)) {
	      rooms.set(roomKey, new Set())
	    }
	    const room = rooms.get(roomKey)
	    // 将在线成员加入房间
	    result.forEach(row => {
	      const memberId = String(row.user_id)
	      if (clients.has(memberId)) {
	        room.add(memberId)
	      }
	    })
	broadcastToRoom(roomKey, {
		type: 'group_message',
		groupId: groupId,
		fromUserId: fromUserId,
		message: {
			id: message.id,
			content: message.content,
			send_id: fromUserId,
			username: message.username,
			avatar: message.avatar,
			send_at: message.send_at,
			isSelf: false // 接收方标记为非自己发送
		}
	}, fromUserId)
	  
}
/**
 * 广播消息给房间内所有成员
  RoomId - 房间 ID
 data - 要发送的数据
 excluedUserid - 要排除的用户ID
 */
function broadcastToRoom(roomId, data, excluedUserid) {
	const room = rooms.get(roomId)
	if (!room) return
	room.forEach(memberId => {
		//跳过排除的用户
		if (excluedUserid && memberId === excluedUserid) return
		const client = clients.get(memberId)
		if (client && client.readyState === WebSocket.OPEN) {
			client.send(JSON.stringify(data))
		}
	})
}


// 中间件：解析 JSON 请求体
app.use(express.json())
// 中间件：解析 URL-encoded 格式（表单提交）
app.use(express.urlencoded({
	extended: true
}));

// 静态文件服务（让上传的头像可以被访问）
app.use('/uploads', express.static('uploads'))

//定义路由
//根路由
// app.get('路径'，callback)  req=>请求对象，res=>响应对象
// app.get('/',(req,res)=>{
// 	res.send("Hello Node.js")
// })
//挂载用户实例
app.use('/api', userRouter)
app.use('/api', userRegister)
app.use('/api', searchuserInfo)
app.use('/api', userAvatar)
app.use('/api', addFriend)
app.use('/api', friendList)
app.use('/api', messages)
app.use('/api', group)
app.use('/api', groupList)

//启动服务器
server.listen(3000, () => console.log('Server running at http://localhost:3000'))
// server.listen(3000, '0.0.0.0',() => console.log('Server running at http://localhost:3000'))
