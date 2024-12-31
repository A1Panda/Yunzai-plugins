// 配置信息
const masterQQ = ["3121280556", "141919810"];
const botQQ = "2783939194";
const protectedUsers = {
    "3121280556": {
        muteTime: 5, // 设置禁言的时间，单位为秒
        message: "这是一条可爱的消息喵~", // 发送的消息
        maxAtCount: 3, // 最大艾特次数
        timeWindow: 60 // 时间窗口，单位为秒
    },
    "114514119": {
        muteTime: 10,
        message: "看不到我，看不到我，看不到我~",
        maxAtCount: 5,
        timeWindow: 120
    }
};
const defaultConfig = {
    muteTime: 600,
    message: "安静一会吧",
    maxAtCount: 10, //防止误触发
    timeWindow: 1  //防止误触发
};

import plugin from "../../lib/plugins/plugin.js";

// 记录每个用户的艾特历史
const atHistory = new Map();

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


        // 检查消息中是否有艾特特定用户
        const atUsers = e.message.filter(msg => msg.type === 'at').map(msg => msg.qq);
        for (const user of atUsers) {
            const config = protectedUsers[user] || defaultConfig;
            const now = Date.now();
            if (!atHistory.has(user)) {
                atHistory.set(user, []);
            }
            const history = atHistory.get(user);
            history.push(now);

            // 移除时间窗口之外的记录
            while (history.length && now - history[0] > config.timeWindow * 1000) {
                history.shift();
            }

            // 打印调试信息
            logger.info(`用户 ${user} 的艾特历史:`, atHistory.get(user));

            if (history.length >= config.maxAtCount) {
                // 禁言操作
                await e.group.muteMember(e.sender.user_id, config.muteTime);
                // 发送消息
                await e.reply(config.message);
                // 清空历史记录
                atHistory.set(user, []);
            }
        }
    }
}