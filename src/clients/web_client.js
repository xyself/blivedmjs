/**
 * blivedmjs - B站直播弹幕处理模块 JavaScript版本
 * 用于连接B站直播间并获取实时弹幕、礼物、上舰等信息
 */


const WebSocket = require('isomorphic-ws'); // 用于创建WebSocket连接的库，兼容浏览器和Node环境
const pako = require('pako'); // 用于zlib压缩/解压缩
const axios = require('axios'); // 用于HTTP请求
const webModels = require('../models/web.js'); // 导入消息模型定义
const { brotliDecompressSync } = require('zlib'); // 用于brotli解压缩
const zlib = require('zlib'); // Node.js内置的zlib库
const { wbiSign } = require('./wbi');

// WebSocket消息头部大小
const HEADER_SIZE = 16;

// WebSocket消息体协议版本常量
const WS_BODY_PROTOCOL_VERSION_NORMAL = 0; // 普通文本格式
const WS_BODY_PROTOCOL_VERSION_INT = 1;    // 整数格式
const WS_BODY_PROTOCOL_VERSION_DEFLATE = 2; // deflate压缩格式

// WebSocket包头部字段偏移量
const WS_PACKAGE_HEADER_TOTAL_LENGTH = 0; // 包总长度字段的偏移量
const WS_PACKAGE_HEADER_LENGTH = 16;      // 头部长度字段的偏移量
const WS_HEADER_OFFSET = 4;              // 头部偏移量
const WS_VERSION_OFFSET = 6;             // 版本字段偏移量
const WS_OPERATION_OFFSET = 8;           // 操作码字段偏移量
const WS_SEQUENCE_OFFSET = 12;           // 序列号字段偏移量

// WebSocket操作码常量
const WS_AUTH = 7;              // 认证请求
const WS_AUTH_REPLY = 8;        // 认证回复
const WS_HEARTBEAT = 2;         // 心跳包
const WS_HEARTBEAT_REPLY = 3;   // 心跳回复
const WS_MESSAGE = 5;           // 普通消息
const WS_POPULAR = 3;           // 人气值消息

// 默认WebSocket服务器配置
const DEFAULT_WS_INFO = {
    host: 'broadcastlv.chat.bilibili.com', // 默认弹幕服务器主机名
    wss_port: 443,                         // WSS(加密WebSocket)端口
    ws_port: 2244                          // WS(非加密WebSocket)端口
};

/**
 * B站直播客户端类
 * 用于连接B站直播间，接收并处理弹幕和其他消息
 */
class BLiveClient {
    /**
     * 创建一个B站直播客户端实例
     * @param {number} roomId - 直播间ID
     * @param {Object} options - 客户端选项
     * @param {string} options.sessData - 登录Cookie中的SESSDATA值，用于验证身份
     * @param {string} options.ua - 自定义User-Agent
     */
    constructor(roomId, { sessData = '', ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' } = {}) {
        this.roomId = roomId;        // 传入的房间ID（可能是短ID）
        this.sessData = sessData;    // 用户登录凭证
        this.ua = ua;                // 用户代理字符串
        
        this._websocket = null;      // WebSocket连接对象
        this._heartbeatTimer = null; // 心跳定时器
        this._handler = null;        // 消息处理器
        this._closed = false;        // 客户端是否已关闭
        this._uid = 0;               // 当前用户ID，0表示未登录
        this._roomOwnerUid = 0;      // 主播用户ID
        this._room_id = null;        // 真实房间ID（从API获取，可能与传入的roomId不同）
        this._hostServerList = [];   // 弹幕服务器列表
        this._token = '';            // 连接弹幕服务器用的token
        this._currentServer = null;  // 当前使用的弹幕服务器
        this._buvid = 'XY418E4B2B9432344C7B9785A3FA0D3809C3';  // 浏览器唯一标识符
    }

    /**
     * 启动客户端，连接到直播间
     * 初始化房间信息，建立WebSocket连接并设置心跳
     */
    async start() {
        if (this._websocket) {
            return; // 已经启动，直接返回
        }

        await this._initRoom();       // 初始化房间信息
        await this._connectWebSocket(); // 连接WebSocket
        this._heartbeatTimer = setInterval(() => this._sendHeartbeat(), 30000); // 设置30秒一次的心跳

        // 通知处理器客户端已启动
        if (this._handler) {
            this._handler.on_client_start(this);
        }
    }

    /**
     * 停止客户端
     * 清理心跳定时器，关闭WebSocket连接
     */
    stop() {
        // 清理心跳定时器
        if (this._heartbeatTimer) {
            clearInterval(this._heartbeatTimer);
            this._heartbeatTimer = null;
        }

        // 关闭WebSocket连接
        if (this._websocket) {
            this._websocket.close();
            this._websocket = null;
        }

        this._closed = true; // 标记为已关闭

        // 通知处理器客户端已停止
        if (this._handler) {
            this._handler.on_client_stop(this);
        }
    }

    /**
     * 设置消息处理器
     * @param {Object} handler - 消息处理器对象，包含各种消息类型的处理方法
     */
    set_handler(handler) {
        this._handler = handler;
    }

    /**
     * 获取真实房间ID
     * @returns {number} 真实房间ID，如果未初始化则返回传入的房间ID
     */
    get room_id() {
        return this._room_id || this.roomId;
    }

    /**
     * 初始化房间信息
     * 获取真实房间ID、主播UID和弹幕服务器列表等信息
     * @private
     */
    async _initRoom() {
        // 设置请求头
        const headers = {
            'User-Agent': this.ua,
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'Origin': 'https://live.bilibili.com',
            'Referer': `https://live.bilibili.com/${this.roomId}`,
            'Cookie': `SESSDATA=${this.sessData}; buvid3=${this._buvid}`
        };

        try {
            // 获取房间信息
            const resp = await axios.get(`https://api.live.bilibili.com/room/v1/Room/get_info?room_id=${this.roomId}`, {
                headers
            });

            const data = resp.data;
            if (data.code !== 0) {
                throw new Error(`获取房间信息失败: ${data.message}`);
            }

            // 保存主播UID和真实房间ID
            this._roomOwnerUid = data.data.uid;
            this._room_id = data.data.room_id;

            // 如果提供了登录凭证，获取当前用户信息
            if (this.sessData) {
                try {
                    const userResp = await axios.get('https://api.live.bilibili.com/xlive/web-ucenter/user/get_user_info', {
                        headers
                    });
                    if (userResp.data.code === 0) {
                        this._uid = userResp.data.data.uid || 0;
                    }
                } catch (e) {
                    // 忽略错误，保持未登录状态
                }
            }

            // 获取wbi签名所需的img_key和sub_key
            const navResp = await axios.get('https://api.bilibili.com/x/web-interface/nav', { headers });
            const wbiImg = navResp.data.data && navResp.data.data.wbi_img;
            if (!wbiImg) throw new Error('获取wbi_img失败');
            const imgKey = (wbiImg.img_url.match(/([a-zA-Z0-9]+)\.png/) || [])[1];
            const subKey = (wbiImg.sub_url.match(/([a-zA-Z0-9]+)\.png/) || [])[1];
            if (!imgKey || !subKey) throw new Error('解析imgKey或subKey失败');

            // 获取弹幕服务器信息（带wbi签名）
            let params = { id: this.room_id };
            params = wbiSign(params, imgKey, subKey);
            const danmuInfoResp = await axios.get('https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo', {
                headers,
                params
            });

            // 如果获取失败，使用默认服务器
            if (danmuInfoResp.data.code !== 0) {
                this._hostServerList = [DEFAULT_WS_INFO];
                return;
            }

            // 保存服务器列表和token
            const hostList = danmuInfoResp.data.data.host_list;
            if (!hostList || hostList.length === 0) {
                this._hostServerList = [DEFAULT_WS_INFO];
                return;
            }

            this._hostServerList = hostList;
            this._token = danmuInfoResp.data.data.token;

        } catch (err) {
            throw err; // 出错时抛出异常
        }
    }

    /**
     * 连接到WebSocket服务器
     * @private
     */
    async _connectWebSocket() {
        return new Promise((resolve, reject) => {
            // 随机选择一个弹幕服务器
            this._currentServer = this._hostServerList[Math.floor(Math.random() * this._hostServerList.length)];
            // 构造WebSocket连接URL
            const wsUrl = `wss://${this._currentServer.host}:${this._currentServer.wss_port}/sub?platform=web&clientver=2.0.11&type=2&key=${this._token}`;

            // 创建WebSocket连接
            this._ws = new WebSocket(wsUrl);
            this._ws.binaryType = 'arraybuffer'; // 设置接收的数据类型为二进制

            // 连接成功时发送认证信息
            this._ws.onopen = () => {
                this._sendAuth();
                resolve();
            };

            // 收到消息时处理
            this._ws.onmessage = (ev) => {
                this._onMessage(ev.data);
            };

            // 连接关闭时处理
            this._ws.onclose = (ev) => {
                this._onClose(ev.code, ev.reason);
            };

            // 连接错误时处理
            this._ws.onerror = (ev) => {
                this._onError(ev);
                reject(ev);
            };
        });
    }

    /**
     * 发送心跳包
     * 每30秒发送一次，维持WebSocket连接
     * @private
     */
    _sendHeartbeat() {
        this._send(2, ''); // 发送空心跳包
    }

    /**
     * 处理收到的WebSocket消息
     * @param {ArrayBuffer} data - 收到的二进制数据
     * @private
     */
    _onMessage(data) {
        const buffer = Buffer.from(data);
        let offset = 0;
        
        // 一个数据包可能包含多个消息，需要循环处理
        while (offset < buffer.length) {
            // 解析消息头部
            const packetLen = buffer.readInt32BE(offset + 0);    // 包总长度
            const headerLen = buffer.readInt16BE(offset + 4);    // 头部长度
            const ver = buffer.readInt16BE(offset + 6);          // 协议版本
            const op = buffer.readInt32BE(offset + 8);           // 操作码
            const seq = buffer.readInt32BE(offset + 12);         // 序列号

            // 提取消息体
            let body = buffer.slice(offset + headerLen, offset + packetLen);
            
            // 根据协议版本处理消息体
            if (ver === 2) {  // zlib压缩
                try {
                    body = zlib.inflateSync(body); // 解压缩
                    this._onMessage(body);  // 递归处理解压后的数据
                } catch (e) {
                    // 忽略解压错误
                }
            } else if (ver === 3) {  // brotli压缩
                try {
                    body = brotliDecompressSync(body); // 解压缩
                    this._onMessage(body);  // 递归处理解压后的数据
                } catch (e) {
                    // 忽略解压错误
                }
            } else {  // 未压缩或已解压的数据
                if (op === 3) {  // 心跳回复（人气值）
                    const popularity = body.readInt32BE(0);
                    if (this._handler) {
                        this._handler._on_heartbeat(this, {
                            popularity
                        });
                    }
                } else if (op === 8) {  // 认证回复
                    try {
                        const authResp = JSON.parse(body.toString());
                        if (authResp.code === 0) {
                            this._startHeartbeat(); // 认证成功，开始发送心跳
                        } else {
                            this._ws.close(); // 认证失败，关闭连接
                        }
                    } catch (e) {
                        // 忽略解析错误
                    }
                } else if (op === 5) {  // 通知消息
                    try {
                        const notification = JSON.parse(body.toString());
                        if (this._handler) {
                            this._handleCommand(notification); // 处理各类通知
                        }
                    } catch (e) {
                        // 忽略解析错误
                    }
                }
            }

            // 移动到下一个消息
            offset += packetLen;
        }
    }

    /**
     * 发送WebSocket消息
     * @param {number} op - 操作码
     * @param {string} body - 消息体内容
     * @private
     */
    _send(op, body) {
        // 检查WebSocket连接是否可用
        if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
            return;
        }

        // 构造消息
        const bodyBuffer = Buffer.from(body);
        const headerBuffer = Buffer.alloc(16);
        const packetLen = bodyBuffer.length + 16;
        
        // 填充消息头
        headerBuffer.writeInt32BE(packetLen, 0);  // 包总长度
        headerBuffer.writeInt16BE(16, 4);         // 头长度
        headerBuffer.writeInt16BE(1, 6);          // 协议版本
        headerBuffer.writeInt32BE(op, 8);         // 操作码
        headerBuffer.writeInt32BE(1, 12);         // 序列号

        // 合并头和体，发送消息
        const packet = Buffer.concat([headerBuffer, bodyBuffer]);
        this._ws.send(packet);
    }

    /**
     * 发送认证消息
     * 连接建立后需要立即发送认证信息
     * @private
     */
    _sendAuth() {
        // 构造认证参数
        const authParams = {
            uid: this._uid,                   // 用户ID
            roomid: this.roomId,              // 房间ID
            protover: 3,                      // 协议版本
            buvid: this._buvid,               // 浏览器唯一标识
            platform: 'web',                  // 平台
            type: 2,                          // 类型
            key: this._token,                 // 认证token
            platform_version: '2.0.11',       // 平台版本
            clientver: '2.0.11',              // 客户端版本
            build: 7734200,                   // 构建号
            device_platform: 'web',           // 设备平台
            device_id: this._buvid,           // 设备ID
            version: '2.0.11',                // 版本号
            web_display_mode: 1,              // Web显示模式
            ua: this.ua,                      // 用户代理
            device: 'web',                    // 设备类型
            device_name: 'Chrome',            // 设备名称
            device_version: '122.0.0.0'       // 设备版本
        };
        const body = JSON.stringify(authParams);
        this._send(7, body); // 发送认证消息
    }

    /**
     * 处理WebSocket连接关闭事件
     * @param {number} code - 关闭代码
     * @param {string} reason - 关闭原因
     * @private
     */
    _onClose(code, reason) {
        this._stopHeartbeat(); // 停止心跳
        this._websocket = null;
        this.stop(); // 停止客户端
    }

    /**
     * 处理WebSocket连接错误事件
     * @param {Error} error - 错误对象
     * @private
     */
    _onError(error) {
        this.stop(); // 停止客户端
    }

    /**
     * 处理二进制消息
     * @param {Buffer} buffer - 消息缓冲区
     * @private
     */
    _handleMessage(buffer) {
        try {
            // 解析消息头部
            const headerLength = 16;
            const packetLength = buffer.readInt32BE(0);
            const protoVer = buffer.readInt16BE(6);
            const operation = buffer.readInt32BE(8);

            // 提取消息体
            let body = buffer.slice(headerLength);
            
            // 处理心跳包回应
            if (operation === 3) {
                const popularity = body.readInt32BE(0);
                this._handleHeartbeatResponse(popularity);
                return;
            }

            // 处理认证响应
            if (operation === 8) {
                const response = JSON.parse(body.toString('utf8'));
                if (response.code === 0) {
                    this._startHeartbeat(); // 认证成功，开始心跳
                } else {
                    this._handleError(new Error(`认证失败: ${response.message}`));
                }
                return;
            }

            // 处理压缩数据
            if (protoVer === 2) {  // zlib压缩
                body = pako.inflate(body);
            } else if (protoVer === 3) {  // brotli压缩
                body = Buffer.from(brotli.decompress(body));
            }

            // 处理消息体
            if (body.length > 0) {
                const bodyText = body.toString('utf8');
                if (bodyText) {
                    try {
                        const data = JSON.parse(bodyText);
                        this._handleCommand(data); // 处理命令
                    } catch (e) {
                        console.error('解析消息内容失败:', e);
                    }
                }
            }
        } catch (error) {
            console.error('处理消息失败:', error);
        }
    }

    /**
     * 处理服务器发来的各类命令
     * @param {Object} command - 命令对象
     * @private
     */
    _handleCommand(command) {
        if (!this._handler) {
            return; // 没有处理器，忽略命令
        }

        try {
            // 根据命令类型分发给不同的处理函数
            switch (command.cmd) {
                case 'DANMU_MSG':
                    // 弹幕消息
                    this._handler._on_danmaku?.(this, new webModels.DanmakuMessage(command));
                    break;
                case 'SEND_GIFT':
                    // 礼物消息
                    this._handler._on_gift?.(this, new webModels.GiftMessage(command));
                    break;
                case 'GUARD_BUY':
                    // 上舰消息（购买大航海）
                    this._handler._on_buy_guard?.(this, new webModels.GuardBuyMessage(command));
                    break;
                case 'SUPER_CHAT_MESSAGE':
                    // 醒目留言（SC）
                    this._handler._on_super_chat?.(this, new webModels.SuperChatMessage(command));
                    break;
                case 'LIKE_INFO_V3_UPDATE':
                    // 点赞信息更新
                    this._handler._on_like?.(this, new webModels.LikeInfoV3UpdateMessage(command));
                    break;
                case 'LIKE_INFO_V3_CLICK':
                    // 用户点赞
                    this._handler._on_like_click?.(this, new webModels.LikeClickMessage(command));
                    break;
                case 'INTERACT_WORD_V2': {
                    // 用户进入直播间，兼容pb结构
                    let msgData = command;
                    if (command.data && command.data.pb) {
                        // 兼容新版pb结构，直接传递
                        msgData = { ...command, data: { ...command.data } };
                    }
                    this._handler._on_interact_word?.(this, new webModels.InteractWordMessage(msgData));
                    break;
                }
                case 'WATCHED_CHANGE':
                    // 观看人数变化
                    this._handler._on_watched_change?.(this, new webModels.WatchedChangeMessage(command));
                    break;
                case 'ONLINE_RANK_COUNT':
                    // 在线排名计数
                    this._handler._on_online_rank_count?.(this, new webModels.OnlineRankCountMessage(command));
                    break;
                case 'ONLINE_RANK_V2':
                    // 在线排名详情
                    this._handler._on_online_rank_v2?.(this, new webModels.OnlineRankV2Message(command));
                    break;
                case 'STOP_LIVE_ROOM_LIST':
                    // 停播房间列表
                    this._handler._on_stop_live_room_list?.(this, new webModels.StopLiveRoomListMessage(command));
                    break;
                case 'ENTRY_EFFECT':
                    // 进入特效（如舰长进场特效）
                    this._handler._on_entry_effect?.(this, new webModels.EntryEffectMessage(command));
                    break;
                case 'DM_INTERACTION':
                    // 连续点赞消息
                    this._handler._on_dm_interaction?.(this, command);
                    break;
                case 'WIDGET_BANNER':
                    // 横幅组件消息
                    this._handler._on_widget_banner?.(this, new webModels.WidgetBannerMessage(command));
                    break;
                case 'NOTICE_MSG':
                    // 系统通知消息
                    this._handler._on_notice_msg?.(this, new webModels.NoticeMsgMessage(command));
                    break;
                default:
                    // 其他未处理的消息类型
                    console.log('未处理的消息类型:', command.cmd);
                    break;
            }
        } catch (err) {
            console.error('处理消息失败:', err);
        }
    }

    /**
     * 处理WebSocket错误
     * @param {Error} error - 错误对象
     * @private
     */
    _handleError(error) {
        console.error('WebSocket错误:', error);
        this.stop(); // 停止客户端
    }

    /**
     * 处理WebSocket连接关闭
     * @private
     */
    _handleClose() {
        // 清理心跳定时器
        if (this._heartbeatTimer) {
            clearInterval(this._heartbeatTimer);
            this._heartbeatTimer = null;
        }
        this.stop(); // 停止客户端
    }

    /**
     * 开始发送心跳包
     * 每30秒发送一次心跳包以维持连接
     * @private
     */
    _startHeartbeat() {
        // 立即发送一次心跳
        this._sendHeartbeat();
        
        // 设置定时发送心跳
        this._heartbeatTimer = setInterval(() => {
            this._sendHeartbeat();
        }, 30000); // 30秒一次
    }

    /**
     * 停止发送心跳包
     * @private
     */
    _stopHeartbeat() {
        if (this._heartbeatTimer) {
            clearInterval(this._heartbeatTimer);
            this._heartbeatTimer = null;
        }
    }

    /**
     * 处理心跳包回应（人气值）
     * @param {number} popularity - 直播间人气值
     * @private
     */
    _handleHeartbeatResponse(popularity) {
        if (this._handler) {
            // 将人气值包装成消息传递给处理器
            this._handler._on_heartbeat(this, new webModels.HeartbeatMessage({
                popularity
            }));
        }
    }
}

// 导出模块
module.exports = {
    BLiveClient
}; 