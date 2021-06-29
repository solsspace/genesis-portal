import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CircularProgress,
    Divider,
    Grid,
    IconButton,
    makeStyles,
    TextField,
    Theme, Tooltip,
    Typography
} from "@material-ui/core";
import {
    LanguageOutlined as WorldIcon,
    Star as GenerateIcon
} from '@material-ui/icons'
import {useSnackbar} from "notistack";
import {useSolanaContext} from "../../../context/Solana";
import {Context, Keypair, Logs, PublicKey, SystemProgram, Transaction, TransactionInstruction} from "@solana/web3.js";
import {TouchedFields, ValidationResult} from "../../../common";
import {
    LandProgram,
    LandPlane,
    LandPlaneVersion, LAND_PLANE_ACC_DATA_LEN, LAND_PROGRAM_ACC_PUBLIC_KEY,
} from "../../../pkg/solsspace/LandProgram";

const useStyles = makeStyles((theme: Theme) => ({
    cardRoot: {},
    headerRoot: {
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'center',
        columnGap: theme.spacing(3)
    },
    cardContent: {
        display: 'grid',
        gridTemplateColumns: 'auto',
        rowGap: theme.spacing(2)
    },
    cardContentBody: {
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        columnGap: theme.spacing(2)
    },
    landPlanePublicKeyField: {
        minWidth: 455,
        marginBottom: theme.spacing(1)
    },
    publicKeyRow: {
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        columnGap: theme.spacing(1),
        alignItems: 'center'
    },
    cardContentBodyTextField: {
        minWidth: 450
    },
    cardContentBodyRight: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gridTemplateRows: '1fr auto',
        alignItems: 'center',
        rowGap: theme.spacing(2)
    },
    cardContentBodyRightWorldIconWrapper: {
        display: 'flex',
        justifyContent: 'center'
    }
}))

export type LandPlaneCardProps = {
    landPlaneAccPublicKey?: PublicKey;
    controls?: React.ReactNode[];
}

function performValidation(
    landPlaneAccPublicKey: string,
    touchedFields: TouchedFields,
    ignoreTouchedFields: boolean
): ValidationResult {
    // prepare a validation result
    const validationResult: ValidationResult = {
        // assumed to be true -
        // any error must set to false regardless of touched field state
        valid: true,
        // field validations
        fieldValidations: {}
    };

    // if the land plane account is less than 44 chars long
    if (landPlaneAccPublicKey.length !== 44) {
        // then validation has failed
        validationResult.valid = false;

        // and if the field has been touched
        if (ignoreTouchedFields || touchedFields.landPlaneAccPublicKey) {
            // then an error message should be shown on it
            validationResult.fieldValidations.landPlaneAccPublicKey = 'Should be 44 chars';
        }
    } else {
        // key is correct length, attempt parse
        try {
            new PublicKey(landPlaneAccPublicKey);
        } catch (e) {
            // if any errors are thrown then validation has failed
            validationResult.valid = false;

            // and if the field has been touched
            if (ignoreTouchedFields || touchedFields.landPlaneAccPublicKey) {
                // then an error message should be shown on it
                validationResult.fieldValidations.landPlaneAccPublicKey = 'Invalid';
            }
        }
    }

    return validationResult;
}

export function LandPlaneCard(props: LandPlaneCardProps) {
    const classes = useStyles();
    const {
        solanaRPCConnection,
        solanaRPCConnectionInitializing,
        solanaSelectedWallet
    } = useSolanaContext();
    const {enqueueSnackbar} = useSnackbar();
    const [loading, setLoading] = useState(false);
    const [landPlaneAccPublicKey, setLandPlaneAccPublicKey] = useState(props.landPlaneAccPublicKey ? props.landPlaneAccPublicKey.toString() : '');
    const [landPlane, setLandPlane] = useState<LandPlane>(new LandPlane());
    const [landPlaneAccExists, setLandPlaneAccExists] = useState(false);
    const validationTimeoutRef = useRef<any>(undefined);
    const [touchedFields, setTouchedFields] = useState<TouchedFields>({});
    const [validationInProgress, setValidationInProgress] = useState(false);
    const [keyPairForNewLand, setKeyPairForNewLand] = useState<Keypair | undefined>(undefined);
    const [validationResult, setValidationResult] = useState<ValidationResult>({
        valid: false,
        fieldValidations: {}
    });

    const handleChangeLandPlaneAccPublicKey = (newValue: string) => {
        // prepare updated touched fields
        const updatedTouchedFields = {...touchedFields, landPlaneAccPublicKey: true};

        // set updated touched fields and land plane
        setTouchedFields(updatedTouchedFields);
        setLandPlaneAccPublicKey(newValue);
    }

    // whenever landPlaneAccPublicKey changes this useEffect will:
    //  - validate updated landPlaneAccPublicKey
    //  - (if it is valid) look for landPlaneAccPublicKey to see if
    //    it already exists and, if so, parse to display it's state
    useEffect(() => {
        if (!solanaRPCConnection) {
            return;
        }

        // clear any pending validation
        clearTimeout(validationTimeoutRef.current);

        // defer validation to take place in 800ms
        clearTimeout(validationTimeoutRef.current);
        setValidationInProgress(true);
        validationTimeoutRef.current = setTimeout(
            async () => {
                if (!solanaRPCConnection) {
                    console.error('solana rpc connection not set')
                    return;
                }

                // validate updated landPlaneAccPublicKey
                const result = performValidation(
                    landPlaneAccPublicKey,
                    touchedFields,
                    false
                );

                if (result.valid) {
                    // landPlaneAccPublicKey is valid, parse to public key
                    const parsedLandPlaneAccPublicKey = new PublicKey(landPlaneAccPublicKey);

                    // check if an account with this public key already exists
                    try {
                        const response = await solanaRPCConnection.getAccountInfo(parsedLandPlaneAccPublicKey, 'confirmed');
                        if (response) {
                            // parse data here....
                            setLandPlane(LandPlane.newFromBuffer(response.data))
                            setLandPlaneAccExists(true);
                        } else if (landPlane.version !== LandPlaneVersion.Uninitialized) {
                            setLandPlane(new LandPlane({
                                ...landPlane,
                                version: LandPlaneVersion.Uninitialized,
                            }))
                            setLandPlaneAccExists(false);
                        }
                    } catch (e) {
                        setLandPlane(new LandPlane({
                            ...landPlane,
                            version: LandPlaneVersion.Uninitialized,
                        }))
                        setLandPlaneAccExists(false);
                        console.error(`error finding account: ${e}`);
                        enqueueSnackbar(
                            `error finding account: ${e}`,
                            {variant: 'error'}
                        );
                        return;
                    }
                }

                setValidationResult(result);
                setValidationInProgress(false);
            },
            800
        );
    }, [landPlaneAccPublicKey, solanaRPCConnection, enqueueSnackbar, landPlane, touchedFields])

    const handleInitialise = useCallback(async () => {
        if (!(
            solanaRPCConnection &&
            validationResult.valid &&
            solanaSelectedWallet &&
            keyPairForNewLand
        )) {
            return;
        }

        setLoading(true);

        try {
            // get required opening balances for rent exemption for land plane account
            const landPlaneAccOpeningBal = await solanaRPCConnection.getMinimumBalanceForRentExemption(
                LAND_PLANE_ACC_DATA_LEN,
            );

            // prepare instructions for transaction
            const instructions: TransactionInstruction[] = [
                SystemProgram.createAccount({
                    fromPubkey: solanaSelectedWallet.publicKey(),
                    newAccountPubkey: keyPairForNewLand.publicKey,
                    lamports: landPlaneAccOpeningBal,
                    space: LAND_PLANE_ACC_DATA_LEN,
                    programId: LAND_PROGRAM_ACC_PUBLIC_KEY,
                }),

                LandProgram.initialiseLandPlane({
                    requiredKeys: {
                        land_plane_acc_pubkey: keyPairForNewLand.publicKey,
                    },
                })
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

            // sign txn by person who will pay for this and
            // extract the required expected signatures
            // (wild I know - but necessary since signing overwrites :( )
            const feePayerSig = (await solanaSelectedWallet.signTransaction(txn)).signatures[0];

            // sign txn by all accounts being created and get sigs
            txn.sign(
                keyPairForNewLand
            )

            // signatures back together again
            txn.signatures = [
                feePayerSig,
                ...txn.signatures.slice(1)
            ]

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
            console.error(`error doing thing: ${e}`)
            enqueueSnackbar(
                `error creating land: ${e}`,
                {variant: 'error'}
            );
        }

        setLoading(false);
    }, [solanaRPCConnection, validationResult.valid, enqueueSnackbar, solanaSelectedWallet, keyPairForNewLand])

    return (
        <Card classes={{root: classes.cardRoot}}>
            <CardHeader
                disableTypography
                title={
                    <div className={classes.headerRoot}>
                        <Grid container alignItems={'center'} spacing={2}>
                            {([
                                <Typography
                                    variant={'h6'}
                                    children={
                                        (landPlaneAccExists && (landPlane.version !== LandPlaneVersion.Uninitialized))
                                            ? 'This land Exists!'
                                            : 'This could be a new land'
                                    }
                                />,
                                (loading || validationInProgress) ? <CircularProgress size={20}/> : null,
                            ]).map((n, idx) => (<Grid key={idx} item>{n}</Grid>))}
                        </Grid>
                        <Grid container>
                            {props.controls
                                ? props.controls.map((n, idx) => (<Grid key={idx} item>{n}</Grid>))
                                : null
                            }
                        </Grid>
                    </div>
                }
            />
            <CardContent className={classes.cardContent}>
                {(!solanaRPCConnection || solanaRPCConnectionInitializing)
                    ? (<CircularProgress size={50}/>)
                    : (
                        <>
                            <div className={classes.cardContentBody}>
                                <Grid container direction={'column'} spacing={1}>
                                    {([
                                        <>
                                            <Typography variant={'body2'}>
                                                Enter a public key to see the associated land account,
                                            </Typography>
                                            <Typography variant={'body2'}>
                                                or select generate to add a new random land.
                                            </Typography>
                                        </>,
                                        <div className={classes.publicKeyRow}>
                                            <TextField
                                                disabled={loading}
                                                className={classes.landPlanePublicKeyField}
                                                label={'Land Plane Account Public Key'}
                                                value={landPlaneAccPublicKey}
                                                inputProps={{maxLength: 44}}
                                                onChange={(e) => handleChangeLandPlaneAccPublicKey(e.target.value)}
                                                placeholder={'Populate or create new'}
                                                error={!!validationResult.fieldValidations.landPlaneAccPublicKey}
                                                helperText={validationResult.fieldValidations.landPlaneAccPublicKey}
                                            />
                                            <Tooltip
                                                title={'Generate new random land'}
                                                placement={'top'}
                                            >
                                                <span>
                                                    <IconButton
                                                        onClick={() => {
                                                            const newRandomKeyPairForLand = Keypair.generate();
                                                            handleChangeLandPlaneAccPublicKey(newRandomKeyPairForLand.publicKey.toString());
                                                            setKeyPairForNewLand(newRandomKeyPairForLand);
                                                        }}
                                                    >
                                                        <GenerateIcon/>
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </div>,
                                        <Divider/>,
                                        <TextField
                                            className={classes.cardContentBodyTextField}
                                            label={'Last Minted X'}
                                            value={landPlane.last_minted_x}
                                            aria-readonly={'true'}
                                            variant={'standard'}
                                            InputProps={{readOnly: true, disableUnderline: true}}
                                        />,
                                        <Divider/>,
                                        <TextField
                                            className={classes.cardContentBodyTextField}
                                            label={'Last Minted Y'}
                                            value={landPlane.last_minted_y}
                                            aria-readonly={'true'}
                                            variant={'standard'}
                                            InputProps={{readOnly: true, disableUnderline: true}}
                                        />,
                                        <Divider/>,
                                        <TextField
                                            className={classes.cardContentBodyTextField}
                                            label={'Depth'}
                                            value={landPlane.depth}
                                            aria-readonly={'true'}
                                            variant={'standard'}
                                            InputProps={{readOnly: true, disableUnderline: true}}
                                        />
                                    ]).map((n, idx) => (<Grid key={idx} item>{n}</Grid>))}
                                </Grid>
                                <div className={classes.cardContentBodyRight}>
                                    <div className={classes.cardContentBodyRightWorldIconWrapper}>
                                        <IconButton>
                                            <WorldIcon fontSize={'large'}/>
                                        </IconButton>
                                    </div>
                                    {landPlaneAccExists
                                        ? (
                                            <Button
                                                variant={'contained'}
                                                color={'primary'}
                                                children={'refresh'}
                                                disabled={loading ||
                                                !validationResult.valid ||
                                                validationInProgress
                                                }
                                            />
                                        )
                                        : (
                                            <Tooltip
                                                placement={'top'}
                                                title={(() => {
                                                    switch (true) {
                                                        case !validationResult.valid:
                                                            return 'Plane identifier not valid'

                                                        case !solanaSelectedWallet:
                                                            return 'Wallet not connected'

                                                        case !keyPairForNewLand:
                                                            return 'Do not have private key for this land';

                                                        default:
                                                            return ''
                                                    }
                                                })()}
                                            >
                                                <span>
                                                    <Button
                                                        variant={'contained'}
                                                        color={'secondary'}
                                                        onClick={handleInitialise}
                                                        disabled={
                                                            loading || validationInProgress ||
                                                            !validationResult.valid ||
                                                            !solanaSelectedWallet ||
                                                            !keyPairForNewLand
                                                        }
                                                        children={'Initialise'}
                                                    />
                                                </span>
                                            </Tooltip>
                                        )}
                                </div>
                            </div>
                        </>
                    )
                }
            </CardContent>
        </Card>
    )
}