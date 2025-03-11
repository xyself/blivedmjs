export class HeartbeatMessage {
    constructor(data) {
        this.popularity = data.popularity;
    }
}

export class DanmakuMessage {
    constructor(raw) {
        this.raw = raw;
        const info = raw.info;
        
        this.mode = info[0][1];           // 弹幕显示模式
        this.fontsize = info[0][2];       // 字体大小
        this.color = info[0][3];          // 颜色
        this.timestamp = info[0][4];      // 时间戳（毫秒）
        this.random = info[0][5];         // 随机数
        this.uid = info[2][0];            // 用户ID
        this.uname = info[2][1];          // 用户名
        this.msg = info[1];               // 弹幕内容
        this.isAdmin = info[2][2];        // 是否房管
        this.medal = {                    // 粉丝勋章
            level: info[3][0],            // 勋章等级
            name: info[3][1],             // 勋章名
            anchor: info[3][2],           // 勋章主播名
            roomid: info[3][3],           // 勋章房间号
            color: info[3][4],            // 勋章颜色
            specialColor: info[3][7]       // 特殊颜色
        };
        this.ul = info[4][0];            // 用户等级
        this.ulRank = info[4][1];        // 用户等级排名
    }
}

export class GiftMessage {
    constructor(raw) {
        this.raw = raw;
        const data = raw.data;
        
        this.uid = data.uid;              // 用户ID
        this.uname = data.uname;          // 用户名
        this.giftId = data.giftId;        // 礼物ID
        this.giftName = data.giftName;    // 礼物名
        this.num = data.num;              // 数量
        this.price = data.price;          // 价格（金瓜子）
        this.coinType = data.coin_type;   // 货币类型（'gold' 或 'silver'）
        this.totalCoin = data.total_coin; // 总价格
    }
}

export class InteractWordMessage {
    constructor(raw) {
        this.raw = raw;
        const data = raw.data;
        
        this.uid = data.uid;              // 用户ID
        this.uname = data.uname;          // 用户名
        this.msgType = data.msg_type;     // 消息类型（1：进入）
        this.timestamp = data.timestamp;   // 时间戳
        this.score = data.score;          // 积分
        this.fans_medal = data.fans_medal ? {  // 粉丝勋章（可能为null）
            anchor_roomid: data.fans_medal.anchor_roomid,  // 勋章房间号
            medal_level: data.fans_medal.medal_level,      // 勋章等级
            medal_name: data.fans_medal.medal_name,        // 勋章名
            target_id: data.fans_medal.target_id          // 主播ID
        } : {
            anchor_roomid: 0,
            medal_level: 0,
            medal_name: '',
            target_id: 0
        };
    }
}

export class GuardBuyMessage {
    constructor(raw) {
        this.raw = raw;
        const data = raw.data;
        
        this.uid = data.uid;              // 用户ID
        this.username = data.username;     // 用户名
        this.guardLevel = data.guard_level;// 舰队等级（3：舰长，2：提督，1：总督）
        this.num = data.num;              // 数量
        this.price = data.price;          // 单价（金瓜子）
        this.giftId = data.gift_id;       // 礼物ID
        this.giftName = data.gift_name;   // 礼物名
    }
}

export class SuperChatMessage {
    constructor(raw) {
        this.raw = raw;
        const data = raw.data;
        
        this.uid = data.uid;              // 用户ID
        this.uname = data.user_info.uname;// 用户名
        this.message = data.message;      // 消息内容
        this.price = data.price;          // 价格（人民币）
        this.time = data.time;            // 持续时间（秒）
        this.startTime = data.start_time; // 开始时间戳
        this.endTime = data.end_time;     // 结束时间戳
    }
}

export class WatchedChangeMessage {
    constructor(data) {
        this.num = data.data.num;
        this.text_small = data.data.text_small;
        this.text_large = data.data.text_large;
    }
}

export class OnlineRankCountMessage {
    constructor(data) {
        this.count = data.data.count;
        this.count_text = data.data.count_text;
        this.online_count = data.data.online_count;
        this.online_count_text = data.data.online_count_text;
    }
}

export class OnlineRankV2Message {
    constructor(data) {
        this.online_list = data.data.online_list;
        this.rank_type = data.data.rank_type;
    }
}

export class StopLiveRoomListMessage {
    constructor(data) {
        this.room_id_list = data.data.room_id_list;
    }
}

export class LikeInfoV3UpdateMessage {
    constructor(data) {
        this.click_count = data.data.click_count;
    }
}

export class EntryEffectMessage {
    constructor(message) {
        this.uid = message.data.uid;
        this.uname = message.data.copy_writing;
        this.privilege_type = message.data.privilege_type;
        this.copy_writing = message.data.copy_writing;
    }
}

export class LikeClickMessage {
    constructor(message) {
        this.uid = message.data.uid;
        this.uname = message.data.uname;
        this.like_text = message.data.like_text;
        this.uinfo = message.data.uinfo;
        this.fans_medal = message.data.fans_medal ? {
            anchor_roomid: message.data.fans_medal.anchor_roomid,
            medal_level: message.data.fans_medal.medal_level,
            medal_name: message.data.fans_medal.medal_name,
            target_id: message.data.fans_medal.target_id
        } : null;
    }
}

export class UserToastV2Message {
    constructor(message) {
        const data = message.data;
        this.username = data.username;
        this.guard_level = data.guard_level;
        this.price = data.price;
        this.num = data.num;
        this.unit = data.unit;
        this.role_name = data.role_name;
        this.start_time = data.start_time;
        this.end_time = data.end_time;
    }
}

export class ComboSendMessage {
    constructor(message) {
        const data = message.data;
        this.uid = data.uid;
        this.uname = data.uname;
        this.combo_num = data.combo_num;
        this.gift_name = data.gift_name;
        this.gift_id = data.gift_id;
        this.price = data.price;
        this.combo_total_coin = data.combo_total_coin;
    }
}

export class HotRankChangedMessage {
    constructor(message) {
        const data = message.data;
        this.rank = data.rank;
        this.trend = data.trend;
        this.countdown = data.countdown;
        this.timestamp = data.timestamp;
        this.web_url = data.web_url;
        this.live_url = data.live_url;
        this.pc_link_url = data.pc_link_url;
    }
}

export class LiveMessage {
    constructor(message) {
        const data = message.data;
        this.live_status = data.live_status;
        this.live_time = data.live_time;
        this.live_key = data.live_key;
    }
}

export class NoticeMsgMessage {
    constructor(message) {
        const data = message;
        this.msg_common = data.msg_common;
        this.msg_self = data.msg_self;
        this.link_url = data.link_url;
        this.msg_type = data.msg_type;
    }
}

export class PKBattleMessage {
    constructor(message) {
        const data = message.data;
        this.battle_type = data.battle_type;
        this.init_info = data.init_info;
        this.match_info = data.match_info;
        this.pk_status = data.pk_status;
    }
}

export class PKBattleSettleMessage {
    constructor(message) {
        const data = message.data;
        this.pk_id = data.pk_id;
        this.settle_status = data.settle_status;
        this.timestamp = data.timestamp;
        this.winner = data.winner;
    }
}

export class PreparingMessage {
    constructor(message) {
        const data = message.data;
        this.roomid = data.roomid;
    }
}

export class RoomRealTimeMessageUpdateMessage {
    constructor(message) {
        const data = message.data;
        this.roomid = data.roomid;
        this.fans = data.fans;
        this.red_notice = data.red_notice;
        this.fans_club = data.fans_club;
    }
}

export class UserToastMessage {
    constructor(message) {
        const data = message.data;
        this.uid = data.uid;
        this.username = data.username;
        this.guard_level = data.guard_level;
        this.toast_msg = data.toast_msg;
    }
}

export class WidgetBannerMessage {
    constructor(message) {
        const data = message.data;
        this.timestamp = data.timestamp;
        this.widget_list = data.widget_list;
    }
} 