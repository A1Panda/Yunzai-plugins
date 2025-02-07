import fs from "fs";
import puppeteer from "../../lib/puppeteer/puppeteer.js";

// 截图前等待的时间
const screenWaitTime = 3;

export class Screenshot extends plugin {
    constructor() {
        super({
            name: "[R插件补集]http截图",
            dsc: "http截图",
            event: "message",
            priority: 5000,
            rule: [
                {
                    reg: "^http",
                    fnc: "screenshot",
                },
                {
                    reg: "^#截图(开启|关闭|切换)$",
                    fnc: "screenshotStatus",
                },
                {
                    reg: "^#gittr$",
                    fnc: "githubTrending",
                },
            ],
        });
        // 创建临时目录
        if (!fs.existsSync('./temp')) {
            fs.mkdirSync('./temp', { recursive: true });
        }
        // 默认使用长截图
        this.fullScreen = true;
    }

    async delay(timeout) {
        return new Promise(resolve => setTimeout(resolve, timeout));
    }

    async screenshotStatus(e) {
        if (!e.isMaster) {
            e.reply("只有主人才能切换截图模式");
            return true;
        }

        const command = e.msg.replace('#截图', '');
        
        switch (command) {
            case '开启':
                this.fullScreen = true;
                e.reply("已开启长截图模式");
                break;
            case '关闭':
                this.fullScreen = false;
                e.reply("已关闭长截图模式");
                break;
            case '切换':
                this.fullScreen = !this.fullScreen;
                e.reply(`已${this.fullScreen ? '开启' : '关闭'}长截图模式`);
                break;
        }

        logger.info(`[截图] ${this.fullScreen ? '开启' : '关闭'}长截图模式`);
        return true;
    }

    async screenshot(e) {
        if (!e.isMaster) {
            logger.info("[截图] 检测到当前不是主人，忽略");
            return true;
        }

        const url = e.msg.trim();
        if (!url.startsWith('http')) {
            e.reply("请输入正确的网址");
            return true;
        }

        e.reply("开始截图，请稍候...");
        await this.sendScreenShot(url, this.fullScreen);
        return true;
    }

    async githubTrending(e) {
        if (!e.isMaster) {
            logger.info("[截图] 检测到当前不是主人，忽略");
            return true;
        }
        e.reply("正在获取GitHub趋势...");
        await this.sendNormalScreenShot("https://github.com/trending", true);
        return true;
    }

    async sendNormalScreenShot(link, fullPage = true) {
        let browser = null;
        try {
            // 打开一个新的页面
            browser = await puppeteer.browserInit();
            const page = await browser.newPage();
            // 导航到你想要截图的URL
            await page.goto(link);
            logger.info(`开始截图...${link}`);
            // 设置截图的大小和视口尺寸
            // await page.setViewport({ width: 1280, height: 800 });
            // 截图并保存到文件
            await page.screenshot({
                path: './screenshot.png',
                type: 'jpeg',
                fullPage: fullPage,
                omitBackground: false,
                quality: 70
            });
            await this.e.reply(segment.image(fs.readFileSync("./screenshot.png")));
            await browser.close();
        } catch (error) {
            logger.error(`截图失败: ${error}`);
            if (browser) {
                await browser.close();
            }
        }
    }

    async sendScreenShot(link, fullPage = true) {
        let browser = null;
        let tempFile = null;
        try {
            browser = await puppeteer.browserInit();
            let page = await browser.newPage();
            
            // 设置视口
            await page.setViewport({ 
                width: 1920, 
                height: 1080,
                deviceScaleFactor: 1
            });

            // 访问页面并截图
            await page.goto(link);
            logger.info(`开始截图...${link}`);
            await this.delay(screenWaitTime * 1000);

            // 生成临时文件名
            tempFile = `./temp/screenshot_${Date.now()}.png`;

            // 第一次截图
            await page.screenshot({
                path: tempFile,
                type: "png",
                fullPage: fullPage,
                omitBackground: false
            });

            // 准备HTML内容
            const screenshotBase64 = fs.readFileSync(tempFile, "base64");
            const htmlContent = screenRender(screenshotBase64, link);

            // 创建新页面而不是重用当前页面
            const newPage = await browser.newPage();
            await newPage.setViewport({
                width: 1920,
                height: 1080,
                deviceScaleFactor: 1
            });

            // 设置HTML内容
            await newPage.setContent(htmlContent);

            // 等待渲染完成
            await newPage.evaluate(() => {
                return new Promise((resolve) => {
                    if (document.querySelector('.browser-window')) {
                        resolve();
                    } else {
                        const observer = new MutationObserver(() => {
                            if (document.querySelector('.browser-window')) {
                                observer.disconnect();
                                resolve();
                            }
                        });
                        observer.observe(document.body, {
                            childList: true,
                            subtree: true
                        });
                    }
                });
            });

            // 获取元素并截图
            const element = await newPage.$('.browser-window');
            if (!element) {
                throw new Error('找不到浏览器窗口元素');
            }

            // 最终截图
            await element.screenshot({
                path: tempFile,
                type: "png",
                omitBackground: false
            });

            // 发送图片
            await this.e.reply(segment.image(fs.readFileSync(tempFile)));
            return true;

        } catch (error) {
            logger.error(`截图失败: ${error}`);
            if (!error.message.includes('找不到浏览器窗口元素')) {
                await this.e.reply("截图失败，尝试使用备用方案...");
                // 使用原始截图作为备用方案
                if (tempFile && fs.existsSync(tempFile)) {
                    await this.e.reply(segment.image(fs.readFileSync(tempFile)));
                    return true;
                }
            }
            return false;
        } finally {
            // 清理资源
            if (browser) {
                await browser.close();
            }
            if (tempFile && fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }
        }
    }
}

function screenRender(screenshotBase64, url) {
    return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>网页截图</title>
        <style>
            :root {
                --window-bg: #ffffff;
                --header-bg: #f0f0f0;
                --border-color: #e0e0e0;
                --shadow-color: rgba(0, 0, 0, 0.12);
                --close-btn: #ff5f57;
                --minimize-btn: #ffbd2e;
                --maximize-btn: #28c940;
                --url-text: #333;
                --url-bg: #ffffff;
            }

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                min-height: 100vh;
                display: grid;
                place-items: center;
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                padding: 2rem;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .container {
                width: 100%;
                max-width: 1920px;
                margin: 0 auto;
            }

            .browser-window {
                background-color: var(--window-bg);
                border-radius: 10px;
                box-shadow: 
                    0 12px 20px var(--shadow-color),
                    0 2px 6px rgba(0, 0, 0, 0.08),
                    0 0 1px rgba(0, 0, 0, 0.1);
                overflow: hidden;
                transform: translateZ(0);
                backdrop-filter: blur(10px);
                border: 1px solid var(--border-color);
            }

            .browser-header {
                background-color: var(--header-bg);
                padding: 12px 16px;
                display: flex;
                align-items: center;
                gap: 16px;
                border-bottom: 1px solid var(--border-color);
                height: 48px;
            }

            .browser-buttons {
                display: flex;
                gap: 8px;
                flex-shrink: 0;
            }

            .browser-button {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                position: relative;
                transition: all 0.2s ease;
                box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
            }

            .browser-button::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                border-radius: 50%;
                box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
                opacity: 0;
                transition: opacity 0.2s ease;
            }

            .browser-button:hover::after {
                opacity: 1;
            }

            .close { background-color: var(--close-btn); }
            .minimize { background-color: var(--minimize-btn); }
            .maximize { background-color: var(--maximize-btn); }

            .url-bar {
                flex: 1;
                background: var(--url-bg);
                border-radius: 6px;
                padding: 8px 12px;
                font-size: 13px;
                color: var(--url-text);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                border: 1px solid var(--border-color);
                box-shadow: 
                    inset 0 0 0 1px rgba(255, 255, 255, 0.1),
                    0 1px 2px rgba(0, 0, 0, 0.05);
                font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                user-select: none;
                position: relative;
            }

            .url-bar::before {
                content: '';
                position: absolute;
                left: 8px;
                top: 50%;
                transform: translateY(-50%);
                width: 16px;
                height: 16px;
                background: #888;
                border-radius: 50%;
                opacity: 0.2;
            }

            .screenshot-container {
                position: relative;
                line-height: 0;
            }

            .screenshot {
                width: 100%;
                height: auto;
                display: block;
            }

            @media (max-width: 768px) {
                body {
                    padding: 1rem;
                }
                
                .browser-header {
                    padding: 10px 12px;
                    height: 42px;
                }

                .url-bar {
                    font-size: 12px;
                    padding: 6px 10px;
                }
            }

            @media (prefers-color-scheme: dark) {
                :root {
                    --window-bg: #2d2d2d;
                    --header-bg: #1f1f1f;
                    --border-color: #404040;
                    --url-text: #e0e0e0;
                    --url-bg: #333333;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="browser-window">
                <div class="browser-header">
                    <div class="browser-buttons">
                        <div class="browser-button close"></div>
                        <div class="browser-button minimize"></div>
                        <div class="browser-button maximize"></div>
                    </div>
                    <div class="url-bar">${url || 'https://example.com'}</div>
                </div>
                <div class="screenshot-container">
                    <img class="screenshot" src="data:image/png;base64,${screenshotBase64}" alt="Screenshot">
                </div>
            </div>
        </div>
    </body>
    </html>`;
}