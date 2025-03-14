class OpenLiveDanmakuMessage {
    constructor(message) {
        const data = message.data;
        this.uname = data.uname;
        this.uid = data.uid;
        this.msg = data.msg;
        this.timestamp = data.timestamp;
        this.room_id = data.room_id;
        this.fans_medal_level = data.fans_medal_level;
        this.fans_medal_name = data.fans_medal_name;
        this.fans_medal_wearing_status = data.fans_medal_wearing_status;
    }
}

class OpenLiveGiftMessage {
    constructor(message) {
        const data = message.data;
        this.uid = data.uid;
        this.uname = data.uname;
        this.gift_id = data.gift_id;
        this.gift_name = data.gift_name;
        this.gift_num = data.gift_num;
        this.price = data.price;
        this.paid = data.paid;
        this.fans_medal_level = data.fans_medal_level;
        this.fans_medal_name = data.fans_medal_name;
        this.fans_medal_wearing_status = data.fans_medal_wearing_status;
    }
}

class OpenLiveGuardMessage {
    constructor(message) {
        const data = message.data;
        this.user_info = data.user_info;
        this.guard_level = data.guard_level;
        this.guard_num = data.guard_num;
        this.guard_unit = data.guard_unit;
    }
}

class OpenLiveSuperChatMessage {
    constructor(message) {
        const data = message.data;
        this.uid = data.uid;
        this.uname = data.uname;
        this.message = data.message;
        this.price = data.price;
        this.message_jpn = data.message_jpn;
        this.start_time = data.start_time;
        this.end_time = data.end_time;
    }
}

class OpenLiveLikeMessage {
    constructor(message) {
        const data = message.data;
        this.uname = data.uname;
        this.uid = data.uid;
        this.like_text = data.like_text;
        this.fans_medal_level = data.fans_medal_level;
        this.fans_medal_name = data.fans_medal_name;
        this.fans_medal_wearing_status = data.fans_medal_wearing_status;
    }
}

class OpenLiveEnterRoomMessage {
    constructor(message) {
        const data = message.data;
        this.uname = data.uname;
        this.uid = data.uid;
        this.fans_medal_level = data.fans_medal_level;
        this.fans_medal_name = data.fans_medal_name;
        this.fans_medal_wearing_status = data.fans_medal_wearing_status;
    }
}

class OpenLiveStartMessage {
    constructor(message) {
        const data = message.data;
        this.room_id = data.room_id;
        this.timestamp = data.timestamp;
    }
}

class OpenLiveEndMessage {
    constructor(message) {
        const data = message.data;
        this.room_id = data.room_id;
        this.timestamp = data.timestamp;
    }
}

module.exports = {
    OpenLiveDanmakuMessage,
    OpenLiveGiftMessage,
    OpenLiveGuardMessage,
    OpenLiveSuperChatMessage,
    OpenLiveLikeMessage,
    OpenLiveEnterRoomMessage,
    OpenLiveStartMessage,
    OpenLiveEndMessage
}; 