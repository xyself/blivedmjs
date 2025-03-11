import WebSocket from 'isomorphic-ws';
import pako from 'pako';
import axios from 'axios';
import * as webModels from '../models/web.js';
import brotli from 'brotli';
import zlib from 'zlib';

const HEADER_SIZE = 16;

const WS_BODY_PROTOCOL_VERSION_NORMAL = 0;
const WS_BODY_PROTOCOL_VERSION_INT = 1;
const WS_BODY_PROTOCOL_VERSION_DEFLATE = 2;

const WS_PACKAGE_HEADER_TOTAL_LENGTH = 0;
const WS_PACKAGE_HEADER_LENGTH = 16;
const WS_HEADER_OFFSET = 4;
const WS_VERSION_OFFSET = 6;
const WS_OPERATION_OFFSET = 8;
const WS_SEQUENCE_OFFSET = 12;

const WS_AUTH = 7;
const WS_AUTH_REPLY = 8;
const WS_HEARTBEAT = 2;
const WS_HEARTBEAT_REPLY = 3;
const WS_MESSAGE = 5;
const WS_POPULAR = 3;

// 默认WebSocket服务器
const DEFAULT_WS_INFO = {
    host: 'broadcastlv.chat.bilibili.com',
    wss_port: 443,
    ws_port: 2244
};

export class BLiveClient {
    constructor(roomId, { sessData = '', ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' } = {}) {
        this.roomId = roomId;
        this.sessData = sessData;
        this.ua = ua;
        
        this._websocket = null;
        this._heartbeatTimer = null;
        this._handler = null;
        this._closed = false;
        this._uid = 0;
        this._roomOwnerUid = 0;
        this._hostServerList = [];
        this._token = '';
        this._currentServer = null;
        this._buvid = 'XY418E4B2B9432344C7B9785A3FA0D3809C3';  // 使用一个更真实的buvid格式
    }

    async start() {
        if (this._websocket) {
            return;
        }

        await this._initRoom();
        await this._connectWebSocket();
        this._heartbeatTimer = setInterval(() => this._sendHeartbeat(), 30000);

        if (this._handler) {
            this._handler.on_client_start(this);
        }
    }

    stop() {
        if (this._heartbeatTimer) {
            clearInterval(this._heartbeatTimer);
            this._heartbeatTimer = null;
        }

        if (this._websocket) {
            this._websocket.close();
            this._websocket = null;
        }

        this._closed = true;

        if (this._handler) {
            this._handler.on_client_stop(this);
        }
    }

    set_handler(handler) {
        this._handler = handler;
    }

    async _initRoom() {
        const headers = {
            'User-Agent': this.ua,
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'Origin': 'https://live.bilibili.com',
            'Referer': `https://live.bilibili.com/${this.roomId}`,
            'Cookie': `SESSDATA=${this.sessData}; buvid3=${this._buvid}`
        };

        try {
            const resp = await axios.get(`https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByRoom?room_id=${this.roomId}`, {
                headers
            });

            const data = resp.data;
            if (data.code !== 0) {
                throw new Error(`获取房间信息失败: ${data.message}`);
            }

            this._roomOwnerUid = data.data.room_info.uid;

            if (this.sessData) {
                try {
                    const userResp = await axios.get('https://api.live.bilibili.com/xlive/web-ucenter/user/get_user_info', {
                        headers
                    });
                    if (userResp.data.code === 0) {
                        this._uid = userResp.data.data.uid || 0;
                    }
                } catch (e) {
                    // 忽略错误
                }
            }

            const danmuInfoResp = await axios.get(`https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?id=${this.roomId}`, {
                headers
            });

            if (danmuInfoResp.data.code !== 0) {
                this._hostServerList = [DEFAULT_WS_INFO];
                return;
            }

            const hostList = danmuInfoResp.data.data.host_list;
            if (!hostList || hostList.length === 0) {
                this._hostServerList = [DEFAULT_WS_INFO];
                return;
            }

            this._hostServerList = hostList;
            this._token = danmuInfoResp.data.data.token;

        } catch (err) {
            throw err;
        }
    }

    async _connectWebSocket() {
        return new Promise((resolve, reject) => {
            this._currentServer = this._hostServerList[Math.floor(Math.random() * this._hostServerList.length)];
            const wsUrl = `wss://${this._currentServer.host}:${this._currentServer.wss_port}/sub?platform=web&clientver=2.0.11&type=2&key=${this._token}`;

            this._ws = new WebSocket(wsUrl);
            this._ws.binaryType = 'arraybuffer';

            this._ws.onopen = () => {
                this._sendAuth();
                resolve();
            };

            this._ws.onmessage = (ev) => {
                this._onMessage(ev.data);
            };

            this._ws.onclose = (ev) => {
                this._onClose(ev.code, ev.reason);
            };

            this._ws.onerror = (ev) => {
                this._onError(ev);
                reject(ev);
            };
        });
    }

    _sendHeartbeat() {
        this._send(2, '');
    }

    _onMessage(data) {
        const buffer = Buffer.from(data);
        let offset = 0;
        
        while (offset < buffer.length) {
            const packetLen = buffer.readInt32BE(offset + 0);
            const headerLen = buffer.readInt16BE(offset + 4);
            const ver = buffer.readInt16BE(offset + 6);
            const op = buffer.readInt32BE(offset + 8);
            const seq = buffer.readInt32BE(offset + 12);

            let body = buffer.slice(offset + headerLen, offset + packetLen);
            if (ver === 2) {
                try {
                    body = zlib.inflateSync(body);
                    this._onMessage(body);
                } catch (e) {
                    // 忽略错误
                }
            } else if (ver === 3) {
                try {
                    body = Buffer.from(brotli.decompress(body));
                    this._onMessage(body);
                } catch (e) {
                    // 忽略错误
                }
            } else {
                if (op === 3) {
                    const popularity = body.readInt32BE(0);
                    if (this._handler) {
                        this._handler._on_heartbeat(this, {
                            popularity
                        });
                    }
                } else if (op === 8) {
                    try {
                        const authResp = JSON.parse(body.toString());
                        if (authResp.code === 0) {
                            this._startHeartbeat();
                        } else {
                            this._ws.close();
                        }
                    } catch (e) {
                        // 忽略错误
                    }
                } else if (op === 5) {
                    try {
                        const notification = JSON.parse(body.toString());
                        if (this._handler) {
                            this._handleCommand(notification);
                        }
                    } catch (e) {
                        // 忽略错误
                    }
                }
            }

            offset += packetLen;
        }
    }

    _send(op, body) {
        if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
            return;
        }

        const bodyBuffer = Buffer.from(body);
        const headerBuffer = Buffer.alloc(16);
        const packetLen = bodyBuffer.length + 16;
        
        headerBuffer.writeInt32BE(packetLen, 0);
        headerBuffer.writeInt16BE(16, 4);
        headerBuffer.writeInt16BE(1, 6);
        headerBuffer.writeInt32BE(op, 8);
        headerBuffer.writeInt32BE(1, 12);

        const packet = Buffer.concat([headerBuffer, bodyBuffer]);
        this._ws.send(packet);
    }

    _sendAuth() {
        const authParams = {
            uid: this._uid,
            roomid: this.roomId,
            protover: 3,
            buvid: this._buvid,
            platform: 'web',
            type: 2,
            key: this._token,
            platform_version: '2.0.11',
            clientver: '2.0.11',
            build: 7734200,
            device_platform: 'web',
            device_id: this._buvid,
            version: '2.0.11',
            web_display_mode: 1,
            ua: this.ua,
            device: 'web',
            device_name: 'Chrome',
            device_version: '122.0.0.0'
        };
        const body = JSON.stringify(authParams);
        this._send(7, body);
    }

    _onClose(code, reason) {
        this._stopHeartbeat();
        this._websocket = null;
        this.stop();
    }

    _onError(error) {
        this.stop();
    }

    _handleMessage(buffer) {
        try {
            const headerLength = 16;
            const packetLength = buffer.readInt32BE(0);
            const protoVer = buffer.readInt16BE(6);
            const operation = buffer.readInt32BE(8);

            let body = buffer.slice(headerLength);
            if (operation === 3) {  // 心跳包回应
                const popularity = body.readInt32BE(0);
                this._handleHeartbeatResponse(popularity);
                return;
            }

            if (operation === 8) {  // 认证响应
                const response = JSON.parse(body.toString('utf8'));
                if (response.code === 0) {
                    this._startHeartbeat();
                } else {
                    this._handleError(new Error(`认证失败: ${response.message}`));
                }
                return;
            }

            if (protoVer === 2) {  // zlib压缩
                body = pako.inflate(body);
            } else if (protoVer === 3) {  // brotli压缩
                body = Buffer.from(brotli.decompress(body));
            }

            if (body.length > 0) {
                const bodyText = body.toString('utf8');
                if (bodyText) {
                    try {
                        const data = JSON.parse(bodyText);
                        this._handleCommand(data);
                    } catch (e) {
                        console.error('解析消息内容失败:', e);
                    }
                }
            }
        } catch (error) {
            console.error('处理消息失败:', error);
        }
    }

    _handleCommand(command) {
        if (!this._handler) {
            return;
        }

        try {
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
                    // 上舰消息
                    this._handler._on_buy_guard?.(this, new webModels.GuardBuyMessage(command));
                    break;
                case 'SUPER_CHAT_MESSAGE':
                    // 醒目留言（SC）
                    this._handler._on_super_chat?.(this, new webModels.SuperChatMessage(command));
                    break;
                case 'INTERACT_WORD':
                    // 用户进入直播间
                    this._handler._on_interact_word?.(this, new webModels.InteractWordMessage(command));
                    break;
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
                case 'LIKE_INFO_V3_UPDATE':
                    // 点赞信息更新
                    this._handler._on_like_info_update?.(this, new webModels.LikeInfoV3UpdateMessage(command));
                    break;
                case 'LIKE_INFO_V3_CLICK':
                    // 用户点赞
                    this._handler._on_like_click?.(this, new webModels.LikeClickMessage(command));
                    break;
                case 'ENTRY_EFFECT':
                    // 进入特效
                    this._handler._on_entry_effect?.(this, new webModels.EntryEffectMessage(command));
                    break;
                default:
                    // 其他消息
                    console.log('未处理的消息类型:', command.cmd);
                    break;
            }
        } catch (err) {
            console.error('处理消息失败:', err);
        }
    }

    _handleError(error) {
        console.error('WebSocket错误:', error);
        this.stop();
    }

    _handleClose() {
        if (this._heartbeatTimer) {
            clearInterval(this._heartbeatTimer);
            this._heartbeatTimer = null;
        }
        this.stop();
    }

    _startHeartbeat() {
        this._sendHeartbeat();
        
        this._heartbeatTimer = setInterval(() => {
            this._sendHeartbeat();
        }, 30000);
    }

    _stopHeartbeat() {
        if (this._heartbeatTimer) {
            clearInterval(this._heartbeatTimer);
            this._heartbeatTimer = null;
        }
    }

    _handleHeartbeatResponse(popularity) {
        if (this._handler) {
            this._handler._on_heartbeat(this, new webModels.HeartbeatMessage({
                popularity
            }));
        }
    }
} 