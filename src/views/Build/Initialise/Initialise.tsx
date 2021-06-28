import React, {useState} from "react";
import {Grid, IconButton, makeStyles,} from "@material-ui/core";
import {LandPlaneCard} from "./LandPlaneCard";
import {
    AddCircle as AddIcon,
    RemoveCircle as RemoveIcon
} from '@material-ui/icons'
import {Keypair, PublicKey} from "@solana/web3.js";

const useStyles = makeStyles((theme) => ({
    root: {}
}))

export default function Initialise() {
    const classes = useStyles();
    const [landPlaneAccPublicKeys, setLandPlaneAccPublicKeys] = useState<(PublicKey | undefined)[]>([
        new PublicKey('9w8Dp3CT1cESaRyzib67MPdm3LrGmDa26deaoBVKkte3'),
        Keypair.generate().publicKey
    ]);

    return (
        <div className={classes.root}>
            <Grid container spacing={1}>
                {landPlaneAccPublicKeys.map((lp, idx) => (
                    <Grid item key={idx}>
                        <LandPlaneCard
                            landPlaneAccPublicKey={lp}
                            controls={[
                                idx ? (
                                        <IconButton
                                            size={'small'}
                                            onClick={() => setLandPlaneAccPublicKeys(landPlaneAccPublicKeys.filter((lpe, lpeIdx) => (lpeIdx !== idx)))}
                                        >
                                            <RemoveIcon/>
                                        </IconButton>
                                    )
                                    : null,
                                <IconButton
                                    size={'small'}
                                    onClick={() => {
                                        const updatedLandPlaneAccPublicKeys: (PublicKey | undefined)[] = [];
                                        landPlaneAccPublicKeys.forEach((lpe, lpeIdx) => {
                                            updatedLandPlaneAccPublicKeys.push(lpe);
                                            if (lpeIdx === idx) {
                                                updatedLandPlaneAccPublicKeys.push(undefined);
                                            }
                                        })
                                        setLandPlaneAccPublicKeys(updatedLandPlaneAccPublicKeys);
                                    }}
                                >
                                    <AddIcon/>
                                </IconButton>,
                            ]}
                        />
                    </Grid>
                ))}
            </Grid>
        </div>
    )
}