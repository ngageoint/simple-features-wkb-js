import {ByteOrder} from "./ByteOrder";

/**
 * This class was heavily influenced by https://github.com/cschwarz/wkx/blob/master/lib/binaryreader.js
 */
export class ByteReader {
    buffer: Buffer;
    position: number;
    byteOrder: ByteOrder
    public readUInt8: Function;
    public readUInt16: Function;
    public readUInt32: Function;
    public readInt8: Function;
    public readInt16: Function;
    public readInt32: Function;
    public readFloat: Function;
    public readDouble: Function;
    public readByte: Function;
    public readInt: Function;

    constructor(buffer: Buffer, byteOrder: ByteOrder = ByteOrder.BIG_ENDIAN) {
        this.buffer = buffer;
        this.position = 0;
        this.setByteOrder(byteOrder);
    }
    
    private _read(read, size) {
        return function () {
            let value = read.call(this.buffer, this.position);
            this.position += size;
            return value;
        }.bind(this);
    }

    readVarInt(): any {
        let nextByte,
            result = 0,
            bytesRead = 0;

        do {
            nextByte = this.buffer[this.position + bytesRead];
            result += (nextByte & 0x7F) << (7 * bytesRead);
            bytesRead++;
        } while (nextByte >= 0x80);

        this.position += bytesRead;

        return result;
    };

    public getByteOrder(): ByteOrder {
        return this.byteOrder;
    }

    public setByteOrder(byteOrder: ByteOrder): void {
        this.byteOrder = byteOrder;

        if (byteOrder === ByteOrder.BIG_ENDIAN) {
            this.readUInt8 = this._read(Buffer.prototype.readUInt8, 1);
            this.readUInt16 = this._read(Buffer.prototype.readUInt16BE, 2);
            this.readUInt32 = this._read(Buffer.prototype.readUInt32BE, 4);
            this.readInt8 = this._read(Buffer.prototype.readInt8, 1);
            this.readInt16 = this._read(Buffer.prototype.readInt16BE, 2);
            this.readInt32 = this._read(Buffer.prototype.readInt32BE, 4);
            this.readFloat = this._read(Buffer.prototype.readFloatBE, 4);
            this.readDouble = this._read(Buffer.prototype.readDoubleBE, 8);
            this.readByte = this.readUInt8;
            this.readInt = this.readUInt32;
        } else {
            this.readUInt8 = this._read(Buffer.prototype.readUInt8, 1);
            this.readUInt16 = this._read(Buffer.prototype.readUInt16LE, 2);
            this.readUInt32 = this._read(Buffer.prototype.readUInt32LE, 4);
            this.readInt8 = this._read(Buffer.prototype.readInt8, 1);
            this.readInt16 = this._read(Buffer.prototype.readInt16LE, 2);
            this.readInt32 = this._read(Buffer.prototype.readInt32LE, 4);
            this.readFloat = this._read(Buffer.prototype.readFloatLE, 4);
            this.readDouble = this._read(Buffer.prototype.readDoubleLE, 8);
            this.readByte = this.readUInt8;
            this.readInt = this.readUInt32;
        }
    }
}