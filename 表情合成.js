import plugin from '../../lib/plugins/plugin.js'

export class EchoEmoji extends plugin {
    constructor() {
        super({
            name: '表情合成',
            dsc: '合成用户发送的表情',
            event: 'message',
            priority: 5000
        })
    }

    async accept(e) {
        // 不处理机器人自己的消息
        if (e.self_id === e.user_id) return false
        
        // 获取原始消息文本
        const text = e.msg
        if (!text) return false
        
        // 提取所有表情
        const emojis = this.extractEmojis(text)
        if (emojis.length < 2) return false // 需要至少两个表情才能合成
        
        try {
            // 获取前两个表情进行合成
            const emoji1 = emojis[0]
            const emoji2 = emojis[1]
            
            // 调用新的合成API
            const response = await fetch(`https://api.andeer.top/API/emojimix.php?emoji1=${emoji1}&emoji2=${emoji2}`)
            const data = await response.json()
            
            if (data.code === 1 && data.data?.url) {
                // 发送合成后的图片
                await e.reply(segment.image(data.data.url))
                return true
            } else {
                // 合成失败
                await e.reply(`抱歉，${emoji1}和${emoji2}暂时无法合成哦~`)
            }
        } catch (error) {
            console.error('表情合成失败:', error.message)
            await e.reply('抱歉，表情合成失败了，请稍后再试~')
        }
        
        return false
    }

    extractEmojis(str) {
        const emojis = []
        
        // Unicode emoji范围
        const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E6}-\u{1F1FF}]|[\u{2194}-\u{2199}]|[\u{2122}-\u{2B55}]|[\u{23E9}-\u{23FA}]|[\u{25A0}-\u{25FF}]|[\u{2702}-\u{27B0}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F0FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{FE00}-\u{FE0F}]/gu

        // 提取Unicode emoji
        const unicodeEmojis = str.match(emojiRegex) || []
        emojis.push(...unicodeEmojis)
        
        return emojis
    }
}
