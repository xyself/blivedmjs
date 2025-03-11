export class BaseHandler {
    constructor() {
        this.CMD_CALLBACK_DICT = {
            'DANMU_MSG': this._on_danmaku.bind(this),
            'SEND_GIFT': this._on_gift.bind(this),
            'GUARD_BUY': this._on_buy_guard.bind(this),
            'USER_TOAST_V2': this._on_user_toast_v2.bind(this),
            'SUPER_CHAT_MESSAGE': this._on_super_chat.bind(this),
            'SUPER_CHAT_MESSAGE_DELETE': this._on_super_chat_delete.bind(this),
            'LIKE_INFO_V3_UPDATE': this._on_like.bind(this),
            'LIKE_INFO_V3_CLICK': this._on_like_click.bind(this),
            'INTERACT_WORD': this._on_interact_word.bind(this),
            'ENTRY_EFFECT': this._on_entry_effect.bind(this),
            'COMBO_SEND': this._on_combo_send.bind(this),
            'HOT_RANK_CHANGED': this._on_hot_rank_changed.bind(this),
            'HOT_RANK_CHANGED_V2': this._on_hot_rank_changed_v2.bind(this),
            'LIVE': this._on_live.bind(this),
            'LIVE_INTERACTIVE_GAME': this._on_live_interactive_game.bind(this),
            'NOTICE_MSG': this._on_notice_msg.bind(this),
            'ONLINE_RANK_TOP3': this._on_online_rank_top3.bind(this),
            'PK_BATTLE_END': this._on_pk_battle_end.bind(this),
            'PK_BATTLE_FINAL_PROCESS': this._on_pk_battle_final_process.bind(this),
            'PK_BATTLE_PROCESS': this._on_pk_battle_process.bind(this),
            'PK_BATTLE_PROCESS_NEW': this._on_pk_battle_process_new.bind(this),
            'PK_BATTLE_SETTLE': this._on_pk_battle_settle.bind(this),
            'PK_BATTLE_SETTLE_USER': this._on_pk_battle_settle_user.bind(this),
            'PK_BATTLE_SETTLE_V2': this._on_pk_battle_settle_v2.bind(this),
            'PREPARING': this._on_preparing.bind(this),
            'ROOM_REAL_TIME_MESSAGE_UPDATE': this._on_room_real_time_message_update.bind(this),
            'SUPER_CHAT_MESSAGE_JPN': this._on_super_chat_jpn.bind(this),
            'USER_TOAST_MSG': this._on_user_toast_msg.bind(this),
            'WIDGET_BANNER': this._on_widget_banner.bind(this),
            'OTHER_SLICE_LOADING_RESULT': this._on_other_slice_loading_result.bind(this),
            'DM_INTERACTION': this._on_dm_interaction.bind(this)
        };
        // 添加消息缓存用于去重
        this._messageCache = new Map();
    }

    /**
     * 客户端连接成功
     * @param {BLiveClient} client 客户端实例
     */
    on_client_start(client) {
        // 可以重写此方法
    }

    /**
     * 客户端断开连接
     * @param {BLiveClient} client 客户端实例
     */
    on_client_stop(client) {
        // 可以重写此方法
    }

    /**
     * 收到心跳包
     * @param {BLiveClient} client 客户端实例
     * @param {HeartbeatMessage} message 心跳消息
     */
    _on_heartbeat(client, message) {
        // 心跳包不输出
    }

    /**
     * 消息去重检查
     * @param {string} key 消息的唯一标识
     * @param {number} timeout 去重超时时间（毫秒）
     * @returns {boolean} 如果是重复消息返回true
     */
    _isDuplicateMessage(key, timeout = 3000) {
        const now = Date.now();
        const lastTime = this._messageCache.get(key);
        
        if (lastTime && now - lastTime < timeout) {
            return true;
        }
        
        this._messageCache.set(key, now);
        return false;
    }

    /**
     * 收到弹幕
     * @param {BLiveClient} client 客户端实例
     * @param {DanmakuMessage} message 弹幕消息
     */
    _on_danmaku(client, message) {
        const key = `danmaku_${message.timestamp}_${message.uid}_${message.msg}`;
        if (this._isDuplicateMessage(key)) return;
        console.log(`[${client.roomId}] ${message.uname}：${message.msg}`);
    }

    /**
     * 收到礼物
     * @param {BLiveClient} client 客户端实例
     * @param {GiftMessage} message 礼物消息
     */
    _on_gift(client, message) {
        const key = `gift_${message.uid}_${message.giftId}_${message.timestamp}`;
        if (this._isDuplicateMessage(key)) return;

        let medal_str = '';
        if (message.medal_info && message.medal_info.medal_level > 0) {
            medal_str = `[${message.medal_info.medal_name}${message.medal_info.medal_level}]`;
        }
        
        console.log(`[${client.roomId}] ${message.uname}${medal_str} 赠送 ${message.giftName}x${message.num} (${message.coinType === 'gold' ? '金瓜子' : '银瓜子'}x${message.totalCoin})`);
    }

    /**
     * 用户上舰
     * @param {BLiveClient} client 客户端实例
     * @param {GuardBuyMessage} message 上舰消息
     */
    _on_buy_guard(client, message) {
        console.log(`[${client.roomId}] ${message.username} 上舰，guard_level=${message.guardLevel}`);
    }

    /**
     * 醒目留言
     * @param {BLiveClient} client 客户端实例
     * @param {SuperChatMessage} message SC消息
     */
    _on_super_chat(client, message) {
        console.log(`[${client.roomId}] 醒目留言 ¥${message.price} ${message.uname}：${message.message}`);
    }

    _on_super_chat_delete(client, message) {
        // 可以重写此方法
    }

    _on_like(client, message) {
        // 可以重写此方法
    }

    /**
     * 用户进入直播间
     * @param {BLiveClient} client 客户端实例
     * @param {InteractWordMessage} message 进房消息
     */
    _on_interact_word(client, message) {
        const key = `interact_${message.uid}_${message.msgType}_${message.timestamp}`;
        if (this._isDuplicateMessage(key)) return;

        let medal_str = '';
        if (message.fans_medal && message.fans_medal.medal_level > 0) {
            medal_str = `[${message.fans_medal.medal_name}${message.fans_medal.medal_level}]`;
        }

        let action = '';
        switch (message.msgType) {
            case 1:
                action = '进入房间';
                break;
            case 2:
                action = '关注了主播';
                break;
            case 3:
                action = '分享了直播间';
                break;
            case 4:
                action = '特别关注了主播';
                break;
            case 5:
                action = '与主播互粉了';
                break;
            case 6:
                action = '为主播点赞了';
                break;
        }
        
        if (action) {
            console.log(`[${client.roomId}] ${message.uname}${medal_str} ${action}`);
        }
    }

    /**
     * 用户进入特效
     * @param {BLiveClient} client 客户端实例
     * @param {EntryEffectMessage} message 进入特效消息
     */
    _on_entry_effect(client, message) {
        // 不输出进入特效信息
    }

    /**
     * 用户点赞
     * @param {BLiveClient} client 客户端实例
     * @param {LikeClickMessage} message 点赞消息
     */
    _on_like_click(client, message) {
        const key = `like_${message.uid}_${Date.now()}`;
        if (this._isDuplicateMessage(key)) return;

        let medal_str = '';
        if (message.fans_medal && message.fans_medal.medal_level > 0) {
            medal_str = `[${message.fans_medal.medal_name}${message.fans_medal.medal_level}]`;
        }
        console.log(`[${client.roomId}] ${message.uname}${medal_str} 为主播点赞了`);
    }

    _on_user_toast_v2(client, message) {
        console.log(`[${client.roomId}] ${message.username} 上舰，guard_level=${message.guard_level}`);
    }

    _on_combo_send(client, message) {
        // 连击礼物，不输出
    }

    _on_hot_rank_changed(client, message) {
        // 热门榜单变化，不输出
    }

    _on_hot_rank_changed_v2(client, message) {
        // 热门榜单变化v2，不输出
    }

    _on_live(client, message) {
        // 直播状态变化，不输出
    }

    _on_live_interactive_game(client, message) {
        // 直播互动游戏，不输出
    }

    _on_notice_msg(client, message) {
        const key = `notice_${message.msg_common}`;
        if (this._isDuplicateMessage(key)) return;
        
        if (message.msg_common) {
            console.log(`[${client.roomId}] 系统通知: ${message.msg_common}`);
        }
    }

    _on_online_rank_top3(client, message) {
        // 在线排名前三，不输出
    }

    _on_pk_battle_end(client, message) {
        // PK结束，不输出
    }

    _on_pk_battle_final_process(client, message) {
        // PK决赛进程，不输出
    }

    _on_pk_battle_process(client, message) {
        // PK进程，不输出
    }

    _on_pk_battle_process_new(client, message) {
        // 新版PK进程，不输出
    }

    _on_pk_battle_settle(client, message) {
        // PK结算，不输出
    }

    _on_pk_battle_settle_user(client, message) {
        // PK用户结算，不输出
    }

    _on_pk_battle_settle_v2(client, message) {
        // PK结算v2，不输出
    }

    _on_preparing(client, message) {
        // 直播准备中，不输出
    }

    _on_room_real_time_message_update(client, message) {
        const key = `room_update_${message.roomid}_${message.fans}`;
        if (this._isDuplicateMessage(key)) return;

        if (message.fans) {
            console.log(`[${client.roomId}] 粉丝数: ${message.fans}`);
        }
    }

    _on_super_chat_jpn(client, message) {
        // 日语SC，按普通SC处理
        this._on_super_chat(client, message);
    }

    _on_user_toast_msg(client, message) {
        // 用户提示消息，不输出
    }

    _on_widget_banner(client, message) {
        // 横幅组件，不输出
    }

    _on_other_slice_loading_result(client, message) {
        // 其他分片加载结果，不输出
    }

    /**
     * 连续点赞消息
     * @param {BLiveClient} client 客户端实例
     * @param {DmInteractionMessage} message 连续点赞消息
     */
    _on_dm_interaction(client, message) {
        // 连续点赞消息，不输出
    }
} 