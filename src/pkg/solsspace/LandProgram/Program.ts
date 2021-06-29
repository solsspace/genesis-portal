import {PublicKey, SYSVAR_RENT_PUBKEY, TransactionInstruction} from "@solana/web3.js";
import {serialize} from "borsh";

export const LAND_PROGRAM_ACC_PUBLIC_KEY = new PublicKey('73SDVkNXf4UBhttg1N6sQa3EVyge9hN7ESSwU7pzDb5T');

// ******** Initialise Land Plane ****************************************

export type InitialiseLandPlaneParams = {
    requiredKeys: {
        // The new land plane account.
        // [writable]
        land_plane_acc_pubkey: PublicKey,
    },
}

export class InitialiseLandPlaneArgs {
    public instruction: number = 0;
}

export const InitialiseLandPlaneArgs_SCHEMA = new Map<any, any>([[
    InitialiseLandPlaneArgs,
    {
        kind: 'struct',
        fields: [
            ['instruction', 'u8'],
        ],
    },
]])

// ******** MintNext ********************************************************

export type MintNextParams = {
    // Public key of the normal system account that is the owner of the given NFT holding SPL
    // associate token account. A signature is required for this account to confirm
    // that the given owner would like to associate the new piece of land with their NFT.
    // [signer]
    nft_assoc_token_acc_owner_pubkey: PublicKey;

    // This key should be a PDA corresponding to the next piece of land.
    // i.e. PDA of (['solsspace-land', land_plane_acc_pubkey, x, y], land_program_acc_pubkey)
    // [writable]
    land_asset_acc_pubkey: PublicKey;

    // Public key of the land plane account from which the next piece of land will be minted.
    // [writable]
    land_plane_acc_pubkey: PublicKey;

    // Public key of the land plane account from which the next piece of land will be minted.
    // []
    nft_assoc_token_acc_pubkey: PublicKey;

    // Public key of the SPL NFT Mint account.
    // []
    nft_mint_acc_pubkey: PublicKey;
}

export const LandProgram = {
    initialiseLandPlane(params: InitialiseLandPlaneParams): TransactionInstruction {
        return new TransactionInstruction({
            programId: LAND_PROGRAM_ACC_PUBLIC_KEY,
            keys: [
                // 1st
                // Addresses requiring signatures are 1st, and in the following order:
                //
                // those that require write access
                // those that require read-only access

                // 2nd
                // Addresses not requiring signatures are 2nd, and in the following order:
                //
                // those that require write access
                {pubkey: params.requiredKeys.land_plane_acc_pubkey, isSigner: false, isWritable: true},
                // those that require read-only access
                {pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false},
            ],
            data: Buffer.from(serialize(InitialiseLandPlaneArgs_SCHEMA, new InitialiseLandPlaneArgs()))
        })
    },
    mint(params: MintNextParams): TransactionInstruction {
        return new TransactionInstruction({
            programId: LAND_PROGRAM_ACC_PUBLIC_KEY,
            keys: [
                // 1st
                // Addresses requiring signatures are 1st, and in the following order:
                //
                // those that require write access
                // those that require read-only access
                {pubkey: params.nft_assoc_token_acc_owner_pubkey, isSigner: true, isWritable: false},

                // 2nd
                // Addresses not requiring signatures are 2nd, and in the following order:
                //
                // those that require write access
                {pubkey: params.land_asset_acc_pubkey, isSigner: false, isWritable: true},
                {pubkey: params.land_plane_acc_pubkey, isSigner: false, isWritable: true},
                // those that require read-only access
                {pubkey: params.nft_assoc_token_acc_pubkey, isSigner: false, isWritable: false},
                {pubkey: params.nft_mint_acc_pubkey, isSigner: false, isWritable: false},
            ],
            data: undefined
        })
    }
}