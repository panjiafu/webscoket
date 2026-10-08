<script setup>
	import {
		Search,
		ChatRound,
		Box,
		Folder,
		Scissor,
		Microphone,
		VideoPlay,
		PhoneFilled,
		Headset,
		MoreFilled,
		CirclePlus,
		CircleClose
	} from '@element-plus/icons-vue'
	import {
		ElBadge,
		ElMessage
	} from 'element-plus'
	import {
		ref,
		onMounted,
		onUnmounted,
		watch,
		nextTick
	} from 'vue'
	import {
		useChatStore,
		useUserStore
	} from '@/stores/index'
	import {
		Messages,
		MessagesUser,
		searchuserInfo,
		List,
		Group,
		GroupMessages,
		SendGroupMessage
	} from '@/api/index'
	const inputText = ref('')

	const chatlist = ref([])
	const useChat = useChatStore()
	const userStore = useUserStore()


	// 消息数据
	const Listmessages = ref([])
	const unreadCount = ref({}) // { [好友id]: 数量 }
	const isRTC = ref(true)

	const localVideo = ref(null)
	const remoteVideo = ref(null)
	// socket
	const caller = ref(false) //发送方
	const called = ref(false) //接收方
	const calling = ref(false) //呼叫中
	const mediaStream = ref(null)
	const pendingCallFrom = ref(null)

	const peer = ref(null)

	// 通话时间
	const currentTimer = ref("00:00")
	let callTimer = null
	const callcurrentTimer = ref(null)

	// 
	const ToList = ref(false)

	// ========== 群聊视频状态（新增） ==========
	const currentGroupType = ref('private') // 'private' | 'group'
	// const peers = ref(new Map()) // userId -> RTCPeerConnection
	// const remoteStreams = ref(new Map()) // userId -> MediaStream
	// const groupCallRoom = ref(null) // 当前群聊房间 ID
	// const groupCallMembers = ref([]) // 房间内成员列表
	// 群消息缓存
	const groupMessages = ref({})

	//开始
	const startCallTimer = () => {
		callcurrentTimer.value = Date.now()
		callTimer = setInterval(() => {
			const elpased = Math.floor((Date.now() - callcurrentTimer.value) / 1000)
			const minutes = String(Math.floor(elpased / 60)).padStart(2, '0')
			const seconds = String(elpased % 60).padStart(2, '0')
			currentTimer.value = `${minutes}:${seconds}`
		}, 1000)
	}
	//停止
	const stopCallTimer = () => {
		if (callTimer) {
			clearInterval(callTimer)
			callTimer = null
		}
		currentTimer.value = '00:00'
	}
	// 
	const callId = ref(null) //发起方Id
	//
	onMounted(async () => {
		chatlist.value = useChat.chatList

		// 初始化 WebSocket 连接
		await initWebSocket()

		//
		const chat = JSON.parse(localStorage.getItem('chatMessage'))
		if (!chat) return
		if (chat) {
			ListData(chat)
		}

	})
	//
	// 组件销毁时清理
	onUnmounted(() => {
		if (ws) {
			ws.close(1000, '组件卸载')
			ws = null
		}
	})
	//websocket
	let ws = null
	const ws_URL = 'wss://7ick.cn/ws'
	// const ws_URL = 'ws://localhost:3000'
	//初始化webSocket 
	const initWebSocket = () => {
		const userId = userStore.getUserInfo().id
		//如果已有链接则关闭
		if (ws) {
			ws.close()
		}
		ws = new WebSocket(`${ws_URL}?userId=${userId}`)
		ws.onopen = () => {}
		ws.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data)
				switch (data.type) {
					case 'new_message':
						handlenewmessage(data)
						break

					case 'video_call': //发起请求通知
						showCustomCallDialog(data.message)
						break
					case 'video_accept':
						acceptRomet(data.message)
						break
					case 'video_reject':
						rejectcall()
						break
					case 'video_isTRCcall': //挂断通话(通话结束)
						isTRCcall(data.message)
						break
					case 'video_offer': //offer(SDP)
						handleOffer(data.message)
						break
					case 'video_answer': //anwser(SDP)
						handleanswer(data.message)
						break
					case 'video_ice_candidate': //anwser(SDP)
						if (peer.value) {
							peer.value.addIceCandidate(new RTCIceCandidate(data.candidate))
						}
						break

						// 群聊视频信令（新增）
						// case 'group_join':
						// 	handleGroupJoin(data)
						// 	break
						// 群聊消息
					case 'group_message':
						handleGroupMessage(data)
						break
					default:
						console.log('收到未知类型的消息：', data);

				}
			} catch (error) {
				console.error('解析 WebSocket 消息失败:', error)
			}
		}
		ws.onerror = (error) => {
			console.error('WebSocket 连接错误:', error)
		}
		ws.onclose = (event) => {
			//如果不是正常关闭，尝试重连
			if (event.code !== 1000) {
				setTimeout(() => {
					initWebSocket()
				}, 5000)
			}
		}
	}
	//封装添加好友chatList信息
	const ensureFriendInChatlist = (friendInfo) => {
		// 检查是否已在 chatlist 中
		const exists = chatlist.value.some(friend => friend.id === friendInfo.id)
		if (!exists) {
			useChat.addChat({
				id: friendInfo.id,
				username: friendInfo.username,
				avatar: friendInfo.avatar || '',
			})
			chatlist.value = useChat.chatList
			unreadCount.value[friendInfo.id] = 0
		}
	}

	//处理新消息
	const handlenewmessage = (data) => {

		const senderId = Number(data.message.senderInfo.id)

		// 检查是否需要将该用户添加到chatlist
		const existingFriend = chatlist.value.find(f => f.id === senderId)

		if (!existingFriend && senderId !== userStore.getUserInfo().id) {
			// 如果是新联系人发来的消息，添加到chatlist
			const newFriend = {
				id: senderId,
				username: data.message.senderInfo.username || '未知用户',
				avatar: data.message.senderInfo.avatar || '',
				// lastMessage: message.content,
				// lastTime: message.send_at
			}
			// List(data.message.senderInfo)
			useChat.addChat(newFriend)
			// unreadCount.value[senderId] = (unreadCount.value[senderId] || 0) + 1
			chatlist.value = useChat.chatList
			// 为新好友初始化未读计数为 0
			unreadCount.value[senderId] = 0
		}

		//消息是否属于当前聊天窗口
		const currentChatUserId = headername.value?.id
		// if (!currentChatUserId) return // 如果没有选中好友，不处理
		// 不再提前 return，而是根据是否有选中好友来区分行为
		if (currentChatUserId) {
			// 判断消息是否与当前聊天相关
			const isRelevant =
				(senderId === currentChatUserId) ||
				(Number(data.message.user_from_id) === currentChatUserId) ||
				(Number(data.message.user_to_id) === currentChatUserId && Number(data.message.send_id) === userStore
					.getUserInfo()
					.id)
			if (isRelevant) {
				// 检查消息是否已存在（防止重复）
				const exists = Listmessages.value.some(m => m.id === data.message.id)
				if (!exists) {
					Listmessages.value.push({
						id: data.message.id || Date.now(),
						content: data.message.content,
						send_at: data.message.send_at,
						isSelf: Number(data.message.send_id) === userStore.getUserInfo().id,
						avatar: data.message.avatar
					})
					ScrollToButton()
				}
			} else {
				// 不是当前聊天窗口的消息 → 增加未读计数

				unreadCount.value[senderId] = (unreadCount.value[senderId] || 0) + 1

			}
		} else {
			// 增加未读计数
			unreadCount.value[senderId] = (unreadCount.value[senderId] || 0) + 1
		}

	}
	//群消息
	const handleGroupMessage = (data) => {
		const groupId = data.groupId
		const message = data.message

		// 更新群消息缓存
		if (!groupMessages.value[groupId]) {
			groupMessages.value[groupId] = []
		}

		// 检查消息是否已存在（防止重复）
		const exists = groupMessages.value[groupId].some(m => m.id === message.id)
		if (!exists) {
			groupMessages.value[groupId].push(message)
		}

		// 检查群聊是否存在
		const groupExists = chatlist.value.some(f => f.groupId === groupId) ||
			grouparr.value.some(g => g.groupId === groupId)
		if (!groupExists) return

		// 判断是否在当前聊天窗口
		const currentChat = JSON.parse(localStorage.getItem('chatMessage'))
		const isCurrentGroup = currentChat?.groupId === groupId && currentGroupType.value === 'group'

		if (isCurrentGroup) {
			const exists = Listmessages.value.some(m => m.id === message.id)

			if (!exists) {
				Listmessages.value.push(message)
				ScrollToButton()
			}
		} else {
			unreadCount.value[groupId] = (unreadCount.value[groupId] || 0) + 1
		}

	}
	// 视频请求
	const showCustomCallDialog = (message) => {
		// 将呼叫方添加到 chatlist
		ensureFriendInChatlist({
			id: message.fromUserId,
			username: message.username,
			avatar: message.avatar || ''
		})
		// 创建遮罩层
		const overlay = document.createElement('div')
		overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5); display: flex;
        align-items: center; justify-content: center; z-index: 9999;
    `

		// 弹窗内容
		const dialog = document.createElement('div')
		dialog.style.cssText = `
        background: white; padding: 30px; border-radius: 12px;
        text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    `
		dialog.innerHTML = `
        <h3 style="margin-bottom: 10px;">📞 视频通话邀请</h3>
        <p style="color: #666; margin-bottom: 20px;">
            用户 <strong>${message.username}</strong> 正在呼叫你
        </p>
        <div style="display: flex; gap: 15px; justify-content: center;">
            <button id="acceptBtn" style="
                padding: 10px 25px; background: #00b894; color: white;
                border: none; border-radius: 8px; cursor: pointer;
            ">✅ 接听</button>
            <button id="rejectBtn" style="
                padding: 10px 25px; background: #d63031; color: white;
                border: none; border-radius: 8px; cursor: pointer;
            ">❌ 拒绝</button>
        </div>
    `

		overlay.appendChild(dialog)
		document.body.appendChild(overlay)

		// 绑定按钮事件
		document.getElementById('acceptBtn').onclick = () => {
			// 再次确保对方在 chatlist
			ensureFriendInChatlist({
				id: message.fromUserId,
				username: message.username,
				avatar: message.avatar || ''
			})
			called.value = true
			ws.send(JSON.stringify({
				type: 'video_accept',
				fromUserId: message.toUserId,
				toUserId: message.fromUserId,
				text: '同意请求'
			}))
			document.body.removeChild(overlay)
			isRTC.value = false
			startCallTimer()
		}

		document.getElementById('rejectBtn').onclick = () => {

			called.value = false
			ws.send(JSON.stringify({
				type: 'video_reject',
				fromUserId: userStore.getUserInfo().id,
				uasername: userStore.getUserInfo().username,
				send_id: userStore.getUserInfo().id,
				content: '拒绝视频通话请求',
				send_at: new Date().toISOString(),
				id: Date.now() || userStore.getUserInfo().id, // 临时ID
				avatar: userStore.getUserInfo().avatar || "",
				toUserId: message.fromUserId
			}))
			pendingCallFrom.value = null
			document.body.removeChild(overlay)
			isRTC.value = true
			// 发送信息
			inputText.value = '拒绝视频通话请求'
			sendMessage()

		}
	}
	//同意请求
	const acceptRomet = (data) => {
		// 确保被叫方在自己的 chatlist 中
		ensureFriendInChatlist({
			id: data.fromUserId,
			username: data.username || '未知用户',
			avatar: data.avatar || ''
		})
		if (data.toUserId === userStore.getUserInfo().id) {
			called.value = true
		}
		const obj = {
			type: 'video_offer',
			formId: data.toUserId,
			toId: data.fromUserId
		}
		createOffer(obj)
	}
	//拒绝请求
	const rejectcall = () => {
		isRTC.value = true
	}
	//挂断通话
	const isRTCTrue = () => {
		called.value = false
		isRTC.value = true
		stopCallTimer()
		if (ws || ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify({
				type: 'video_isTRCcall',
				fromcallUserId: userStore.getUserInfo().id,
				tocallUserId: JSON.parse(localStorage.getItem('chatMessage')).id
			}))
		}
		// 发起方挂断
		if (callId.value) {
			inputText.value = "通话结束"
			sendMessage()
		}

		// 关闭摄像头
		if (mediaStream.value) {
			mediaStream.value.getTracks().forEach(track => track.stop());
			mediaStream.value = null
		}
		if (localVideo.value) {
			localVideo.value.srcObject = null
		}
		ScrollToButton()
	}
	//接收挂断通知（对方挂断时触发）
	const isTRCcall = (data) => {
		stopCallTimer()
		// 发起方挂断时发送"通话结束"消息
		if (callId.value && Number(data.fromcallUserId) !== userStore.getUserInfo().id) {
			inputText.value = "通话结束"
			sendMessage()
		}
		isRTC.value = true
		called.value = false
		// 关闭摄像头
		if (mediaStream.value) {
			mediaStream.value.getTracks().forEach(track => track.stop());
			mediaStream.value = null
		}
		if (localVideo.value) {
			localVideo.value.srcObject = null
		}
	}


	// 创建 peer
	const createPeer = () => {
		const pr = new RTCPeerConnection()
		// 添加本地音频
		if (mediaStream.value) {
			mediaStream.value.getTracks().forEach(track => {
				// track 才是 MediaStreamTrack 类型
				pr.addTrack(track, mediaStream.value);
			});
		}
		pr.ontrack = (event) => {
			// 将远端视频流赋值给 remoteVideo
			if (remoteVideo.value && event.streams[0]) {
				remoteVideo.value.srcObject = event.streams[0]
			}

		}

		pr.onicecandidate = (event) => {
			if (event.candidate) {
				// 通过 WebSocket 发送给对方
				ws.send(JSON.stringify({
					type: 'video_ice_candidate',
					fromUserId: userStore.getUserInfo().id,
					toUserId: headername.value.id,
					candidate: event.candidate
				}))
			}
		}
		peer.value = pr

		return pr
	}
	// 创建Offer
	const createOffer = async (data) => {
		const pr = createPeer()
		//offer
		const offer = await pr.createOffer({
			offerToReceiveAudio: 1,
			offerToReceiveVideo: 1,
		})

		//设置本地offer描述
		await pr.setLocalDescription(offer)
		if (ws || ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify({
				type: data.type,
				fromUserId: data.formId,
				toUserId: data.toId,
				offer: offer
			}))
		}
	}
	// 接收方：处理offer,并创建Anwser
	const handleOffer = async (data) => {
		// 确保本地流已经获取
		if (!mediaStream.value) {
			await getUserstream();
		}
		const pr = createPeer()

		// 设置远端描述信息
		await pr.setRemoteDescription(new RTCSessionDescription(data.offer))
		//创建answer
		const answer = await pr.createAnswer()

		await pr.setLocalDescription(answer)
		if (ws || ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify({
				type: 'video_answer',
				fromUserId: data.toUserId,
				toUserId: data.fromUserId,
				answer: answer
			}))
		}
	}
	//处理answer
	const handleanswer = async (data) => {
		const pr = peer.value
		if (!pr) return
		await pr.setRemoteDescription(new RTCSessionDescription(data.answer))
	}

	// 群聊WebRTC


	// 搜索好友
	const searchInput = ref('')
	const userLoginInfo = JSON.parse(localStorage.getItem('userLoginInfo'))
	const searchFriend = async () => {
		if (!searchInput.value.trim()) {
			ElMessage.warning('请输入搜索关键词')
			return
		}
		try {
			const res = await searchuserInfo({
				params: {
					username: searchInput.value,
					user_id: userLoginInfo.id
				}
			})
			useChat.addChat(res.data.data)
			chatlist.value = useChat.chatList
			searchInput.value = ''
		} catch (error) {
			if (error.response?.status === 404) {
				ElMessage.warning('未找到该用户')
			} else if (error.response?.status === 401) {
				ElMessage.error('登录已过期，请重新登录')
			} else {
				ElMessage.error('未找到该用户')
			}
		}
	}
	// 选择聊天好友
	const headername = ref('')
	const isShow = ref(false)
	const ListData = async (value) => {
		// console.log(currentGroupType.value);
		// console.log(value);

		//判断群聊还是私聊
		if (value.owner_id) {
			await switchToGroup(value)
			return
		}
		currentGroupType.value = 'private'
		// 清除该好友的未读计数
		unreadCount.value[value.id] = 0
		localStorage.setItem("chatMessage", JSON.stringify(value))

		headername.value = value
		const res = await MessagesUser({
			params: {
				user_from_id: userStore.getUserInfo().id,
				user_to_id: headername.value.id,
			}
		})
		const newMsg = res.data.msg.map(item => ({
			...item,
			isSelf: Number(item.send_id) === userStore.getUserInfo().id
		}))
		Listmessages.value = newMsg
		isShow.value = true
		ScrollToButton()
	}

	const switchToGroup = async (group) => {
		currentGroupType.value = 'group'
		headername.value = group
		localStorage.setItem('chatMessage', JSON.stringify(group))

		// 清除该群的未读计数
		unreadCount.value[group.id] = 0
		// 加入群聊房间
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify({
				type: 'group_join',
				roomId: group.id,
				fromUserId: userStore.getUserInfo().id,
				username: userStore.getUserInfo().username,
				avatar: userStore.getUserInfo().avatar || ''
			}))
		}
		//清除未读
		try {
			const res = await GroupMessages({
				group_id: group.id,
				user_id: userStore.getUserInfo().id
			})
			// console.log(res.data.msg);

			const newMsg = res.data.msg.map(item => ({
				...item,
				isSelf: Number(item.id) === userStore.getUserInfo().id
			}))
			groupMessages.value[group.id] = newMsg
			Listmessages.value = newMsg

			isShow.value = true
			ScrollToButton()
		} catch (error) {
			console.error('加载群聊消息失败:', error)
		}

	}

	const handleEmoji = () => {
		alert('打开表情面板')
	}

	const handleFile = () => {
		alert('选择文件')
	}

	const handleFolder = () => {
		alert('选择文件夹')
	}

	const handleScreenshot = () => {
		alert('截图')
	}

	const handleVoice = () => {
		alert('语音输入')
	}

	//音频、视频流
	const getUserstream = async () => {
		try {
			mediaStream.value = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: 'user', //user = 前置，enviroment = 后置
				},
				audio: true
			})

			if (localVideo.value) {

				localVideo.value.srcObject = mediaStream.value
				// 移动端防止全屏播放
				localVideo.value.setAttribute("playsinline", '')
				localVideo.value.play()
			}
		} catch (error) {
			console.log('获取媒体流失败:', error);
		}
	}

	const handlePlay = async () => {
		console.log(headername.value);
		if ('owner_id' in headername.value) return
		isRTC.value = false
		caller.value = true //发起方
		// called.value = true
		calling.value = true //呼叫中
		callId.value = userStore.getUserInfo().id
		await getUserstream()
		//发起视频请求
		if (ws || ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify({
				type: 'video_call',
				fromUserId: userStore.getUserInfo().id,
				username: userStore.getUserInfo().username,
				avatar: userStore.getUserInfo().avatar || '',
				toUserId: JSON.parse(localStorage.getItem('chatMessage')).id
			}))
		}
		startCallTimer()
	}

	//发送消息
	const sendMessage = async () => {
		if (!inputText.value.trim()) return
		const messageContent = inputText.value.trim()

		ToList.value = true
		// 先清空输入框
		inputText.value = ''

		if (currentGroupType.value === 'group') {
			try {
				const res = await SendGroupMessage({
					group_id: headername.value.id,
					user_id: userStore.getUserInfo().id,
					username: userStore.getUserInfo().username,
					content: messageContent,
					send_at: new Date().toLocaleString()
				})

				//websocket广播
				if (ws && ws.readyState === WebSocket.OPEN) {
					ws.send(JSON.stringify({
						type: 'group_message',
						groupId: headername.value.id,
						fromUserId: userStore.getUserInfo().id,
						message: {
							id: res.data?.id || Date.now(),
							content: messageContent,
							send_id: userStore.getUserInfo().id,
							username: userStore.getUserInfo().username,
							avatar: userStore.getUserInfo().avatar || '',
							send_at: new Date().toLocaleString(),
							isSelf: true
						}
					}))
				}
				// 刷新消息列表
				const latestRes = await GroupMessages({
					group_id: headername.value.id,
					user_id: userStore.getUserInfo().id
				})
				const newMsg = latestRes.data.msg.map(item => ({
					...item,
					isSelf: Number(item.sender_id) === userStore.getUserInfo().id
				}))
				groupMessages.value[headername.value.groupId] = newMsg
				Listmessages.value = newMsg
				inputText.value = ''

				ScrollToButton()
			} catch (error) {
				console.log(error);

			}

		} else {
			// 先构建消息对象
			const messageData = {
				content: messageContent,
				send_at: new Date().toISOString(),
				id: Date.now(), // 临时ID
				avatar: userStore.getUserInfo().avatar || ""
			}
			try {
				const res = await Messages({ // 保存到数据库
					user_from_id: userStore.getUserInfo().id,
					user_to_id: headername.value.id,
					content: messageContent,
					send_at: new Date().toLocaleString()
				})
				// 通过 WebSocket 通知对方
				if (ws && ws.readyState === WebSocket.OPEN) {
					ws.send(JSON.stringify({
						type: 'send_message',
						fromUserId: userStore.getUserInfo().id,
						toUserId: headername.value.id,
						message: {
							...messageData,
							id: res.data?.id || Date.now(),

						},
						senderInfo: { // 新增：发送者信息
							id: userStore.getUserInfo().id,
							username: userStore.getUserInfo().username,
							avatar: userStore.getUserInfo().avatar
						}
					}))
				}
				// 从服务器获取最新消息列表（确保消息顺序正确）// 更新自己的消息列表
				const latestRes = await MessagesUser({
					params: {
						user_from_id: userStore.getUserInfo().id,
						user_to_id: headername.value.id
					}
				})
				const newMsg = latestRes.data.msg.map(item => ({
					...item,
					isSelf: Number(item.send_id) === userStore.getUserInfo().id
				}))

				Listmessages.value = newMsg

				inputText.value = ''
				ScrollToButton()
			} catch (error) {
				console.error('发送消息失败:', error)
				// 发送失败时恢复输入框内容
				inputText.value = messageContent
			}
		}

	}

	// 自动滚动
	const messageListref = ref(null)
	const ScrollToButton = () => {
		nextTick(() => {
			if (messageListref.value) {
				messageListref.value.scrollTop = messageListref.value.scrollHeight
			}
		})
	}

	// messageList ref变化
	watch(Listmessages, ScrollToButton, {
		deep: true
	})
	// isshow
	watch(isShow, (newvalue) => {
		if (newvalue) {
			ScrollToButton() //选中好友后滚动底部
		}
	})

	//

	const dialogVisible = ref(false)
	const activeCollapse = ref(['friends'])
	const selectLeftList = ref([])
	const selectRightList = ref([])
	const handleClose = () => {
		dialogVisible.value = false
	}
	//
	const selectdata = async () => {
		const res = await List({
			params: {
				user_id: userStore.getUserInfo().id
			}
		})
		selectLeftList.value = res.data.data

	}
	//
	const selectFriendList = (item, checked) => {
		if (checked) {
			// 如果右侧已有则不重复添加
			if (selectRightList.value.some(val => val.id === item.id)) return

			selectRightList.value.push(item)
		} else {
			selectRightList.value = selectRightList.value.filter(val => val.id !== item.id)
		}

	}
	const chilckdialogVisible = () => {
		dialogVisible.value = true
		selectdata()
	}

	const grouparr = ref([])
	//确定
	const successdialogVisible = async () => {
		//
		const user_obj = {
			id: userStore.getUserInfo().id,
			owner_id: userStore.getUserInfo().id,
			username: userStore.getUserInfo().username
		}
		selectRightList.value.unshift(user_obj)
		try {
			const res = await Group({
				arrList: selectRightList.value
			})
			grouparr.value.push(res.data.data)

		} catch (error) {
			console.log(error);

		}
		dialogVisible.value = false //成功关闭dialog,并且清空数据
		//清空数据
		selectRightList.value = []
	}
	//取消
	const faildialogVisible = () => {
		dialogVisible.value = false
		//清空数据
		selectRightList.value = []
	}
	//移除Icon
	const clickIcon = (target) => {
		selectRightList.value = selectRightList.value.filter(val => val.id !== target.id)

	}
</script>
<template>
	<el-container>
		<!-- 右上侧边栏 -->
		<el-aside width="280px" style="border-right:1px solid #e0e0e0">
			<!-- 搜索栏 -->
			<div class="search-section">
				<el-input v-model="searchInput" placeholder="搜索好友" :prefix-icon="Search" clearable
					@keyup.enter="searchFriend">
					<!-- <template #append>
						<el-button @click="searchFriend">搜索</el-button>
					</template> -->
				</el-input>

				<el-dropdown trigger="click">
					<el-icon style="margin: 7px 7px 0;">
						<CirclePlus />
					</el-icon>

					<template #dropdown>
						<el-dropdown-menu>
							<el-dropdown-item plain @click="chilckdialogVisible">发起群聊</el-dropdown-item>
							<el-dropdown-item>添加朋友</el-dropdown-item>
						</el-dropdown-menu>
					</template>
				</el-dropdown>
				<!-- 群聊天框 -->
				<el-dialog v-model="dialogVisible" width="660" :before-close="handleClose">
					<el-row class="row-bg">
						<el-col :span="11">
							<el-aside width="280px" class="friend-sidebar">
								<!-- 搜索栏 -->
								<div class="search-section">
									<el-input v-model="searchInput" placeholder="搜索好友" :prefix-icon="Search" clearable
										@keyup.enter="searchFriend">
									</el-input>
								</div>
								<!-- 折叠面板 -->
								<el-collapse v-model="activeCollapse" class="friend-collapse">
									<!-- 好友列表 -->
									<el-collapse-item title="我的好友" name="friends">
										<div class="friend-groups">
											<div class="letter-group" v-for="item in selectLeftList" :key="item">
												<li>

													<el-checkbox @change="(checked)=>selectFriendList(item,checked)"
														size="large" />
													<el-avatar :size="30" :src="item.avatar" />
													<span>{{ item.username }}</span>
												</li>
											</div>
										</div>
									</el-collapse-item>
								</el-collapse>
							</el-aside>
						</el-col>
						<el-col :span="13">
							<el-aside width="330">
								<!-- toptip -->
								<div class="search-section chat">
									发起群聊
								</div>
								<el-collapse v-model="activeCollapse" class="friend-collapse">
									<div class="friend-groups">
										<div class="letter-group" v-for="item in selectRightList" :key="item">
											<li
												style="display: flex;align-items: center;gap: 10px;padding: 5px 0 0 8px;position: relative;">
												<el-avatar :size="30" :src="item.avatar" />
												<span>{{item.username}} </span>
												<el-icon style="position: absolute;right: 0;" @click="clickIcon(item)">
													<CircleClose />
												</el-icon>
											</li>
										</div>
									</div>
								</el-collapse>
								<div class="dialog-footer">
									<el-button type="success" @click="successdialogVisible">
										确定
									</el-button>
									<el-button type="info" @click="faildialogVisible">
										取消
									</el-button>
								</div>
							</el-aside>
						</el-col>
					</el-row>

				</el-dialog>

			</div>
			<!--  -->
			<div class="friend-groups">
				<div v-for="(group, index) in chatlist" :key="index" class="letter-group">
					<div :key="group.id ||group.geoupId" class="friend-item" @click="ListData(group)">
						<el-avatar :size="36" :src="group.avatar || undefined" icon="User" />
						<span class="friend-name">{{ group.username || group.name || group.groupName}}</span>
						<el-badge v-if="unreadCount[group.id] > 0 || unreadCount[group.groupId] > 0"
							:value="unreadCount[group.id] || unreadCount[group.groupId] || 0" class="unread-badge" />
					</div>
				</div>
				<!-- 新群显示 -->
				<div v-for="(group, index) in grouparr" :key="index" class="letter-group" @click="ListData(group)">
					<div :key="group.groupId" class="friend-item">
						<el-avatar :size="36" :src="group.avatar || undefined" icon="User" />
						<span class="friend-name">{{ group.groupName }}</span>
						<el-badge v-if="unreadCount[group.groupId] > 0" :value="unreadCount[group.groupId]"
							class="unread-badge" />
					</div>
				</div>
			</div>
		</el-aside>
		<!-- 主区域 -->
		<el-container v-if="isShow">
			<el-header>
				<span>{{ headername.username ||headername.name }}</span>
				<el-divider />
			</el-header>
			<el-main v-if="isRTC">
				<div class="message-list" ref="messageListref">
					<div v-for="(msg,index) in Listmessages" :key="index"
						:class="['message-item', msg.isSelf ? 'self' : 'other']">
						<!-- 对方消息，头像在左 -->
						<template v-if="!msg.isSelf">
							<el-avatar :size="32" icon="User" :src="msg.avatar" />
							<div class="message-content">
								<div class="message-time">{{ new Date(msg.send_at).toLocaleTimeString()}}</div>
								<div class="message-bubble">{{ msg.content }}</div>
							</div>
						</template>

						<!-- 自己消息，头像在右 -->
						<template v-else>
							<el-avatar :size="32" icon="User" :src="msg.avatar" />
							<div class="message-content right">
								<div class="message-time">{{ new Date(msg.send_at).toLocaleTimeString() }}</div>
								<div class="message-bubble self-bubble">{{ msg.content }}</div>
							</div>
						</template>
					</div>
				</div>
			</el-main>
			<el-main v-else class="video-call-container">
				<!-- 对方画面     全屏背景 -->
				<div class="remote-video">
					<!-- 无视频显示 -->
					<div v-if="!called" class="video-placeholder">
						<el-icon :size="64" color="#909399">
							<VideoPlay />
						</el-icon>
						<p class="placeholder-text">等待对方加入视频...</p>
					</div>
					<!-- 有视频显示-->
					<video v-else ref="remoteVideo" autoplay playsinline></video>
				</div>
				<!-- 自己的画面 -->
				<div class="local-video">
					<!-- 无视频显示 -->
					<div v-if="!caller" class="local-video-inner">
						<el-avatar :size="40" icon="User" />
						<span class="local-name">我</span>
					</div>
					<!-- 有视频显示-->
					<video v-else ref="localVideo" autoplay playsinline muted></video>
				</div>
				<!-- 通话控制栏 -->
				<div class="call-controls" v-if="called">
					<div class="controls-wrapper">
						<!-- 麦克风控制 -->
						<el-tooltip content="静音" placement="top">
							<el-button circle class="control-btn mic-btn">
								<el-icon :size="22">
									<Microphone />
								</el-icon>
							</el-button>
						</el-tooltip>

						<!-- 摄像头控制 -->
						<el-tooltip content="关闭摄像头" placement="top">
							<el-button circle class="control-btn camera-btn">
								<el-icon :size="22">
									<VideoPlay />
								</el-icon>
							</el-button>
						</el-tooltip>

						<!-- 挂断电话 - 突出显示 -->
						<el-tooltip content="结束通话" placement="top">
							<el-button circle class="control-btn hangup-btn" @click="isRTCTrue()">
								<el-icon :size="28">
									<PhoneFilled />
								</el-icon>
							</el-button>
						</el-tooltip>

						<!-- 扬声器控制 -->
						<el-tooltip content="扬声器" placement="top">
							<el-button circle class="control-btn speaker-btn">
								<el-icon :size="22">
									<Headset />
								</el-icon>
							</el-button>
						</el-tooltip>

						<!-- 更多选项 -->
						<el-tooltip content="更多" placement="top">
							<el-button circle class="control-btn more-btn">
								<el-icon :size="22">
									<MoreFilled />
								</el-icon>
							</el-button>
						</el-tooltip>
					</div>
				</div>
				<!-- 通话信息 -->
				<div class="call-info">
					<div class="call-duration">{{ currentTimer }}</div>
					<div class="call-status">正在通话</div>
				</div>
			</el-main>
			<el-footer v-if="isRTC">
				<div class="chat-input">
					<!-- 输入框 -->
					<el-input v-model="inputText" type="textarea" :rows="3" placeholder="请输入消息..." resize="none"
						class="input-area" @keydown.enter.prevent="sendMessage" />

					<!-- 工具栏 -->
					<div class="toolbar">
						<el-button link @click="handleEmoji">
							<el-icon>
								<ChatRound />
							</el-icon>
						</el-button>
						<el-button link @click="handleFile">
							<el-icon>
								<Box />
							</el-icon>
						</el-button>
						<el-button link @click="handleFolder">
							<el-icon>
								<Folder />
							</el-icon>
						</el-button>
						<el-button link @click="handleScreenshot">
							<el-icon>
								<Scissor />
							</el-icon>
						</el-button>
						<el-button link @click="handleVoice">
							<el-icon>
								<Microphone />
							</el-icon>
						</el-button>
						<el-button link @click="handlePlay">
							<el-icon>
								<VideoPlay />
							</el-icon>
						</el-button>
					</div>

					<!-- 发送按钮 -->
					<div class="send-btn">
						<el-button type="primary" @click="sendMessage">发送</el-button>
					</div>
				</div>
			</el-footer>
		</el-container>
		<el-container v-else>
			<el-main class="friend-main">
				<el-empty description=" " :image-size="200" />
			</el-main>
		</el-container>
	</el-container>
</template>
<style scoped>
	* {
		margin: 0;
		padding: 0;
	}

	.common-layout,
	.el-container,
	.el-aside {
		height: 100%;
	}

	/* 群聊框 */
	.friend-collapse {
		flex: 1;
		overflow-y: auto;
		height: 400px;
	}

	.friend-groups li {
		display: flex;
		align-items: center;
		/* 垂直居中 */
		gap: 10px;
	}

	/* 去掉所有可能的焦点边框 */
	.el-dropdown *:focus-visible {
		outline: none !important;
		border: none !important;
		box-shadow: none !important;
	}

	.dialog-footer {
		display: flex;
		justify-content: center;
		gap: 12px;
		/* 按钮间距 */
		margin-top: 16px;
		/* 与上方内容的间距 */
	}

	.dialog-footer>.el-button {
		padding: 20px 30px;
	}

	.dialog-footer>.el-button>span {
		font-size: 20px;
	}

	/* 内容 */
	.el-menu {
		height: 100%;
		/* border-right: none; */
	}

	.message-list {
		padding: 0 20px;
		overflow-y: auto;
		height: 100%;
	}

	.message-item {
		display: flex;
		gap: 10px;
		margin-bottom: 18px;
		align-items: flex-start;
	}

	.message-item.self {
		flex-direction: row-reverse;
	}

	.message-content {
		max-width: 70%;
	}

	.message-content.right {
		text-align: right;
	}

	.message-sender {
		font-size: 12px;
		color: #909399;
		margin-bottom: 4px;
	}

	.message-bubble {
		background: #ffffff;
		border-radius: 8px;
		padding: 10px 14px;
		font-size: 14px;
		line-height: 1.5;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
		word-break: break-word;
	}

	.self-bubble {
		background: #95ec69;
		color: #000;
	}

	.message-time {
		font-size: 11px;
		color: #c0c4cc;
		margin-top: 4px;
	}

	.search-section {
		padding: 6px 16px;
		display: flex;

	}

	.search-section .chat {
		padding: 12px 16px;
	}

	.friend-groups {
		padding: 4px 0;
	}

	.letter-group {
		background-color: white;
		position: relative;
	}

	/* Message */
	.unread-badge {
		margin-left: auto;
	}

	.MessageNum {
		display: block;
		width: 20px;
		height: 20px;
		background-color: red;
		position: absolute;
		right: 0;
		top: 10px;
		border-radius: 50%;
		color: white;
	}

	.letter-header {
		padding: 6px 16px;
		font-size: 13px;
		color: #909399;
		font-weight: 600;
		background: #f5f7fa;
	}

	.friend-item {
		display: flex;
		align-items: center;
		padding: 8px 16px;
		gap: 12px;
		cursor: pointer;
		transition: all 0.2s;
		border-radius: 4px;
		margin: 0px 8px;
		border-bottom: 1px solid #e0e0e0;
	}

	.friend-item:hover {
		background: #ecf5ff;
		transform: translateX(4px);
	}

	.friend-name {
		font-size: 14px;
		color: #303133;
	}

	/* header */
	.el-header {
		line-height: 60px;
	}

	.el-header span {
		display: block;
		margin-left: 10px;
	}

	/* 右侧主内容 */
	.friend-main {
		display: flex;
		justify-content: center;
		align-items: flex-start;
		padding: 24px;
		background: #f5f7fa;
	}


	/* :deep(.el-main) {
		height: calc(100% - 160px);
		overflow: hidden;
	}

	:deep(.el-aside:nth-of-type(2) .el-menu) {
		padding-top: 50px;
		background-color: transparent;
		border-right: none;
	} */

	/* Footer 固定高度 */
	:deep(.el-footer) {
		height: 160px;
		padding: 10px;
		box-sizing: border-box;
		background-color: #fff;
		border-top: 1px solid #e6e6e6;
	}

	/* 聊天输入框整体 */
	.chat-input {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	/* 输入框区域 */
	.input-area {
		flex: 1;
	}

	/* 工具栏 */
	.toolbar {
		display: flex;
		gap: 10px;
		margin-top: 8px;
	}

	/* 发送按钮 */
	.send-btn {
		text-align: right;
		/* margin-top: 8px; */
	}

	/* 视频通话容器 */
	.video-call-container {
		position: relative;
		background: #1a1a2e;
		height: 100%;
		overflow: hidden;
		padding: 0 !important;
	}

	/* 远程视频（对方画面） */
	.remote-video {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #16213e 0%, #0f3460 50%, #1a1a2e 100%);
	}

	.video-placeholder {
		text-align: center;
		color: #909399;
	}

	.placeholder-text {
		margin-top: 16px;
		font-size: 16px;
		color: #606266;
	}

	/* 本地视频（自己的画面） */
	.local-video {
		position: absolute;
		top: 80px;
		right: 20px;
		width: 180px;
		height: 240px;
		border-radius: 12px;
		overflow: hidden;
		background: #2c3e50;
		border: 2px solid rgba(255, 255, 255, 0.2);
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
		cursor: pointer;
		transition: transform 0.3s ease;
		z-index: 10;
	}

	.local-video:hover {
		transform: scale(1.05);
	}

	.local-video-inner {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 8px;
	}

	.local-name {
		color: #ffffff;
		font-size: 12px;
		opacity: 0.8;
	}

	/* 通话控制栏 */
	.call-controls {
		position: absolute;
		bottom: 30px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 20;
	}

	.controls-wrapper {
		display: flex;
		align-items: center;
		gap: 25px;
		background: rgba(44, 62, 80, 0.85);
		backdrop-filter: blur(10px);
		padding: 15px 35px;
		border-radius: 45px;
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.control-btn {
		width: 48px !important;
		height: 48px !important;
		border: none !important;
		transition: all 0.3s ease;
		background: rgba(255, 255, 255, 0.1) !important;
		color: #ffffff !important;
	}

	.control-btn:hover {
		background: rgba(255, 255, 255, 0.2) !important;
		transform: translateY(-2px);
	}

	.hangup-btn {
		background: #e74c3c !important;
		width: 56px !important;
		height: 56px !important;
	}

	.hangup-btn1 {
		background: #27ae60 !important;
		width: 56px !important;
		height: 56px !important;
	}

	.hangup-btn:hover {
		background: #c0392b !important;
		transform: translateY(-2px);
		box-shadow: 0 4px 15px rgba(231, 76, 60, 0.5);
	}

	.mic-btn.active,
	.camera-btn.active {
		background: #27ae60 !important;
	}

	/* 通话信息 */
	.call-info {
		position: absolute;
		top: 20px;
		left: 50%;
		transform: translateX(-50%);
		text-align: center;
		z-index: 10;
	}

	.call-duration {
		font-size: 38px;
		font-weight: 300;
		color: #ffffff;
		letter-spacing: 2px;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
		font-family: 'Courier New', monospace;
	}

	.call-status {
		font-size: 14px;
		color: rgba(255, 255, 255, 0.7);
		margin-top: 5px;
		letter-spacing: 1px;
	}

	/* 响应式适配 */
	@media screen and (max-width: 768px) {
		.local-video {
			width: 120px;
			height: 170px;
			top: 90px;
			right: 10px;
		}

		.controls-wrapper {
			gap: 15px;
			padding: 12px 25px;
		}

		.control-btn {
			width: 42px !important;
			height: 42px !important;
		}

		.hangup-btn {
			width: 52px !important;
			height: 52px !important;
		}

		.call-duration {
			font-size: 26px;
		}
	}
</style>
