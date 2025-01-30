# Yunzai-Bot 插件合集

<div align="center">
  
![Yunzai-Bot](https://img.shields.io/badge/Yunzai-Bot-blue)
![license](https://img.shields.io/github/license/A1Panda/Yunzai-plugins)
![stars](https://img.shields.io/github/stars/A1Panda/Yunzai-plugins)

</div>

## 📖 目录

- [插件列表](#-插件列表)
- [安装说明](#-安装说明)
- [插件详情](#-插件详情)
- [问题反馈](#-问题反馈)
- [关于作者](#-关于作者)
- [致谢](#-致谢)

## 🎮 插件列表

| 插件名称 | 版本 | 描述 | 状态 |
| --- | --- | --- | --- |
| [艾特禁言](./艾特禁言V0.2.js) | V0.2 | 防止特定用户被频繁艾特的管理插件 | ✅ |
| [自动处理进群事件](./自动处理进群事件V3.0.js) | V3.0 | 智能处理加群申请的管理插件 | ✅ |
| [爱发电赞助](./爱发电赞助V1.0.js) | V1.0 | 爱发电平台赞助管理插件 | ✅ |

## 📥 安装说明

### 方式一：使用curl命令安装（推荐）

选择需要的插件，复制对应的安装命令执行即可：

**艾特禁言插件：**
\`\`\`bash
curl -o "./plugins/example/艾特禁言V0.2.js" "https://raw.githubusercontent.com/A1Panda/Yunzai-plugins/main/%E8%89%BE%E7%89%B9%E7%A6%81%E8%A8%80V0.2.js"
\`\`\`

**自动处理进群事件插件：**
\`\`\`bash
curl -o "./plugins/example/自动处理进群事件V3.0.js" "https://raw.githubusercontent.com/A1Panda/Yunzai-plugins/main/%E8%87%AA%E5%8A%A8%E5%A4%84%E7%90%86%E8%BF%9B%E7%BE%A4%E4%BA%8B%E4%BB%B6V3.0.js"
\`\`\`

**爱发电赞助插件：**
\`\`\`bash
curl -o "./plugins/example/爱发电赞助V1.0.js" "https://raw.githubusercontent.com/A1Panda/Yunzai-plugins/main/%E7%88%B1%E5%8F%91%E7%94%B5%E8%B5%9E%E5%8A%A9V1.0.js"
\`\`\`

### 方式二：手动下载

1. 点击上方插件列表中的插件链接
2. 下载对应的 `.js` 文件
3. 将文件放入 Yunzai-Bot 的 `plugins/example` 目录下

## 📚 插件详情

### 🔒 艾特禁言插件 (V0.2)

#### 功能特点
- 🛡️ 防止特定用户被频繁艾特
- ⚙️ 支持自定义配置（禁言时间、提示消息等）
- 👑 支持主人豁免功能
- 🤖 机器人自艾特豁免

#### 更新日志
- **V0.2**: 
  - 修复机器人权限判断问题
  - 修复非管理员权限问题
- **V0.1**: 
  - 初始重构版本

### 🚪 自动处理进群事件插件 (V3.0)

#### 功能特点
- 📝 自动处理加群申请
- ⚫ 黑名单管理系统
- 👥 用户等级检查
- 🔄 实时配置更新

### 💰 爱发电赞助插件 (V1.0)

#### 功能特点
- 📋 赞助列表管理
- ➕ 手动添加赞助记录
- 🔄 自动更新赞助信息
- 💌 赞助感谢功能

#### 配置要求
- 需要配置爱发电的 \`user_id\` 和 API \`token\`
- 在爱发电[开发者设置](https://afdian.com/dashboard/dev)中获取相关信息

## ❓ 问题反馈

如果您在使用过程中遇到任何问题，欢迎通过以下方式反馈：

- 提交 [Issues](https://github.com/A1Panda/Yunzai-plugins/issues)
- 加入 QQ交流群：[511802473](https://qm.qq.com/cgi-bin/qm/qr?k=_ijLWFUaVZcbFZo4plw8TTrlKYA6_z8o&jump_from=webapi&authKey=IUMFkY4CWqXcnS75X6tQZ5pmVfx5X3SDpmfqDqGnmNJDAdUyrj+x7a1fWOQ3mOQ4)

## 👨‍💻 关于作者

- **GitHub**: [A1Panda](https://github.com/A1Panda)
- **QQ交流群**: [511802473](https://qm.qq.com/cgi-bin/qm/qr?k=_ijLWFUaVZcbFZo4plw8TTrlKYA6_z8o&jump_from=webapi&authKey=IUMFkY4CWqXcnS75X6tQZ5pmVfx5X3SDpmfqDqGnmNJDAdUyrj+x7a1fWOQ3mOQ4)

## 🙏 致谢

感谢以下开发者对本项目的贡献：

| 贡献者 | 贡献内容 |
| :---: | --- |
| [浅巷墨黎](https://github.com/dnyo666) | 艾特禁言插件原作者 |

## 📄 开源协议

本项目采用 [MIT](LICENSE) 协议开源。
