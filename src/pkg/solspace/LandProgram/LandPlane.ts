import {deserialize} from "borsh";

export const LAND_PLANE_ACC_DATA_LEN = 1 + 8 * 3;

export enum LandPlaneVersion {
    Uninitialized,
    PlaneV1,
}

export class LandPlane {
    static newFromBuffer(buffer: Buffer): LandPlane {
        return deserialize(
            LandPlane_SCHEMA,
            LandPlane,
            buffer
        )
    }

    public version: LandPlaneVersion = LandPlaneVersion.Uninitialized;
    public last_minted_x: number = 0;
    public last_minted_y: number = 0;
    public depth: number = 0;

    constructor(l?: LandPlane) {
        if (!l) {
            return;
        }
        this.version = l.version;
        this.last_minted_x = l.last_minted_x;
        this.last_minted_y = l.last_minted_y;
        this.depth = l.depth;
    }
}

export const LandPlane_SCHEMA = new Map<any, any>([[
    LandPlane,
    {
        kind: 'struct',
        fields: [
            ['version', 'u8'],
            ['last_minted_x', 'u64'],
            ['last_minted_y', 'u64'],
            ['depth', 'u64'],
        ],
    },
]])