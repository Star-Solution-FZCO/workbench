import { Box, Button, Modal as MuiModal, Typography } from "@mui/material";
import { CREDENTIALS_SERVICE_URL } from "config";
import { FC, useState } from "react";
import { toast } from "react-toastify";
import {
    CreateCredentialsDialog,
    CredendentailsList,
    UploadCredentialsDialog,
} from "./_credentials";

interface IRidDialogProps {
    rid: string;
    onClose: () => void;
}

const copyText = async (text: string, toastText: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(toastText);
};

const RidDialog: FC<IRidDialogProps> = ({ rid, onClose }) => {
    const [copied, setCopied] = useState(false);

    const handleClickCopyCode = async () => {
        await copyText(rid, "Code copied to clipboard");
    };

    const handleClickCopyText = async () => {
        const text =
            "Go to " +
            CREDENTIALS_SERVICE_URL +
            " and enter the code\n`" +
            rid +
            "`\nin the Request ID field";
        await copyText(text, "Text copied to clipboard");
        setCopied(true);
    };

    return (
        <MuiModal
            open
            onClose={(_, reason) => {
                if (reason === "backdropClick" || reason === "escapeKeyDown") {
                    return;
                }
                onClose();
            }}
        >
            <Box
                sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    backgroundColor: "#fff",
                    borderRadius: 1,
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                }}
            >
                <Typography fontWeight={500} align="center">
                    Copy this text and send it to the recipient
                </Typography>
                <Box textAlign="center">
                    <Typography>
                        Go to{" "}
                        <a
                            href={CREDENTIALS_SERVICE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {CREDENTIALS_SERVICE_URL}
                        </a>{" "}
                        and enter the code
                    </Typography>

                    <Typography fontWeight={500}>{rid}</Typography>
                    <Typography>in the Request ID field</Typography>
                </Box>

                <Button
                    onClick={handleClickCopyText}
                    variant="outlined"
                    size="small"
                >
                    Copy text
                </Button>
                <Button
                    onClick={handleClickCopyCode}
                    variant="outlined"
                    size="small"
                    color="secondary"
                >
                    Copy code
                </Button>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    size="small"
                    color="error"
                    disabled={!copied}
                >
                    Close
                </Button>
            </Box>
        </MuiModal>
    );
};

interface ICounteragentCredentialsProps {
    id: number;
}

const CounteragentCredentials: FC<ICounteragentCredentialsProps> = ({ id }) => {
    const [createCredsDialogOpen, setCreateCredsDialogOpen] = useState(false);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [rid, setRid] = useState<string | null>(null);

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <CreateCredentialsDialog
                id={id}
                open={createCredsDialogOpen}
                onClose={() => setCreateCredsDialogOpen(false)}
                onCreated={setRid}
            />

            <UploadCredentialsDialog
                id={id}
                open={uploadDialogOpen}
                onClose={() => setUploadDialogOpen(false)}
            />

            {rid && <RidDialog rid={rid} onClose={() => setRid(null)} />}

            <Box display="flex" gap={1}>
                <Button
                    onClick={() => setCreateCredsDialogOpen(true)}
                    variant="outlined"
                    size="small"
                >
                    Add credentials
                </Button>
                <Button
                    onClick={() => setUploadDialogOpen(true)}
                    variant="outlined"
                    size="small"
                >
                    Upload credentials
                </Button>
            </Box>

            <Box flex={1}>
                <CredendentailsList id={id} />
            </Box>
        </Box>
    );
};

export { CounteragentCredentials };
