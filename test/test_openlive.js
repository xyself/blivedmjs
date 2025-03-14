const { BLiveClient } = require('../src/clients/web_client.js');
const { OpenLiveHandler } = require('../src/handlers/openlive_handler.js');

async function testOpenLive() {
    console.log('=== 测试开放平台 ===');
    
    // 检查是否配置了开放平台参数
    const accessKeyId = process.env.BILILIVE_ACCESS_KEY_ID;
    const accessKeySecret = process.env.BILILIVE_ACCESS_KEY_SECRET;
    
    if (!accessKeyId || !accessKeySecret) {
        console.log('未配置开放平台参数，跳过测试');
        return;
    }
    
    const client = new BLiveClient(22907643, {
        access_key_id: accessKeyId,
        access_key_secret: accessKeySecret
    });
    client.handler = new OpenLiveHandler();
    await client.start();
    
    // 等待30秒后停止
    await new Promise(resolve => setTimeout(resolve, 30000));
    await client.stop();
}

testOpenLive().catch(console.error); 