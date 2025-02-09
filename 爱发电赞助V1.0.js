/**
 * 爱发电赞助者名单管理插件
 * 
 * 功能：
 * 1. #赞助列表 - 显示赞助者名单
 * 2. #赞助添加 - 手动添加赞助记录
 * 3. #赞助移除 - 移除赞助记录
 * 4. #更新赞助 - 从爱发电API更新赞助信息
 * 5. #感谢赞助 - 感谢赞助者
 * 
 * 注意：爱发电订单需要在留言中填写QQ号才能被系统关联
 */

import plugin from '../../lib/plugins/plugin.js'
import fs from 'fs'
import crypto from 'crypto'

// 配置项
const CONFIG = {
    uid: '',  // 这里填上你的爱发电user_id
    token: '',  // 这里填上你的爱发电token
    dataDir: './data/SponsorList',
    dataFile: './data/SponsorList/users.json',
    messages: {
        listHeader: '赞助列表:',
        listFooter: '\n由衷感谢各位的赞助!',
        noPermission: '非主人权限，无法执行该操作',
        addFormatError: '格式错误，请使用以下格式：\n1. #赞助添加 @用户 金额\n2. #赞助添加 QQ号 金额\n3. #赞助添加 QQ号 昵称 金额',
        removeFormatError: '格式错误，请使用：#赞助移除 @用户 或 #赞助移除 QQ号',
        invalidQQ: '请输入有效的QQ号',
        invalidAmount: '请输入有效的金额数字',
        userNotFound: '未找到该用户的赞助记录',
        qqNumberRequired: '💡 提示：请在爱发电订单留言中填写QQ号，以便系统关联信息',
        thankTemplate: [
            '感谢 {name} 的赞助支持！',
            '金额：{amount}元',
            '\n您的支持是我持续更新的动力！'
        ].join('\n')
    }
}

// 命令正则
const COMMANDS = {
    list: /^#赞助(名单|列表)(.*)/,
    add: /^#赞助添加\s*(.*)/,
    remove: /^#赞助移除\s*(.*)/,
    refresh: /^#更新赞助(.*)/,
    thank: /^#感谢赞助$/
}

export class sponsor extends plugin {
    constructor() {
        super({
            name: 'sponsorlist',
            dsc: 'sponsor management',
            event: 'message',
            priority: 5000,
            rule: [
                { reg: COMMANDS.list, fnc: 'showList' },
                { reg: COMMANDS.add, fnc: 'sponsorAdd' },
                { reg: COMMANDS.remove, fnc: 'sponsorRemove' },
                { reg: COMMANDS.refresh, fnc: 'refresh' },
                { reg: COMMANDS.thank, fnc: 'thankSponsors' }
            ]
        })
        this.init()
    }

    // 初始化
    init() {
        if (!fs.existsSync(CONFIG.dataDir)) {
            fs.mkdirSync(CONFIG.dataDir)
        }
        if (!fs.existsSync(CONFIG.dataFile)) {
            fs.writeFileSync(CONFIG.dataFile, '{}')
        }
    }

    // 读取赞助数据
    readSponsorData() {
        try {
            return JSON.parse(fs.readFileSync(CONFIG.dataFile))
        } catch (err) {
            logger?.error?.('读取赞助数据失败:', err)
            return {}
        }
    }

    // 保存赞助数据
    saveSponsorData(data) {
        try {
            fs.writeFileSync(CONFIG.dataFile, JSON.stringify(data, null, 2))
            return true
        } catch (err) {
            logger?.error?.('保存赞助数据失败:', err)
            return false
        }
    }

    // 生成API签名
    createSign(params) {
        const time = Math.floor(Date.now() / 1000)
        const md5 = crypto.createHash('md5')
            .update(`${CONFIG.token}params${params}ts${time}user_id${CONFIG.uid}`)
            .digest('hex')
        return `user_id=${CONFIG.uid}&ts=${time}&params=${params}&sign=${md5}`
    }

    // 获取用户昵称
    async getUserNickname(e, qq) {
        try {
            const member = e.group.pickMember(qq)
            return member.card || member.nickname || qq
        } catch (err) {
            return qq
        }
    }

    // 显示赞助列表
    async showList(e) {
        const list = this.readSponsorData()
        const sortedList = Object.entries(list)
            .sort((a, b) => parseFloat(b[1][1]) - parseFloat(a[1][1]))

        let totalAmount = 0
        const message = [CONFIG.messages.listHeader]

        for (const [qq, [name, amount]] of sortedList) {
            totalAmount += parseFloat(amount)
            message.push(`\n-${name}(${qq}) | ${amount}元`)
        }

        message.push(CONFIG.messages.listFooter)
        e.reply(message)
        return true
    }

    // 添加赞助记录
    async sponsorAdd(e) {
        if (!e.isMaster) {
            return e.reply(CONFIG.messages.noPermission)
        }

        let qq, nickname, amount

        if (e.message?.[1]?.type === 'at') {
            // @用户方式
            if (!e.message[2]?.text) {
                return e.reply(CONFIG.messages.addFormatError)
            }
            qq = e.message[1].qq
            amount = e.message[2].text.trim()
            nickname = await this.getUserNickname(e, qq)
        } else {
            // 直接输入方式
            const args = e.msg.replace(/^#赞助添加\s*/, '').trim().split(/\s+/)
            if (args.length === 2) {
                // #赞助添加 QQ号 金额
                [qq, amount] = args
                if (!/^\d+$/.test(qq)) {
                    return e.reply(CONFIG.messages.invalidQQ)
                }
                try {
                    nickname = await this.getUserNickname(e, qq)
                } catch (err) {
                    nickname = qq
                }
            } else if (args.length === 3) {
                // #赞助添加 QQ号 昵称 金额
                [qq, nickname, amount] = args
                if (!/^\d+$/.test(qq)) {
                    return e.reply(CONFIG.messages.invalidQQ)
                }
            } else {
                return e.reply(CONFIG.messages.addFormatError)
            }
        }

        // 验证金额
        if (isNaN(amount)) {
            return e.reply(CONFIG.messages.invalidAmount)
        }

        const list = this.readSponsorData()
        list[qq] = [nickname, amount]
        
        if (this.saveSponsorData(list)) {
            e.reply(`已添加赞助记录：${nickname}(${qq}) => ${amount}元`)
            return true
        }
        return false
    }

    // 移除赞助记录
    async sponsorRemove(e) {
        if (!e.isMaster) {
            return e.reply(CONFIG.messages.noPermission)
        }

        let qq = e.message?.[1]?.type === 'at' 
            ? e.message[1].qq 
            : e.msg.replace(/^#赞助移除\s*/, '').trim()

        if (!/^\d+$/.test(qq)) {
            return e.reply(CONFIG.messages.removeFormatError)
        }

        const list = this.readSponsorData()
        if (!list[qq]) {
            return e.reply(CONFIG.messages.userNotFound)
        }

        const [nickname, amount] = list[qq]
        delete list[qq]

        if (this.saveSponsorData(list)) {
            e.reply(`已移除赞助记录：${nickname}(${qq}) | ${amount}元`)
            return true
        }
        return false
    }

    // 处理订单数据
    processOrders(orders) {
        const userQQMap = new Map()
        const noQQOrders = []
        const qqRegex = /(?:^|[^0-9])([1-9][0-9]{4,11})(?:[^0-9]|$)/

        for (const order of orders) {
            const qqMatch = order.remark.match(qqRegex)
            if (qqMatch) {
                userQQMap.set(order.user_id, {
                    qq: qqMatch[1],
                    remark: order.remark
                })
            } else {
                noQQOrders.push({
                    user_id: order.user_id,
                    remark: order.remark,
                    amount: order.total_amount
                })
            }
        }

        return { userQQMap, noQQOrders }
    }

    // 处理赞助者数据
    processSponsorData(sponsors, userQQMap) {
        const list = this.readSponsorData()
        let updated = 0
        let skipped = 0
        let totalAmount = 0

        for (const sponsor of sponsors) {
            const userInfo = userQQMap.get(sponsor.user.user_id)
            if (userInfo) {
                list[userInfo.qq] = [
                    sponsor.user.name,
                    sponsor.all_sum_amount
                ]
                updated++
                totalAmount += parseFloat(sponsor.all_sum_amount)
            } else {
                skipped++
            }
        }

        return { list, stats: { updated, skipped, totalAmount } }
    }

    // 生成更新报告
    async generateReport(stats, noQQOrders, sponsors) {
        const report = [
            "赞助信息更新完成！",
            `✓ 成功更新: ${stats.updated} 条记录`,
            `✗ 未能关联: ${stats.skipped} 条记录`,
            `💰 总赞助金额: ${stats.totalAmount.toFixed(2)} 元\n`
        ]

        if (noQQOrders.length > 0) {
            // 创建转发消息数组
            let forwardMsg = [{
                name: Bot.nickname,
                user_id: Bot.uin,
                message: "⚠️ 以下订单未能提取到QQ号："
            }]
            
            // 为每个未关联的订单创建单独的消息
            for (const order of noQQOrders) {
                const sponsor = sponsors.find(s => s.user.user_id === order.user_id)
                const orderInfo = [
                    `订单金额: ${order.amount}元`,
                    `爱发电用户: ${sponsor?.user.name || '未知用户'}`,
                    `留言内容: ${order.remark || '无留言'}`
                ].join('\n')
                
                forwardMsg.push({
                    name: Bot.nickname,
                    user_id: Bot.uin,
                    message: orderInfo
                })
            }

            // 添加提示信息
            forwardMsg.push({
                name: Bot.nickname,
                user_id: Bot.uin,
                message: CONFIG.messages.qqNumberRequired
            })

            // 返回包含基础信息和转发消息的数组
            return {
                reportMsg: report.join('\n'),
                forwardMsg: forwardMsg
            }
        }

        return {
            reportMsg: report.join('\n')
        }
    }

    // 从API更新赞助信息
    async refresh(e) {
        try {
            const [sponsorRes, orderRes] = await Promise.all([
                fetch(`https://afdian.com/api/open/query-sponsor?${this.createSign('{"page":1,"per_page":100}')}`).then(r => r.json()),
                fetch(`https://afdian.com/api/open/query-order?${this.createSign('{"page":1,"per_page":100}')}`).then(r => r.json())
            ])

            if (sponsorRes.ec !== 200 || orderRes.ec !== 200) {
                return e.reply(`更新失败: ${sponsorRes.em || orderRes.em}`)
            }

            const { userQQMap, noQQOrders } = this.processOrders(orderRes.data.list)
            const { list, stats } = this.processSponsorData(sponsorRes.data.list, userQQMap)
            
            if (this.saveSponsorData(list)) {
                const report = await this.generateReport(stats, noQQOrders, sponsorRes.data.list)
                
                // 发送基础报告
                await e.reply(report.reportMsg)
                
                // 如果有未关联订单，发送转发消息
                if (report.forwardMsg) {
                    // 使用Yunzai-Bot的转发消息接口
                    await e.reply(await e.group.makeForwardMsg(report.forwardMsg))
                }
                
                return true
            }
            return false
        } catch (err) {
            logger?.error?.(err)
            return e.reply(`更新失败: ${err.message}`)
        }
    }

    // 感谢赞助者
    async thankSponsors(e) {
        if (!e.isMaster) {
            return e.reply(CONFIG.messages.noPermission)
        }

        const list = this.readSponsorData()
        if (Object.keys(list).length === 0) {
            return e.reply('当前没有赞助记录')
        }

        // 发送总体感谢
        await e.reply([
            '开始向赞助者发送感谢消息...',
            `共有 ${Object.keys(list).length} 位赞助者`
        ].join('\n'))

        let succeeded = 0
        let failed = 0

        for (const [qq, [name, amount]] of Object.entries(list)) {
            try {
                // 构建感谢消息
                const thankMsg = CONFIG.messages.thankTemplate
                    .replace('{name}', name)
                    .replace('{amount}', amount)

                // 发送私聊消息
                await Bot.pickUser(qq).sendMsg(thankMsg)
                succeeded++

                // 等待一小段时间，避免发送太快
                await new Promise(resolve => setTimeout(resolve, 1000))
            } catch (err) {
                logger?.error?.(`向 ${qq} 发送感谢消息失败:`, err)
                failed++
            }
        }

        // 发送结果报告
        await e.reply([
            '感谢消息发送完成！',
            `✓ 成功: ${succeeded} 条`,
            `✗ 失败: ${failed} 条`
        ].join('\n'))

        return true
    }
}