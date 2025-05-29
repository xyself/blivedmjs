const { BLiveClient } = require('../src/clients/web_client.js');
const { OpenLiveClient } = require('../src/clients/open_live_client.js');
const BaseHandler = require('../src/handlers/base_handler.js');

// 测试房间ID列表
const TEST_ROOM_IDS = [
];

// 已登录账号的cookie中的SESSDATA字段值（可选）
// 开放平台配置（可选）
const ACCESS_KEY_ID = '';
const ACCESS_KEY_SECRET = '';
const APP_ID = 0;
const ROOM_OWNER_AUTH_CODE = '';

class MyHandler extends BaseHandler {
    on_client_start(client) {
        console.log(`[${client.roomId}] 客户端已启动`);
    }

    on_client_stop(client) {
        console.log(`[${client.roomId}] 客户端已停止`);
    }

    _on_heartbeat(client, message) {
        console.log(`[${client.roomId}] 心跳包，人气值: ${message.popularity}`);
    }

    _on_danmaku(client, message) {
        console.log(`[${client.roomId}] ${message.uname}${message.medal.level > 0 ? `[${message.medal.name}${message.medal.level}]` : ''}: ${message.msg}`);
    }

    _on_gift(client, message) {
        console.log(`[${client.roomId}] ${message.uname} 赠送 ${message.giftName}x${message.num} (${message.coinType === 'gold' ? '金瓜子' : '银瓜子'}x${message.totalCoin})`);
    }

    _on_buy_guard(client, message) {
        const guardLevelName = ['', '总督', '提督', '舰长'][message.guardLevel];
        console.log(`[${client.roomId}] ${message.username} 开通了 ${guardLevelName}`);
    }

    _on_super_chat(client, message) {
        console.log(`[${client.roomId}] 醒目留言 ￥${message.price} ${message.uname}: ${message.message}`);
    }

    _on_super_chat_delete(client, message) {
        console.log(`[${client.roomId}] 删除醒目留言`);
    }

    _on_like(client, message) {
        console.log(`[${client.roomId}] 收到点赞`);
    }

    _on_interact_word(client, message) {
        const medal_str = message.fans_medal.medal_level > 0 ? `[${message.fans_medal.medal_name}${message.fans_medal.medal_level}]` : '';
        const user_str = `${message.uname}${medal_str}`;
        
        switch (message.msgType) {
            case 1:
                console.log(`[${client.roomId}] ${user_str} 进入直播间`);
                break;
            case 2:
                console.log(`[${client.roomId}] ${user_str} 关注了主播`);
                break;
            case 3:
                console.log(`[${client.roomId}] ${user_str} 分享了直播间`);
                break;
            case 4:
                console.log(`[${client.roomId}] ${user_str} 特别关注了主播`);
                break;
            case 5:
                console.log(`[${client.roomId}] ${user_str} 与主播互粉了`);
                break;
            case 6:
                console.log(`[${client.roomId}] ${user_str} 为主播点赞了`);
                break;
            default:
                console.log(`[${client.roomId}] ${user_str} 未知互动类型: ${message.msgType}`);
                break;
        }
    }

    _on_open_live_danmaku(client, message) {
        console.log(`[${message.roomId}] ${message.uname}：${message.msg}`);
    }

    _on_open_live_gift(client, message) {
        const coinType = message.paid ? '金瓜子' : '银瓜子';
        const totalCoin = message.price * message.giftNum;
        console.log(`[${message.roomId}] ${message.uname} 赠送${message.giftName}x${message.giftNum} (${coinType}x${totalCoin})`);
    }

    _on_open_live_buy_guard(client, message) {
        console.log(`[${message.roomId}] ${message.userInfo.uname} 购买 大航海等级=${message.guardLevel}`);
    }

    _on_open_live_super_chat(client, message) {
        console.log(`[${message.roomId}] 醒目留言 ¥${message.rmb} ${message.uname}：${message.message}`);
    }

    _on_open_live_super_chat_delete(client, message) {
        console.log(`[${message.roomId}] 删除醒目留言 message_ids=${message.messageIds}`);
    }

    _on_open_live_like(client, message) {
        console.log(`[${message.roomId}] ${message.uname} 点赞`);
    }

    _on_open_live_enter_room(client, message) {
        console.log(`[${message.roomId}] ${message.uname} 进入房间`);
    }

    _on_open_live_start_live(client, message) {
        console.log(`[${message.roomId}] 开始直播`);
    }

    _on_open_live_end_live(client, message) {
        console.log(`[${message.roomId}] 结束直播`);
    }
}

async function runSingleClient() {
    console.log('=== 测试单个直播间 ===');
    const roomId = TEST_ROOM_IDS[0];  // 使用TEST_ROOM_IDS中的第一个房间
    console.log(`正在连接房间: ${roomId}`);
    const client = new BLiveClient(roomId, { sessData: SESSDATA });  // 添加SESSDATA参数
    const handler = new MyHandler();
    client.set_handler(handler);
    await client.start();
    console.log('客户端启动成功，等待接收消息...');

    // 等待60秒后停止
    await new Promise(resolve => setTimeout(resolve, 60000));

    console.log('测试结束，正在停止客户端...');
    await client.stop();
}

async function runMultiClients() {
    // 创建多个客户端
    const clients = TEST_ROOM_IDS.map(roomId => new BLiveClient(roomId, { sessData: SESSDATA }));
    const handler = new MyHandler();
    
    // 设置处理器并启动
    for (const client of clients) {
        client.set_handler(handler);
        client.start();
    }

    try {
        // 演示5秒后停止
        await new Promise(resolve => setTimeout(resolve, 5000));
        clients.forEach(client => client.stop());
    } finally {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 等待连接完全关闭
    }
}

async function runOpenLiveClient() {
    if (!ACCESS_KEY_ID || !ACCESS_KEY_SECRET || !APP_ID || !ROOM_OWNER_AUTH_CODE) {
        console.log('未配置开放平台参数，跳过测试');
        return;
    }

    // 创建开放平台客户端
    const client = new OpenLiveClient(ACCESS_KEY_ID, ACCESS_KEY_SECRET, APP_ID, ROOM_OWNER_AUTH_CODE);
    
    // 设置处理器
    const handler = new MyHandler();
    client.set_handler(handler);

    // 启动客户端
    client.start();

    try {
        // 演示70秒后停止
        await new Promise(resolve => setTimeout(resolve, 70000));
        client.stop();
    } finally {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 等待连接完全关闭
    }
}

// 运行示例
async function main() {
    console.log('=== 测试单个直播间 ===');
    await runSingleClient();

    console.log('\n=== 测试多个直播间 ===');
    await runMultiClients();

    console.log('\n=== 测试开放平台 ===');
    await runOpenLiveClient();
}

main().catch(console.error); 