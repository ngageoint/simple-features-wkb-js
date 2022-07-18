/**
 * This class was heavily influenced by https://github.com/cschwarz/wkx/blob/master/lib/binarywriter.js
 */
import { ByteOrder } from "./ByteOrder";

export class ByteWriter {
    buffer: Buffer;
    position: number;
    allowResize: boolean;
    byteOrder: ByteOrder;
    public writeUInt8: Function;
    public writeUInt16: Function;
    public writeUInt32: Function;
    public writeInt8: Function;
    public writeInt16: Function;
    public writeInt32: Function;
    public writeFloat: Function;
    public writeDouble: Function;
    public writeInt: Function;

    constructor (size: number, byteOrder: ByteOrder = ByteOrder.BIG_ENDIAN, allowResize = false) {
        this.buffer = Buffer.alloc(size);
        this.position = 0;
        this.allowResize = allowResize;
        this.setByteOrder(byteOrder);
    }

    private _write(write, size): any {
        return function (value: any, noAssert: boolean) {
            this.ensureSize(size);
            write.call(this.buffer, value, this.position, noAssert);
            this.position += size;
        }.bind(this);
    }

    public setByteOrder (byteOrder: ByteOrder) {
        this.byteOrder = byteOrder;
        if (byteOrder === ByteOrder.BIG_ENDIAN) {
            this.writeUInt8 = this._write(Buffer.prototype.writeUInt8, 1);
            this.writeUInt16 = this._write(Buffer.prototype.writeUInt16BE, 2);
            this.writeUInt32 = this._write(Buffer.prototype.writeUInt32BE, 4);
            this.writeInt8 = this._write(Buffer.prototype.writeInt8, 1);
            this.writeInt16 = this._write(Buffer.prototype.writeInt16BE, 2);
            this.writeInt32 = this._write(Buffer.prototype.writeInt32BE, 4);
            this.writeFloat = this._write(Buffer.prototype.writeFloatBE, 4);
            this.writeDouble = this._write(Buffer.prototype.writeDoubleBE, 8);
            this.writeInt = this.writeUInt32;
        } else {
            this.writeUInt8 = this._write(Buffer.prototype.writeUInt8, 1);
            this.writeUInt16 = this._write(Buffer.prototype.writeUInt16LE, 2);
            this.writeUInt32 = this._write(Buffer.prototype.writeUInt32LE, 4);
            this.writeInt8 = this._write(Buffer.prototype.writeInt8, 1);
            this.writeInt16 = this._write(Buffer.prototype.writeInt16LE, 2);
            this.writeInt32 = this._write(Buffer.prototype.writeInt32LE, 4);
            this.writeFloat = this._write(Buffer.prototype.writeFloatLE, 4);
            this.writeDouble = this._write(Buffer.prototype.writeDoubleLE, 8);
            this.writeInt = this.writeUInt32;
        }
    }

    public getByteOrder (): ByteOrder {
        return this.byteOrder;
    }

    public writeBuffer(buffer: Buffer) {
        this.ensureSize(buffer.length);
        buffer.copy(this.buffer, this.position, 0, buffer.length);
        this.position += buffer.length;
    };

    public writeVarInt(value) {
        let length = 1;
        while ((value & 0xFFFFFF80) !== 0) {
            this.writeUInt8((value & 0x7F) | 0x80);
            value >>>= 7;
            length++;
        }

        this.writeUInt8(value & 0x7F);
        return length;
    };

    public ensureSize(size): void {
        if (this.buffer.length < this.position + size) {
            if (this.allowResize) {
                const tempBuffer = Buffer.alloc(this.position + size);
                this.buffer.copy(tempBuffer, 0, 0, this.buffer.length);
                this.buffer = tempBuffer;
            } else {
                throw new Error('index out of range');
            }
        }
    };

    public getBuffer (): Buffer {
        return this.buffer;
    }

}
