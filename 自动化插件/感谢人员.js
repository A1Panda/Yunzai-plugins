import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'

function getUserData() {
    try {
        const filePath = path.join('./data/SponsorList/users.json')
        if (!fs.existsSync(filePath)) {
            return false
        }
        return JSON.parse(fs.readFileSync(filePath, 'utf8'))
    } catch (error) {
        return false
    }
}

async function getNickname(qq) {
    try {
        const response = await fetch(`http://api.ilingku.com/int/v1/qqname?qq=${qq}`)
        const data = await response.json()
        
        if (data.code === 200 && data.name) {
            return data.name
        }
        return String(qq)
    } catch (error) {
        return String(qq)
    }
}

let currentUserIndex = 0

export async function NameCardContent() {
    const userData = getUserData()
    if (!userData) {
        return false
    }
    
    const users = Object.entries(userData)
    if (users.length === 0) {
        return false
    }
    
    // 按顺序获取用户
    const currentUser = users[currentUserIndex]
    const [qq, userInfo] = currentUser
    
    // 更新索引，如果到达末尾则重置
    currentUserIndex = (currentUserIndex + 1) % users.length
    
    // 获取昵称和金额
    const nickname = await getNickname(qq)
    const amount = parseFloat(userInfo[1]).toFixed(2)
    
    return `感谢${nickname}发电${amount}元`
}