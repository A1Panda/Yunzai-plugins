import plugin from "../../lib/plugins/plugin.js";

// 配置信息
const config = {
    masterQQ: ["114514119", "3121280556"], // 主人QQ号列表
    botQQ: "2783939194", // 机器人QQ号
    protectedUsers: {
        "3121280556": {
            muteTime: 5, // 禁言时间（秒）
            message: "干嘛一直@我可爱的主人！", // 禁言提示消息
            maxAtCount: 3, // 最大艾特次数
            timeWindow: 60 // 时间窗口（秒）
        },
        "114514119": {
            muteTime: 10,
            message: "看不到我，看不到我，看不到我~",
            maxAtCount: 5,
            timeWindow: 120
        }
    },
    default: {
        muteTime: 600,
        message: "安静一会吧",
        maxAtCount: 20,
        timeWindow: 60
    }
};

// 记录每个用户的艾特历史
const atHistory = {};

export class checkAt extends plugin {
    constructor() {
        super({
            name: "禁止艾特插件", // 插件名称
            dsc: "艾特特定用户会被禁言", // 插件描述
            event: "message", // 监听的事件类型
            priority: 9999999, // 插件优先级
            rule: [
                {
                    reg: ".*", // 正则表达式匹配所有消息
                    fnc: "checkAt", // 触发的函数
                    log: false
                }
            ]
        });
    }

    // 检查消息中是否有艾特特定用户
    async checkAt(e) {
        if (!e.group) {
            //logger.info(`不是群消息`)
            return; // 如果不是群消息，返回
        } 

        // 检查机器人是否是群主或管理员
        if (!e.group.is_owner && !e.group.is_admin) {
            //logger.info(`机器人没有管理员或群主权限`)
            return; // 如果机器人没有管理员或群主权限，返回
        }

        const atList = e.message.filter(msg => msg.type === 'at'); // 过滤出艾特消息
        if (!atList.length) {
            //logger.info(`没有艾特消息`)
            return; // 如果没有艾特消息，返回
        } 

        for (let at of atList) {
            const targetQQ = at.qq; // 被艾特的QQ号
            const userConfig = config.protectedUsers[targetQQ] || config.default; // 获取用户配置

            if (this.isExempt(e, targetQQ)) {
                //logger.info(`豁免禁言`)
                return; // 检查是否豁免
            } 

            this.updateAtHistory(e.sender.user_id, userConfig.timeWindow); // 更新艾特历史

            if (atHistory[e.sender.user_id].length >= userConfig.maxAtCount) {
                await this.muteUser(e, userConfig); // 禁言用户
                return true;
            }
        }
    }

    // 检查是否豁免禁言
    isExempt(e, targetQQ) {
        return config.masterQQ.includes(String(e.sender.user_id)) || // 主人QQ号豁免
               (e.sender.user_id == config.botQQ && targetQQ == config.botQQ)  // 机器人自艾特豁免

    }

    // 更新用户的艾特历史
    updateAtHistory(userId, timeWindow) {
        const now = Date.now();
        if (!atHistory[userId]) {
            atHistory[userId] = [];
        }
        atHistory[userId] = atHistory[userId].filter(timestamp => now - timestamp < timeWindow * 1000); // 过滤掉超出时间窗口的记录
        atHistory[userId].push(now); // 添加当前时间戳
        logger.info(`更新艾特历史: ${atHistory[userId]}`);
    }

    // 禁言用户
    async muteUser(e, userConfig) {
        try {
            await e.group.muteMember(e.sender.user_id, userConfig.muteTime); // 执行禁言操作
            await e.reply([
                segment.at(e.sender.user_id), // 艾特被禁言的用户
                " ",
                userConfig.message // 发送禁言提示消息
            ]);
        } catch (err) {
            logger.error(`禁言失败: ${err}`); // 记录错误日志
            await e.reply("操作失败，可能是权限不足"); // 发送失败提示消息
        }
    }
}