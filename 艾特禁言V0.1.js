// 配置信息
const config = {
    // 主人QQ号列表
    masterQQ: ["2315823357", "3121280556"],
    // 机器人自己的QQ号
    botQQ: "2783939194",
    // 不能艾特的QQ号配置
    protectedUsers: {
        "3121280556": {
            muteTime: 5,//设置禁言的时间，单位为秒
            message: "非紧急问题请逐层反馈，联系城镇内反馈员提交", //发送的消息
            maxAtCount: 3, //最大艾特次数
            timeWindow: 60 //时间窗口，单位为秒
        },
        "2315823357": {
            muteTime: 10,
            message: "带内容艾特，欢迎反馈bug啥的",
            maxAtCount: 5,
            timeWindow: 120
        }
    },
    // 默认配置
    default: {
        muteTime: 600,
        message: "安静一会吧",
        maxAtCount: 3,
        timeWindow: 60
    }
};

import plugin from "../../lib/plugins/plugin.js";

// 记录每个用户的艾特历史
const atHistory = {};

export class example extends plugin {
    constructor() {
        super({
            name: "禁止艾特插件",
            dsc: "艾特特定用户会被禁言",
            event: "message",
            priority: 5000,
            rule: [
                {
                    reg: ".*",
                    fnc: "checkAt"
                }
            ]
        });
    }

    async checkAt(e) {
        if (!e.group) return;
        
        // 检查消息中是否包含at
        const atList = e.message.filter(msg => msg.type === 'at');
        if (!atList.length) return;
        
        // 检查被at的人是否在配置列表中
        for (let at of atList) {
            const targetQQ = at.qq;
            const userConfig = config.protectedUsers[targetQQ] || config.default;
            
            if (userConfig) {
                // 检查是否是主人在艾特
                if (config.masterQQ.includes(String(e.sender.user_id))) {
                    return;
                }
                
                // 检查是否是机器人自己在艾特自己
                if (e.sender.user_id == config.botQQ && targetQQ == config.botQQ) {
                    return;
                }
                
                const now = Date.now();
                // 过滤掉超过时间窗口的艾特记录
                const history = atHistory[e.sender.user_id] || [];
                atHistory[e.sender.user_id] = history.filter(timestamp => now - timestamp < userConfig.timeWindow * 1000);
                // 添加当前艾特记录
                atHistory[e.sender.user_id].push(now);
                
                // 打印调试信息
                //logger.info(`用户 ${e.sender.user_id} 的艾特历史:`, atHistory[e.sender.user_id]);
                
                // 检查艾特次数是否超过限制
                if (atHistory[e.sender.user_id].length >= userConfig.maxAtCount) {
                    const muteTime = userConfig.muteTime;
                    const message = userConfig.message;
                    
                    try {
                        // 禁言发送者
                        await e.group.muteMember(e.sender.user_id, muteTime);
                        
                        // 发送带有at的消息
                        await e.reply([
                            segment.at(e.sender.user_id),
                            " ",
                            message
                        ]);
                    } catch (err) {
                        logger.error(`禁言失败: ${err}`);
                        await e.reply("操作失败，可能是权限不足");
                    }
                    return true;
                }
            }
        }
    }
}