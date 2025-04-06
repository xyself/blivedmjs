/**
 * 基础消息处理器
 * 处理从B站直播WebSocket接收到的各类消息
 * 可以通过继承此类并重写方法来自定义消息处理逻辑
 */
class BaseHandler {
    /**
     * 初始化基础处理器
     * 配置各类消息对应的处理函数
     */
    constructor() {
        // 命令回调字典，将B站的消息类型映射到对应的处理方法
        this.CMD_CALLBACK_DICT = {
            'DANMU_MSG': this._on_danmaku.bind(this),               // 弹幕消息
            'SEND_GIFT': this._on_gift.bind(this),                  // 赠送礼物
            'GUARD_BUY': this._on_buy_guard.bind(this),             // 购买舰长
            'USER_TOAST_V2': this._on_user_toast_v2.bind(this),     // 用户提示V2（舰长相关）
            'SUPER_CHAT_MESSAGE': this._on_super_chat.bind(this),   // 醒目留言（SC）
            'SUPER_CHAT_MESSAGE_DELETE': this._on_super_chat_delete.bind(this), // SC删除
            'LIKE_INFO_V3_UPDATE': this._on_like.bind(this),        // 点赞信息更新
            'LIKE_INFO_V3_CLICK': this._on_like_click.bind(this),   // 用户点赞
            'INTERACT_WORD': this._on_interact_word.bind(this),     // 用户互动（进入直播间等）
            'ENTRY_EFFECT': this._on_entry_effect.bind(this),       // 入场特效
            'COMBO_SEND': this._on_combo_send.bind(this),           // 连击礼物
            'HOT_RANK_CHANGED': this._on_hot_rank_changed.bind(this), // 热门榜单变化
            'HOT_RANK_CHANGED_V2': this._on_hot_rank_changed_v2.bind(this), // 热门榜单变化V2
            'LIVE': this._on_live.bind(this),                       // 直播状态变化
            'LIVE_INTERACTIVE_GAME': this._on_live_interactive_game.bind(this), // 直播互动游戏
            'NOTICE_MSG': this._on_notice_msg.bind(this),           // 系统通知
            'ONLINE_RANK_TOP3': this._on_online_rank_top3.bind(this), // 在线排名前三
            'PK_BATTLE_END': this._on_pk_battle_end.bind(this),     // PK结束
            'PK_BATTLE_FINAL_PROCESS': this._on_pk_battle_final_process.bind(this), // PK决赛进程
            'PK_BATTLE_PROCESS': this._on_pk_battle_process.bind(this), // PK进程
            'PK_BATTLE_PROCESS_NEW': this._on_pk_battle_process_new.bind(this), // 新版PK进程
            'PK_BATTLE_SETTLE': this._on_pk_battle_settle.bind(this), // PK结算
            'PK_BATTLE_SETTLE_USER': this._on_pk_battle_settle_user.bind(this), // PK用户结算
            'PK_BATTLE_SETTLE_V2': this._on_pk_battle_settle_v2.bind(this), // PK结算V2
            'PREPARING': this._on_preparing.bind(this),             // 直播准备中
            'ROOM_REAL_TIME_MESSAGE_UPDATE': this._on_room_real_time_message_update.bind(this), // 房间实时信息更新
            'SUPER_CHAT_MESSAGE_JPN': this._on_super_chat_jpn.bind(this), // 日语SC
            'USER_TOAST_MSG': this._on_user_toast_msg.bind(this),   // 用户提示消息
            'WIDGET_BANNER': this._on_widget_banner.bind(this),     // 横幅组件
            'OTHER_SLICE_LOADING_RESULT': this._on_other_slice_loading_result.bind(this), // 其他切片加载结果
            'DM_INTERACTION': this._on_dm_interaction.bind(this)    // 弹幕互动（比如连续点赞）
        };
        // 添加消息缓存用于去重
        this._messageCache = new Map();
    }

    /**
     * 客户端连接成功回调
     * 当WebSocket连接成功后调用
     * @param {BLiveClient} client 客户端实例
     */
    on_client_start(client) {
        // 可以重写此方法
    }

    /**
     * 客户端断开连接回调
     * 当WebSocket连接断开后调用
     * @param {BLiveClient} client 客户端实例
     */
    on_client_stop(client) {
        // 可以重写此方法
    }

    /**
     * 收到心跳包回调
     * 处理服务器返回的心跳响应（包含直播间人气值）
     * @param {BLiveClient} client 客户端实例
     * @param {HeartbeatMessage} message 心跳消息
     */
    _on_heartbeat(client, message) {
        // 心跳包不输出，可以重写此方法来处理人气值
    }

    /**
     * 消息去重检查
     * 防止短时间内处理重复的消息（例如多次收到同一条弹幕）
     * @param {string} key 消息的唯一标识
     * @param {number} timeout 去重超时时间（毫秒）
     * @returns {boolean} 如果是重复消息返回true
     */
    _isDuplicateMessage(key, timeout = 3000) {
        const now = Date.now();
        const lastTime = this._messageCache.get(key);
        
        if (lastTime && now - lastTime < timeout) {
            return true; // 在去重时间窗口内，认为是重复消息
        }
        
        this._messageCache.set(key, now); // 记录消息时间
        
        // 清理过期的缓存项，避免内存占用过大
        if (this._messageCache.size > 1000) {
            const expireTime = now - timeout;
            for (const [k, v] of this._messageCache.entries()) {
                if (v < expireTime) {
                    this._messageCache.delete(k);
                }
            }
        }
        
        return false; // 不是重复消息
    }

    /**
     * 收到弹幕回调
     * 处理用户在直播间发送的文本弹幕
     * @param {BLiveClient} client 客户端实例
     * @param {DanmakuMessage} message 弹幕消息
     */
    _on_danmaku(client, message) {
        // 生成消息唯一标识，用于去重
        const key = `danmaku_${message.timestamp}_${message.uid}_${message.msg}`;
        if (this._isDuplicateMessage(key)) return;
        
        // 默认行为是打印弹幕到控制台
        console.log(`[${client.roomId}] ${message.uname}：${message.msg}`);
    }

    /**
     * 收到礼物回调
     * 处理用户在直播间赠送的礼物
     * @param {BLiveClient} client 客户端实例
     * @param {GiftMessage} message 礼物消息
     */
    _on_gift(client, message) {
        // 生成消息唯一标识，用于去重
        const key = `gift_${message.uid}_${message.giftId}_${message.timestamp}`;
        if (this._isDuplicateMessage(key)) return;

        // 构建粉丝勋章信息字符串
        let medal_str = '';
        if (message.medal_info && message.medal_info.medal_level > 0) {
            medal_str = `[${message.medal_info.medal_name}${message.medal_info.medal_level}]`;
        }
        
        // 打印礼物信息到控制台
        console.log(`[${client.roomId}] ${message.uname}${medal_str} 赠送 ${message.giftName}x${message.num} (${message.coinType === 'gold' ? '金瓜子' : '银瓜子'}x${message.totalCoin})`);
    }

    /**
     * 用户上舰回调
     * 处理用户购买大航海服务（舰长、提督、总督）
     * @param {BLiveClient} client 客户端实例
     * @param {GuardBuyMessage} message 上舰消息
     */
    _on_buy_guard(client, message) {
        // 打印上舰信息到控制台
        // guardLevel: 3:舰长, 2:提督, 1:总督
        console.log(`[${client.roomId}] ${message.username} 上舰，guard_level=${message.guardLevel}`);
    }

    /**
     * 醒目留言回调
     * 处理用户发送的付费高亮消息（SuperChat）
     * @param {BLiveClient} client 客户端实例
     * @param {SuperChatMessage} message SC消息
     */
    _on_super_chat(client, message) {
        // 打印SC信息到控制台
        console.log(`[${client.roomId}] 醒目留言 ¥${message.price} ${message.uname}：${message.message}`);
    }

    /**
     * 醒目留言删除回调
     * 处理被删除的SC消息
     * @param {BLiveClient} client 客户端实例
     * @param {Object} message 删除消息
     */
    _on_super_chat_delete(client, message) {
        // 可以重写此方法处理SC删除
    }

    /**
     * 点赞信息更新回调
     * 处理直播间总点赞数变化
     * @param {BLiveClient} client 客户端实例
     * @param {LikeInfoV3UpdateMessage} message 点赞信息
     */
    _on_like(client, message) {
        // 可以重写此方法处理总点赞数变化
    }

    /**
     * 用户进入直播间回调
     * 处理用户的各种互动行为（进入、关注、分享等）
     * @param {BLiveClient} client 客户端实例
     * @param {InteractWordMessage} message 互动消息
     */
    _on_interact_word(client, message) {
        // 生成消息唯一标识，用于去重
        const key = `interact_${message.uid}_${message.msgType}_${message.timestamp}`;
        if (this._isDuplicateMessage(key)) return;

        // 构建粉丝勋章信息字符串
        let medal_str = '';
        if (message.fans_medal && message.fans_medal.medal_level > 0) {
            medal_str = `[${message.fans_medal.medal_name}${message.fans_medal.medal_level}]`;
        }

        // 根据消息类型确定用户行为
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
        
        // 打印用户互动信息到控制台
        if (action) {
            console.log(`[${client.roomId}] ${message.uname}${medal_str} ${action}`);
        }
    }

    /**
     * 用户进入特效回调
     * 处理用户进入直播间触发的特效（如舰长进场特效）
     * @param {BLiveClient} client 客户端实例
     * @param {EntryEffectMessage} message 进入特效消息
     */
    _on_entry_effect(client, message) {
        // 默认不输出进入特效信息，可以重写此方法处理特效
    }

    /**
     * 用户点赞回调
     * 处理单个用户的点赞行为
     * @param {BLiveClient} client 客户端实例
     * @param {LikeClickMessage} message 点赞消息
     */
    _on_like_click(client, message) {
        // 生成消息唯一标识，用于去重（点赞没有时间戳，用当前时间）
        const key = `like_${message.uid}_${Date.now()}`;
        if (this._isDuplicateMessage(key)) return;

        // 构建粉丝勋章信息字符串
        let medal_str = '';
        if (message.fans_medal && message.fans_medal.medal_level > 0) {
            medal_str = `[${message.fans_medal.medal_name}${message.fans_medal.medal_level}]`;
        }
        
        // 打印点赞信息到控制台
        console.log(`[${client.roomId}] ${message.uname}${medal_str} 为主播点赞了`);
    }

    /**
     * 用户礼物提示V2回调
     * 处理新版礼物提示（主要是大航海相关）
     * @param {BLiveClient} client 客户端实例
     * @param {UserToastV2Message} message 提示消息
     */
    _on_user_toast_v2(client, message) {
        // 打印上舰信息到控制台
        console.log(`[${client.roomId}] ${message.username} 上舰，guard_level=${message.guard_level}`);
    }

    /**
     * 礼物连击回调
     * 处理用户连续赠送同一礼物的信息
     * @param {BLiveClient} client 客户端实例
     * @param {ComboSendMessage} message 连击消息
     */
    _on_combo_send(client, message) {
        // 默认不输出连击礼物信息，可以重写此方法处理连击
    }

    /**
     * 热门榜单变化回调
     * 处理直播间在热门榜单上排名变化
     * @param {BLiveClient} client 客户端实例
     * @param {HotRankChangedMessage} message 榜单变化消息
     */
    _on_hot_rank_changed(client, message) {
        // 默认不输出热门榜单变化，可以重写此方法处理榜单变化
    }

    /**
     * 热门榜单变化V2回调
     * 处理新版热门榜单变化
     * @param {BLiveClient} client 客户端实例
     * @param {Object} message 榜单变化消息
     */
    _on_hot_rank_changed_v2(client, message) {
        // 默认不输出榜单变化，可以重写此方法处理新版榜单变化
    }

    /**
     * 直播状态变化回调
     * 处理直播开始/结束的通知
     * @param {BLiveClient} client 客户端实例
     * @param {LiveMessage} message 直播状态消息
     */
    _on_live(client, message) {
        // 默认不输出直播状态变化，可以重写此方法处理直播状态
    }

    /**
     * 直播互动游戏回调
     * 处理直播间互动游戏相关的消息
     * @param {BLiveClient} client 客户端实例
     * @param {Object} message 互动游戏消息
     */
    _on_live_interactive_game(client, message) {
        // 默认不输出互动游戏信息，可以重写此方法处理游戏互动
    }

    /**
     * 系统通知回调
     * 处理全平台或房间内的系统通知
     * @param {BLiveClient} client 客户端实例
     * @param {NoticeMsgMessage} message 通知消息
     */
    _on_notice_msg(client, message) {
        // 生成消息唯一标识，用于去重
        const key = `notice_${message.msg_common}`;
        if (this._isDuplicateMessage(key)) return;
        
        // 打印系统通知到控制台
        if (message.msg_common) {
            console.log(`[${client.roomId}] 系统通知: ${message.msg_common}`);
        }
    }

    /**
     * 在线排名前三回调
     * 处理直播间高能用户前三排名
     * @param {BLiveClient} client 客户端实例
     * @param {Object} message 排名消息
     */
    _on_online_rank_top3(client, message) {
        // 默认不输出排名信息，可以重写此方法处理排名
    }

    /**
     * PK结束回调
     * 处理直播间PK对战结束
     * @param {BLiveClient} client 客户端实例
     * @param {Object} message PK消息
     */
    _on_pk_battle_end(client, message) {
        // 默认不输出PK结束信息，可以重写此方法处理PK结束
    }

    /**
     * PK决赛进程回调
     * 处理直播间PK对战决赛阶段
     * @param {BLiveClient} client 客户端实例
     * @param {Object} message PK消息
     */
    _on_pk_battle_final_process(client, message) {
        // 默认不输出PK决赛进程，可以重写此方法处理决赛进程
    }

    /**
     * PK进程回调
     * 处理直播间PK对战的状态变化
     * @param {BLiveClient} client 客户端实例
     * @param {PKBattleMessage} message PK消息
     */
    _on_pk_battle_process(client, message) {
        // 默认不输出PK进程，可以重写此方法处理PK进程
    }

    /**
     * 新版PK进程回调
     * 处理直播间新版PK对战的状态变化
     * @param {BLiveClient} client 客户端实例
     * @param {Object} message PK消息
     */
    _on_pk_battle_process_new(client, message) {
        // 默认不输出新版PK进程，可以重写此方法处理新版PK进程
    }

    /**
     * PK结算回调
     * 处理直播间PK对战结束后的结算信息
     * @param {BLiveClient} client 客户端实例
     * @param {PKBattleSettleMessage} message PK结算消息
     */
    _on_pk_battle_settle(client, message) {
        // 默认不输出PK结算信息，可以重写此方法处理PK结算
    }

    /**
     * PK用户结算回调
     * 处理直播间PK对战中单个用户的结算信息
     * @param {BLiveClient} client 客户端实例
     * @param {Object} message PK用户结算消息
     */
    _on_pk_battle_settle_user(client, message) {
        // 默认不输出PK用户结算，可以重写此方法处理用户结算
    }

    /**
     * PK结算V2回调
     * 处理直播间新版PK对战结算
     * @param {BLiveClient} client 客户端实例
     * @param {Object} message PK结算消息
     */
    _on_pk_battle_settle_v2(client, message) {
        // 默认不输出新版PK结算，可以重写此方法处理新版结算
    }

    /**
     * 直播准备中回调
     * 处理直播间进入准备状态的通知
     * @param {BLiveClient} client 客户端实例
     * @param {PreparingMessage} message 准备消息
     */
    _on_preparing(client, message) {
        // 默认不输出准备中信息，可以重写此方法处理准备状态
    }

    /**
     * 房间实时信息更新回调
     * 处理直播间粉丝数等实时数据的更新
     * @param {BLiveClient} client 客户端实例
     * @param {RoomRealTimeMessageUpdateMessage} message 实时信息
     */
    _on_room_real_time_message_update(client, message) {
        const key = `room_update_${message.roomid}_${message.fans}`;
        if (this._isDuplicateMessage(key)) return;

        // 打印粉丝数变化
        if (message.fans) {
            console.log(`[${client.roomId}] 粉丝数: ${message.fans}`);
        }
    }

    /**
     * 日语SC回调
     * 处理日语环境下的醒目留言
     * @param {BLiveClient} client 客户端实例
     * @param {Object} message 日语SC消息
     */
    _on_super_chat_jpn(client, message) {
        // 默认不特殊处理日语SC，可以重写此方法处理日语SC
    }

    /**
     * 用户提示消息回调
     * 处理用户相关的系统提示
     * @param {BLiveClient} client 客户端实例
     * @param {UserToastMessage} message 提示消息
     */
    _on_user_toast_msg(client, message) {
        // 默认不输出用户提示，可以重写此方法处理用户提示
    }

    /**
     * 横幅组件回调
     * 处理直播间顶部横幅通知
     * @param {BLiveClient} client 客户端实例
     * @param {WidgetBannerMessage} message 横幅消息
     */
    _on_widget_banner(client, message) {
        // 默认不输出横幅信息，可以重写此方法处理横幅
    }

    /**
     * 其他切片加载结果回调
     * 处理其他切片内容的加载情况
     * @param {BLiveClient} client 客户端实例
     * @param {Object} message 加载结果消息
     */
    _on_other_slice_loading_result(client, message) {
        // 默认不输出其他切片加载结果，可以重写此方法处理加载结果
    }

    /**
     * 弹幕互动回调
     * 处理弹幕互动相关的消息（比如连续点赞）
     * @param {BLiveClient} client 客户端实例
     * @param {Object} message 弹幕互动消息
     */
    _on_dm_interaction(client, message) {
        // 默认不输出弹幕互动信息，可以重写此方法处理弹幕互动
        // 一般是处理连续点赞等互动特效
    }
}

module.exports = BaseHandler; 