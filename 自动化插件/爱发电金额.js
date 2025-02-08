import fs from 'fs'
import path from 'path'

export async function NameCardContent() {
    const total = getSponsorTotal()
    if (total !== false) {
        return `发电总额:${total}元`
    }
    return false
}

export function getSponsorTotal() {
    try {
        // 读取用户数据文件
        const filePath = path.join('./data/SponsorList/users.json')
        if (!fs.existsSync(filePath)) {
            return false
        }
        
        const userData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        
        // 计算总金额
        let total = 0
        for (const userId in userData) {
            const amount = parseFloat(userData[userId][1])
            if (!isNaN(amount)) {
                total += amount
            }
        }
        
        return total.toFixed(2)
    } catch (error) {
        return false
    }
}
