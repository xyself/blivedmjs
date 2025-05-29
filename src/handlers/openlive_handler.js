const BaseHandler = require('./base_handler.js');

class OpenLiveHandler extends BaseHandler {
    constructor() {
        super();
        // 开放平台的命令回调字典
        this.CMD_CALLBACK_DICT = {
            'LIVE_OPEN_PLATFORM_DM': this._on_open_live_danmaku.bind(this),
            'LIVE_OPEN_PLATFORM_SEND_GIFT': this._on_open_live_gift.bind(this),
            'LIVE_OPEN_PLATFORM_GUARD': this._on_open_live_buy_guard.bind(this),
            'LIVE_OPEN_PLATFORM_SUPER_CHAT': this._on_open_live_super_chat.bind(this),
            'LIVE_OPEN_PLATFORM_SUPER_CHAT_DEL': this._on_open_live_super_chat_delete.bind(this),
            'LIVE_OPEN_PLATFORM_LIKE': this._on_open_live_like.bind(this),
            'LIVE_OPEN_PLATFORM_USER_ENTER': this._on_open_live_enter_room.bind(this),
            'LIVE_OPEN_PLATFORM_START': this._on_open_live_start_live.bind(this),
            'LIVE_OPEN_PLATFORM_END': this._on_open_live_end_live.bind(this)
        };
    }

    _on_open_live_danmaku(client, message) {
        const key = `open_danmaku_${message.uid}_${message.timestamp}_${message.msg}`;
        if (this._isDuplicateMessage(key)) return;

        let medal_str = '';
        if (message.fans_medal_wearing_status && message.fans_medal_level > 0) {
            medal_str = `[${message.fans_medal_name}${message.fans_medal_level}]`;
        }
        console.log(`[${client.roomId}] ${message.uname}${medal_str}：${message.msg}`);
    }

    _on_open_live_gift(client, message) {
        const key = `open_gift_${message.uid}_${message.gift_id}_${message.timestamp}`;
        if (this._isDuplicateMessage(key)) return;

        let medal_str = '';
        if (message.fans_medal_wearing_status && message.fans_medal_level > 0) {
            medal_str = `[${message.fans_medal_name}${message.fans_medal_level}]`;
        }
        console.log(`[${client.roomId}] ${message.uname}${medal_str} 赠送${message.gift_name}x${message.gift_num}`);
    }

    _on_open_live_buy_guard(client, message) {
        const key = `open_guard_${message.user_info.uid}_${message.guard_level}`;
        if (this._isDuplicateMessage(key)) return;

        console.log(`[${client.roomId}] ${message.user_info.uname} 开通舰长，等级${message.guard_level}`);
    }

    _on_open_live_super_chat(client, message) {
        const key = `open_sc_${message.uid}_${message.start_time}`;
        if (this._isDuplicateMessage(key)) return;

        console.log(`[${client.roomId}] 醒目留言 ¥${message.price} ${message.uname}：${message.message}`);
    }

    _on_open_live_super_chat_delete(client, message) {
        // 可以重写此方法
    }

    _on_open_live_like(client, message) {
        const key = `open_like_${message.uid}_${Date.now()}`;
        if (this._isDuplicateMessage(key)) return;

        let medal_str = '';
        if (message.fans_medal_wearing_status && message.fans_medal_level > 0) {
            medal_str = `[${message.fans_medal_name}${message.fans_medal_level}]`;
        }
        console.log(`[${client.roomId}] ${message.uname}${medal_str} ${message.like_text}`);
    }

    _on_open_live_enter_room(client, message) {
        const key = `open_enter_${message.uid}_${Date.now()}`;
        if (this._isDuplicateMessage(key)) return;

        let medal_str = '';
        if (message.fans_medal_wearing_status && message.fans_medal_level > 0) {
            medal_str = `[${message.fans_medal_name}${message.fans_medal_level}]`;
        }
        console.log(`[${client.roomId}] ${message.uname}${medal_str} 进入直播间`);
    }

    _on_open_live_start_live(client, message) {
        console.log(`[${client.roomId}] 直播开始`);
    }

    _on_open_live_end_live(client, message) {
        console.log(`[${client.roomId}] 直播结束`);
    }
}

module.exports = {
    OpenLiveHandler
}; 