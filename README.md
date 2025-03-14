# blivedm-js

B站直播弹幕协议的Node.js实现，包含WebSocket客户端。

## 功能特性

- 支持WebSocket协议的B站直播弹幕获取
- 支持多种消息类型：
  - 弹幕
  - 礼物
  - 醒目留言（SC）
  - 上舰
  - 用户进入直播间
  - 点赞信息
  - 系统通知
  等...

## 安装

```bash
npm install blivedm-js
```

## 使用示例

```javascript
const { BLiveClient } = require('blivedm-js');
const { BaseHandler } = require('blivedm-js/handlers');

// 创建自定义消息处理器
class MyHandler extends BaseHandler {
    // 弹幕消息
    _on_danmaku(client, message) {
        console.log(`[${client.roomId}] ${message.uname}: ${message.msg}`);
    }

    // 礼物消息
    _on_gift(client, message) {
        console.log(`[${client.roomId}] ${message.uname} 赠送 ${message.giftName}x${message.num}`);
    }

    // 醒目留言
    _on_super_chat(client, message) {
        console.log(`[${client.roomId}] 醒目留言 ￥${message.price} ${message.uname}: ${message.message}`);
    }
}

// 使用示例
async function main() {
    const roomId = 你的房间ID;  // 替换为实际的房间ID
    const client = new BLiveClient(roomId);
    const handler = new MyHandler();
    client.set_handler(handler);
    
    await client.start();
    console.log('弹幕获取已启动');
}

main().catch(console.error);
```

## 支持的消息类型

- `DANMU_MSG`: 弹幕消息
- `SEND_GIFT`: 礼物消息
- `GUARD_BUY`: 上舰消息
- `SUPER_CHAT_MESSAGE`: 醒目留言（SC）
- `INTERACT_WORD`: 用户进入直播间
- `LIKE_INFO_V3_CLICK`: 用户点赞
- 更多消息类型请参考源码...

## 自定义处理器

你可以通过继承 `BaseHandler` 类来创建自定义的消息处理器：

```javascript
class MyHandler extends BaseHandler {
    // 重写你想处理的消息方法
    _on_danmaku(client, message) {
        // 处理弹幕消息
    }

    _on_gift(client, message) {
        // 处理礼物消息
    }
}
```

## 许可证

MIT License 