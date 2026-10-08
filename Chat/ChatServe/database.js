import mysql from 'mysql2/promise'

const pool = mysql.createPool({
	host:'localhost',
	user:'root',
	// user:'chat_server',
	password:'123456',//数据库密码
	database:'chat',//数据库名
	// database:'chat_server',//数据库名
	port:'3306',//端口
	waitForConnections:true,
	connectionLimit:10
})

//导出
export default pool