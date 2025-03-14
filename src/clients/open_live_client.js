const WebSocket = require('ws');
const crypto = require('crypto');
const openModels = require('../models/open_live.js');

class OpenLiveClient {
    constructor(accessKeyId, accessKeySecret, appId, roomOwnerAuthCode) {
        this.accessKeyId = accessKeyId;
        this.accessKeySecret = accessKeySecret;
        this.appId = appId;
        this.roomOwnerAuthCode = roomOwnerAuthCode;
        this.ws = null;
        this.handler = null;
        this.heartbeatTimer = null;
        this._closed = false;
        this._gameId = '';
        this._authBody = null;
    }

    set_handler(handler) {
        this.handler = handler;
    }

    async start() {
        try {
            // 获取websocket连接信息
            const info = await this._getWebSocketInfo();
            
            // 创建WebSocket连接
            this.ws = new WebSocket(info.websocket_url);
            
            this.ws.on('open', () => {
                // 发送认证包
                this._sendAuth(info.auth_body);
                
                // 启动心跳
                this._startHeartbeat();
                
                if (this.handler) {
                    this.handler.on_client_start(this);
                }
            });
            
            this.ws.on('message', (data) => {
                this._handleMessage(data);
            });
            
            this.ws.on('close', () => {
                if (this.handler) {
                    this.handler.on_client_stop(this);
                }
                this._stopHeartbeat();
            });
            
            this.ws.on('error', (error) => {
                console.error('WebSocket连接发生错误:', error);
            });
        } catch (error) {
            console.error('启动客户端失败:', error);
            throw error;
        }
    }

    stop() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this._stopHeartbeat();
        this._closed = true;
    }

    async _getWebSocketInfo() {
        // 构造请求参数
        const timestamp = Math.floor(Date.now() / 1000);
        const nonce = crypto.randomBytes(16).toString('hex');
        
        const params = {
            room_owner_auth_code: this.roomOwnerAuthCode,
            app_id: this.appId,
            timestamp: timestamp,
            nonce: nonce
        };
        
        // 按字典序排序参数
        const sortedParams = Object.keys(params).sort().reduce((acc, key) => {
            acc[key] = params[key];
            return acc;
        }, {});
        
        // 构造签名字符串
        const signStr = Object.entries(sortedParams)
            .map(([key, value]) => `${key}:${value}`)
            .join('\n');
        
        // 计算签名
        const signature = crypto
            .createHmac('sha256', this.accessKeySecret)
            .update(signStr)
            .digest('hex');
        
        // 构造请求头
        const headers = {
            'x-bili-accesskeyid': this.accessKeyId,
            'x-bili-signature': signature,
            'x-bili-timestamp': timestamp.toString(),
            'x-bili-nonce': nonce,
            'Content-Type': 'application/json'
        };
        
        // 发送请求
        const response = await fetch('https://live-open.biliapi.com/v1/websocket/connect', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(params)
        });
        
        if (!response.ok) {
            throw new Error(`请求失败: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        if (result.code !== 0) {
            throw new Error(`API返回错误: ${result.message}`);
        }
        
        return result.data;
    }

    _sendAuth(authBody) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                action: 'auth',
                body: authBody
            }));
        }
    }

    _startHeartbeat() {
        this._stopHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    action: 'heartbeat'
                }));
            }
        }, 30000);
    }

    _stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    _handleMessage(data) {
        try {
            const message = JSON.parse(data);
            
            if (message.op === 'heartbeat') {
                // 心跳响应
                return;
            }
            
            if (message.op === 'auth') {
                // 认证响应
                return;
            }
            
            if (message.op === 'notification' && this.handler) {
                const cmd = message.data.cmd;
                const callback = this.handler.CMD_CALLBACK_DICT[cmd];
                if (callback) {
                    callback(this, message.data);
                }
            }
        } catch (error) {
            console.error('处理消息失败:', error);
        }
    }
}

module.exports = {
    OpenLiveClient
}; 