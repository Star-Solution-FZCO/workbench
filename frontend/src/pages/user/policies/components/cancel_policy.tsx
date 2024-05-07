import CancelIcon from "@mui/icons-material/Cancel";
import { LoadingButton } from "@mui/lab";
import { Box, Button, Typography } from "@mui/material";
import { Modal } from "_components";
import { policiesApi } from "_redux";
import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { toastError } from "utils";

interface ICancelPolicyProps {
    policy_id: number;
    disabled?: boolean;
}

const CancelPolicy: FC<ICancelPolicyProps> = ({ policy_id, disabled }) => {
    const navigate = useNavigate();

    const [open, setOpen] = useState(false);

    const [cancelPolicy, cancelPolicyProps] =
        policiesApi.useCancelPolicyMutation();

    const cancel = () => {
        cancelPolicy(policy_id)
            .unwrap()
            .then(() => {
                setOpen(false);
                navigate(-1);
                toast.success("Policy canceled");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                startIcon={<CancelIcon />}
                variant="outlined"
                color="error"
                size="small"
                disabled={disabled}
            >
                Cancel
            </Button>
            <Modal open={open} onClose={() => setOpen(false)}>
                <Box
                    display="flex"
                    alignItems="center"
                    flexDirection="column"
                    gap={1}
                >
                    <Typography fontWeight={500}>
                        Are you sure you want to cancel the policy?
                    </Typography>

                    <Box display="flex" gap={1}>
                        <LoadingButton
                            onClick={cancel}
                            variant="outlined"
                            loading={cancelPolicyProps.isLoading}
                        >
                            Submit cancelation
                        </LoadingButton>
                        <Button
                            onClick={() => setOpen(false)}
                            variant="outlined"
                            color="error"
                        >
                            Close
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </>
    );
};

export { CancelPolicy };
