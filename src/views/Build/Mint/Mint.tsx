import React, {useCallback} from "react";
import {Button} from "@material-ui/core";
import {useSolanaContext} from "../../../context/Solana";
import {Context, Logs, PublicKey, SystemProgram, Transaction, TransactionInstruction} from "@solana/web3.js";
import {LAND_PROGRAM_ACC_PUBLIC_KEY} from "../../../pkg/solsspace/LandProgram";
import {useSnackbar} from "notistack";

export default function Mint() {
    const {solanaRPCConnection, solanaSelectedWallet} = useSolanaContext();
    const {enqueueSnackbar} = useSnackbar();

    const handleMint = useCallback(async () => {
        if (!(solanaRPCConnection && solanaSelectedWallet)) {
            return;
        }

        // generate pda
        let k: PublicKey;
        try {
            k = (await PublicKey.findProgramAddress(
                [
                    Buffer.from("asdf"),
                ],
                LAND_PROGRAM_ACC_PUBLIC_KEY,
            ))[0];
        } catch (e) {
            console.error(`error generating program address: ${e}`)
            return;
        }
        console.log(`made key: ${k.toString()}`);

        // prepare instructions for transaction
        const instructions: TransactionInstruction[] = [
            SystemProgram.transfer({
                fromPubkey: solanaSelectedWallet.publicKey(),
                toPubkey: k,
                lamports: 233,
            }),
        ];

        // prepare a new transaction
        let txn = new Transaction();
        txn.recentBlockhash = (
            await solanaRPCConnection.getRecentBlockhash('max')
        ).blockhash;
        txn.feePayer = solanaSelectedWallet.publicKey();

        // add each of the instructions
        instructions.forEach((i) => {
            txn = txn.add(i)
        })

        // sign txn
        txn = await solanaSelectedWallet.signTransaction(txn);

        try {
            // subscribe to logs to monitor execution
            const subNo = solanaRPCConnection.onLogs(
                solanaSelectedWallet.publicKey(),
                (logs: Logs, ctx: Context) => {
                    console.debug(`slot no. ${ctx.slot}`)
                    if (logs.err) {
                        console.error(logs.err.toString())
                    }
                    logs.logs.forEach((l) => console.debug(l));
                }
            )

            // submit txn to network
            const txnSignature = await solanaRPCConnection.sendRawTransaction(txn.serialize());
            console.debug(`sent transaction ${txnSignature}`);

            // wait for confirmation
            const response = await solanaRPCConnection.confirmTransaction(txnSignature);
            if (response.value.err) {
                enqueueSnackbar(`Error Creating Land: ${response.value.err}`, {variant: 'error'});
            } else {
                enqueueSnackbar('Land Created', {variant: 'success'});
            }

            // unsubscribe from logs
            await solanaRPCConnection.removeOnLogsListener(subNo);
        } catch (e) {
            console.error(`error submitting transaction: ${e}`);
        }

    }, [solanaRPCConnection]);

    return (
        <div>
            <Button
                onClick={handleMint}
                children={'mint'}
            />
        </div>
    )
}