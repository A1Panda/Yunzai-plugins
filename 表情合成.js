import plugin from '../../lib/plugins/plugin.js'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import https from 'https'

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
        // 只处理恰好两个表情的消息
        if (emojis.length !== 2) return false
        
        try {
            const emoji1 = emojis[0]
            const emoji2 = emojis[1]
            
            // 尝试直接使用Google的Emoji Kitchen API
            // 这是一个更可靠的方法，不依赖第三方API
            const emojiCodes = [
                this.getEmojiUnicode(emoji1),
                this.getEmojiUnicode(emoji2)
            ].sort(); // 排序以确保一致性
            
            // 扩展更多的表情合成库版本
            const baseUrls = [
                "https://www.gstatic.com/android/keyboard/emojikitchen/20201001",
                "https://www.gstatic.com/android/keyboard/emojikitchen/20210218",
                "https://www.gstatic.com/android/keyboard/emojikitchen/20210831",
                "https://www.gstatic.com/android/keyboard/emojikitchen/20220110",
                "https://www.gstatic.com/android/keyboard/emojikitchen/20220506",
                "https://www.gstatic.com/android/keyboard/emojikitchen/20221101",
                "https://www.gstatic.com/android/keyboard/emojikitchen/20230301",
                "https://www.gstatic.com/android/keyboard/emojikitchen/20230803"
            ];
            
            //await e.reply(`正在尝试合成 ${emoji1} 和 ${emoji2}...`);
            
            // 尝试所有可能的URL组合
            for (const baseUrl of baseUrls) {
                const possibleUrls = [
                    `${baseUrl}/u${emojiCodes[0]}/u${emojiCodes[0]}_u${emojiCodes[1]}.png`,
                    `${baseUrl}/u${emojiCodes[1]}/u${emojiCodes[1]}_u${emojiCodes[0]}.png`
                ];
                
                for (const url of possibleUrls) {
                    try {
                        // 检查URL是否可访问
                        const exists = await this.checkUrlExists(url);
                        if (exists) {
                            await e.reply(segment.image(url));
                            return true;
                        }
                    } catch (err) {
                        continue; // 尝试下一个URL
                    }
                }
            }
            
            // 所有方法都失败
            await e.reply(`抱歉，无法合成 ${emoji1} 和 ${emoji2}`);
            
        } catch (error) {
            await e.reply(`合成失败: ${error.message}`);
        }
        
        return false;
    }
    
    // 获取emoji的Unicode编码
    getEmojiUnicode(emoji) {
        let unicode = '';
        for (let i = 0; i < emoji.length; i++) {
            unicode += emoji.codePointAt(i).toString(16);
            // 跳过代理对的第二部分
            if (emoji.codePointAt(i) > 0xFFFF) {
                i++;
            }
        }
        return unicode.toLowerCase();
    }
    
    // 检查URL是否存在
    async checkUrlExists(url) {
        return new Promise((resolve, reject) => {
            https.get(url, (res) => {
                if (res.statusCode === 200) {
                    resolve(true);
                } else {
                    resolve(false);
                }
                res.destroy();
            }).on('error', () => {
                resolve(false);
            });
        });
    }
    
    // 带超时的fetch
    async fetchWithTimeout(url, options = {}) {
        const { timeout = 8000 } = options;
        
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            throw error;
        }
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
