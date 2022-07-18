const isBigEndian = (() => {
    const array = new Uint8Array(4);
    const view = new Uint32Array(array.buffer);
    return !((view[0] = 1) & array[0]);
})();

export enum ByteOrder {
    BIG_ENDIAN,
    LITTLE_ENDIAN
}

export namespace ByteOrder {
    export function nameFromType(type: ByteOrder): string {
        let name = null;
        if (type !== null && type !== undefined) {
            name = ByteOrder[type];
        }
        return name;
    }

    export function fromName(type: string): ByteOrder {
        return ByteOrder[type as keyof typeof ByteOrder] as ByteOrder;
    }

    export function getSystemDefault(): ByteOrder {
       return isBigEndian ? ByteOrder.BIG_ENDIAN : ByteOrder.LITTLE_ENDIAN;
    }
}