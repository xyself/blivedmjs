
# blivedmjs

B站直播弹幕协议 Node.js 实现，支持新版 INTERACT_WORD_V2 协议，WebSocket 直连，弹幕/礼物/SC/上舰/互动等多种消息，适合 Node.js 服务端和工具开发。

## 特性

- 支持 B 站 WebSocket 协议，实时获取直播间弹幕、礼物、SC、上舰、互动等消息
- 兼容新版 INTERACT_WORD_V2（protobuf/pb结构）
- 支持多房间、自动去重、消息类型丰富
- 可自定义消息处理器，适合二次开发
- 支持开放平台弹幕（OpenLiveClient）

## 安装

```bash
npm install blivedmjs
```

## 快速上手

```javascript
const { BLiveClient, BaseHandler } = require('blivedmjs');

class MyHandler extends BaseHandler {
    _on_danmaku(client, msg) {
        console.log(`[${client.roomId}] ${msg.uname}: ${msg.msg}`);
    }
    _on_gift(client, msg) {
        console.log(`[${client.roomId}] ${msg.uname} 赠送 ${msg.giftName}x${msg.num}`);
    }
    _on_super_chat(client, msg) {
        console.log(`[${client.roomId}] SC ￥${msg.price} ${msg.uname}: ${msg.message}`);
    }
    _on_interact_word(client, msg) {
        console.log(`[${client.roomId}] ${msg.uname} 进入直播间`);
    }
}

async function main() {
    const client = new BLiveClient(房间ID); // 你的房间ID
    client.set_handler(new MyHandler());
    await client.start();
    console.log('已连接，等待消息...');
}

main().catch(console.error);
```

## 支持的消息类型

- `DANMU_MSG`：弹幕
- `SEND_GIFT`：礼物
- `GUARD_BUY`：上舰
- `SUPER_CHAT_MESSAGE`：醒目留言（SC）
- `INTERACT_WORD_V2`：新版用户互动（进入/关注/分享/点赞等，兼容pb结构）
- `LIKE_INFO_V3_CLICK`：用户点赞
- `NOTICE_MSG`：系统通知
- 其他类型详见源码和 BaseHandler 注释

## 进阶用法

- 支持多房间监听、自动心跳、断线重连
- 支持自定义 handler，重写任意消息处理方法
- 支持开放平台弹幕（OpenLiveClient、OpenLiveHandler）

## 目录结构

- `src/clients/web_client.js`：主 WebSocket 客户端
- `src/handlers/base_handler.js`：基础消息处理器（可继承）
- `src/models/web.js`：所有消息类型模型，兼容新版 pb 协议
- `test/`：测试用例和示例

## 许可证

MIT License
