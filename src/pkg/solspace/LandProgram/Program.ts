import {PublicKey, SYSVAR_RENT_PUBKEY, TransactionInstruction} from "@solana/web3.js";
import {serialize} from "borsh";
import {} from '@solana/spl-token';

export const LAND_PROGRAM_ACC_PUBLIC_KEY = new PublicKey('73SDVkNXf4UBhttg1N6sQa3EVyge9hN7ESSwU7pzDb5T');

// ******** Initialise Land Plane ****************************************

export type InitialiseLandPlaneParams = {
    requiredKeys: {
        // The new land account.
        // PDA of
        // Req: [writable]
        landPlaneAccPublicKey: PublicKey,
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

// ******** Mint ********************************************************

export type MintParams = {
    // The person that will own the minted land piece.
    // Signature required to prove that the person who
    // owns the NFT token atm. is wanting to try do this
    // mint.
    // Req: [signer]
    newNFTTokenAccOwnerAccPubKey: PublicKey;

    // The person that will pay for any rent required in
    // the mint process.
    // Req: [signer]
    rentPayerAccPublicKey: PublicKey;

    // new land asset account that is the PDA of:
    // ([
    //      'land',
    //       landProgramAccPublicKey
    // ], landProgramAccPublicKey)
    // Req: [writable]
    landPlaneAccPublicKey: PublicKey;

    // new land asset account that is the PDA of:
    // ([
    //      'land',
    //      nextXValue,
    //      nextYValue,
    // ], landProgramAccPublicKey)
    // Req: [writable]
    landAssetAccPublicKey: PublicKey;

    // spl mint acc for nft
    // Req: []
    nftMintAccPubKey: PublicKey;

    // spl associated token holding acc for nft
    // i.e. PDA of:
    // ([
    //      newNFTTokenAccOwnerAccPubKey, tokenProgramPubKey, nftMintAccPubKey
    //  ], splAssociatedTokenAccProgramID)
    // Note: must hold a balance of 1 of this
    // Req: []
    newNFTOwnerAccAssociatedTokenAccPublicKey: PublicKey
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
                {pubkey: params.requiredKeys.landPlaneAccPublicKey, isSigner: false, isWritable: true},
                // those that require read-only access
                {pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false},
            ],
            data: Buffer.from(serialize(InitialiseLandPlaneArgs_SCHEMA, new InitialiseLandPlaneArgs()))
        })
    },
    mint(params: MintParams): TransactionInstruction {
        return new TransactionInstruction({
            programId: LAND_PROGRAM_ACC_PUBLIC_KEY,
            keys: [
                // 1st
                // Addresses requiring signatures are 1st, and in the following order:
                //
                // those that require write access
                // those that require read-only access
                {pubkey: params.newNFTTokenAccOwnerAccPubKey, isSigner: true, isWritable: false},
                {pubkey: params.rentPayerAccPublicKey, isSigner: true, isWritable: false},

                // 2nd
                // Addresses not requiring signatures are 2nd, and in the following order:
                //
                // those that require write access
                {pubkey: params.landPlaneAccPublicKey, isSigner: false, isWritable: true},
                {pubkey: params.landAssetAccPublicKey, isSigner: false, isWritable: true},
                // those that require read-only access
                {pubkey: params.newNFTOwnerAccAssociatedTokenAccPublicKey, isSigner: false, isWritable: false},
                {pubkey: LAND_PROGRAM_ACC_PUBLIC_KEY, isSigner: false, isWritable: false},
            ],
            data: undefined
        })
    }
}