import plugin from "../../lib/plugins/plugin.js";
import fs from "fs";

// 配置文件路径
const CONFIG_PATH = './config/at_mute.json';

// 修改默认配置
const DEFAULT_CONFIG = {
    masterQQ: ["114514119", "3121280556"], // 主人QQ号列表不会被禁言
    botQQ: "2783939194",                   // 机器人QQ号不会被禁言
    // 被监控的用户列表这里面的用户发送消息到达指定设置会被禁言
    monitoredUsers: {
        // 示例: QQ号作为key
        "12345678": {
            muteTime: 600,      // 禁言时间（秒）
            message: "请不要刷屏",  // 禁言提示消息
            maxMsgCount: 5,     // 最大消息数
            timeWindow: 60      // 时间窗口（秒）
        }
    }
};

// 读取配置
let config;
try {
    if (fs.existsSync(CONFIG_PATH)) {
        config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } else {
        config = DEFAULT_CONFIG;
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    }
} catch (error) {
    console.error("读取配置文件失败:", error);
    config = DEFAULT_CONFIG;
}

// 记录每个用户的消息历史
const messageHistory = {};

export class checkAt extends plugin {
    constructor() {
        super({
            name: "针对禁言插件",
            dsc: "监控特定用户的消息频率",
            event: "message",
            priority: 5000,
            rule: [
                {
                    reg: "^#添加针对.*$",
                    fnc: "addMonitoredUser",
                    log: true
                },
                {
                    reg: "^#删除针对.*$",
                    fnc: "removeMonitoredUser",
                    log: true
                }
            ]
        });
    }

    // 使用 accept 方法作为消息触发器
    async accept(e) {
        // 如果是命令消息，跳过处理
        if (e.msg && (e.msg.startsWith('#添加针对') || e.msg.startsWith('#删除针对'))) {
            return false;
        }

        // 检查是否群消息
        if (!e.group) return false;
        if (!e.group.is_owner && !e.group.is_admin) return false;

        // 检查发送者是否在豁免名单中
        const senderQQ = String(e.sender.user_id);
        if (this.isExempt(senderQQ)) {
            return false;
        }

        // 检查发送者是否在监控名单中
        const userConfig = config.monitoredUsers[senderQQ];
        if (!userConfig) return false; // 不是被监控的用户

        // 如果是其他命令消息，不计入频率统计
        if (e.msg && e.msg.startsWith('#')) {
            return false;
        }

        logger.info(`[针对禁言] 收到监控用户消息: ${senderQQ}`);

        // 更新消息历史
        this.updateMessageHistory(senderQQ, userConfig.timeWindow);

        // 检查是否超过限制
        if (messageHistory[senderQQ].length >= userConfig.maxMsgCount) {
            await this.muteUser(e, userConfig);
            return true;
        }

        return false;
    }

    // 检查是否豁免
    isExempt(qq) {
        // 检查是否是主人QQ
        if (config.masterQQ.includes(String(qq))) {
            return true;
        }
        // 检查是否是机器人QQ
        if (String(qq) === config.botQQ) {
            return true;
        }
        return false;
    }

    // 保存配置
    saveConfig() {
        try {
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
        } catch (error) {
            logger.error(`保存配置失败: ${error}`);
        }
    }

    // 检查权限
    async checkAuth(e) {
        if (!e.group) return false;
        if (config.masterQQ.includes(String(e.sender.user_id))) return true;
        if (e.sender.role === 'owner' || e.sender.role === 'admin') return true;
        return false;
    }

    // 添加被监控用户
    async addMonitoredUser(e) {
        logger.info(`[针对禁言] 收到添加命令: ${e.msg}`);

        if (!await this.checkAuth(e)) {
            e.reply("只有主人、群主和管理员才能使用此命令");
            return true;
        }

        let targetQQ;
        // 检查是否是@方式
        const atList = e.message.filter(msg => msg.type === 'at');
        if (atList.length) {
            targetQQ = String(atList[0].qq);
        } else {
            // 尝试从消息中提取QQ号
            const match = e.msg.match(/^#添加针对\s*(\d{5,})/);
            if (match) {
                targetQQ = match[1];
            }
        }

        if (!targetQQ) {
            e.reply("请@要监控的用户或输入其QQ号\n例如：#添加针对@用户 或 #添加针对123456789");
            return true;
        }
        
        // 检查是否是豁免用户
        if (this.isExempt(targetQQ)) {
            e.reply("无法添加主人或机器人到监控名单");
            return true;
        }

        if (config.monitoredUsers[targetQQ]) {
            e.reply("该用户已在监控名单中");
            return true;
        }

        // 添加新用户
        config.monitoredUsers[targetQQ] = {
            muteTime: 600,      // 10分钟
            message: "请不要刷屏",
            maxMsgCount: 5,     // 5条消息
            timeWindow: 60      // 60秒内
        };

        this.saveConfig();
        e.reply(`已添加 ${targetQQ} 到监控名单`);
        return true;
    }

    // 删除被监控用户
    async removeMonitoredUser(e) {
        logger.info(`[针对禁言] 收到删除命令: ${e.msg}`);

        if (!await this.checkAuth(e)) {
            e.reply("只有主人、群主和管理员才能使用此命令");
            return true;
        }

        let targetQQ;
        // 检查是否是@方式
        const atList = e.message.filter(msg => msg.type === 'at');
        if (atList.length) {
            targetQQ = String(atList[0].qq);
        } else {
            // 尝试从消息中提取QQ号
            const match = e.msg.match(/^#删除针对\s*(\d{5,})/);
            if (match) {
                targetQQ = match[1];
            }
        }

        if (!targetQQ) {
            e.reply("请@要移除的用户或输入其QQ号\n例如：#删除针对@用户 或 #删除针对123456789");
            return true;
        }

        if (!config.monitoredUsers[targetQQ]) {
            e.reply("该用户不在监控名单中");
            return true;
        }

        delete config.monitoredUsers[targetQQ];
        this.saveConfig();
        e.reply(`已将 ${targetQQ} 从监控名单中移除`);
        return true;
    }

    // 更新用户的消息历史
    updateMessageHistory(userId, timeWindow) {
        const now = Date.now();
        if (!messageHistory[userId]) {
            messageHistory[userId] = [];
        }
        // 清理过期的消息记录
        messageHistory[userId] = messageHistory[userId].filter(timestamp => 
            now - timestamp < timeWindow * 1000
        );
        // 添加新消息记录
        messageHistory[userId].push(now);
        logger.info(`更新消息历史: ${userId} => ${messageHistory[userId].length}条消息`);
    }

    // 禁言用户
    async muteUser(e, userConfig) {
        try {
            await e.group.muteMember(e.sender.user_id, userConfig.muteTime);
            await e.reply([
                segment.at(e.sender.user_id),
                " ",
                userConfig.message,
                `\n${userConfig.timeWindow}秒内发送超过${userConfig.maxMsgCount}条消息`
            ]);
        } catch (err) {
            logger.error(`禁言失败: ${err}`);
            await e.reply("操作失败，可能是权限不足");
        }
    }
}