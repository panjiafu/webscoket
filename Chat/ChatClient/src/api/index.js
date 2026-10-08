import instance from '@/utils'

// //注册接口
// export const userRegister = (params) => {
// 	return instance.post('/api/register', params)
// };

// //登录接口
// export const userLogin = (params) => {
// 	return instance.post('/api/login', params)
// };

// // 获取搜索好友信息
// export const searchuserInfo = (params) => {
// 	return instance.get('/api/searchuserInfo', params)
// }

// //修改头像
// export const userAvatar = (params) => {
// 	return instance.post('/api/avatar', params)
// }

// //用户添加好友信息
// export const addFriends = (params) => {
// 	return instance.post('/api/addFriend', params)
// }

// //用户添加好友列表
// export const addFriendList = (params) => {
// 	return instance.get('/api/addfriendList', params)
// }
// //用户接收请求
// export const AcceptRequest = (params) => {
// 	return instance.post('/api/acceptRequest', params)
// }
// //用户接收请求
// export const RejectRequest = (params) => {
// 	return instance.post('/api/rejectRequest', params)
// }
// //好友列表
// export const List = (params) => {
// 	return instance.get('/api/List', params)
// }
// // 信息
// export const Messages = (params) => {
// 	return instance.post('/api/messages', params)
// }

// // messageuser
// export const MessagesUser = (params) => {
// 	return instance.get('/api/message/user', params)
// }

// //群聊
// export const Group = (params)=>{
// 	return instance.post('/api/group',params)
// }
// //群组列表
// export const GroupList = (params)=>{
// 	return instance.get('/api/groupList',params)
// }
// //获取群消息
// export const GroupMessages =(data)=>{
// 	return instance.post('/api/group/messages',data)
// }
// //发送群消息
// export const SendGroupMessage=(data)=>{
// 	return instance.post('/api/group/send',data)
// }


//注册接口
export const userRegister = (params) => {
	return instance.post('/register', params)
};

//登录接口
export const userLogin = (params) => {
	return instance.post('/login', params)
};

// 获取搜索好友信息
export const searchuserInfo = (params) => {
	return instance.get('/searchuserInfo', params)
}

//修改头像
export const userAvatar = (params) => {
	return instance.post('/avatar', params)
}

//用户添加好友信息
export const addFriends = (params) => {
	return instance.post('/addFriend', params)
}

//用户添加好友列表
export const addFriendList = (params) => {
	return instance.get('/addfriendList', params)
}
//用户接收请求
export const AcceptRequest = (params) => {
	return instance.post('/acceptRequest', params)
}
//用户接收请求
export const RejectRequest = (params) => {
	return instance.post('/rejectRequest', params)
}
//好友列表
export const List = (params) => {
	return instance.get('/List', params)
}
// 信息
export const Messages = (params) => {
	return instance.post('/messages', params)
}

// messageuser
export const MessagesUser = (params) => {
	return instance.get('/message/user', params)
}
//群聊
export const Group = (params)=>{
	return instance.post('/group',params)
}
//群组列表
export const GroupList = (params)=>{
	return instance.get('groupList',params)
}
//获取群消息
export const GroupMessages =(data)=>{
	return instance.post('/group/messages',data)
}
//发送群消息
export const SendGroupMessage=(data)=>{
	return instance.post('/group/send',data)
}