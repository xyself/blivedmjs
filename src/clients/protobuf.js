// src/clients/protobuf.js
// 简易protobuf字段解析工具，兼容B站INTERACT_WORD_V2等pb字段。
// 由 Python 版 /protobuf.py 移植

const base64 = require('base64-js');

function readVarint(buf, pos) {
    let result = 0;
    let shift = 0;
    let b;
    do {
        b = buf[pos];
        pos += 1;
        result |= (b & 0x7F) << shift;
        shift += 7;
    } while (b & 0x80);
    return [result, pos];
}

function parsePb(pbBase64) {
    const buf = Buffer.from(pbBase64, 'base64');
    let pos = 0;
    const fields = {};
    while (pos < buf.length) {
        let [key, newPos] = readVarint(buf, pos);
        pos = newPos;
        const fieldNum = key >> 3;
        const wireType = key & 0x7;
        let value = null;
        if (wireType === 0) { // varint
            [value, pos] = readVarint(buf, pos);
        } else if (wireType === 2) { // length-delimited
            let length;
            [length, pos] = readVarint(buf, pos);
            const valueBytes = buf.slice(pos, pos + length);
            try {
                value = valueBytes.toString('utf-8');
            } catch (e) {
                value = valueBytes;
            }
            pos += length;
        } else {
            // 其他类型暂不处理
            break;
        }
        fields[fieldNum] = value;
    }
    return fields;
}

module.exports = {
    parsePb,
    readVarint
};
