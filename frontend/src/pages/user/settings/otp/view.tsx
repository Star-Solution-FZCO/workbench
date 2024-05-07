import { LoadingButton } from "@mui/lab";
import { Box, LinearProgress, Typography } from "@mui/material";
import { Modal } from "_components";
import { sharedApi } from "_redux";
import { OTPTokenView } from "pages/user/settings/otp/components";
import { useState } from "react";
import { toast } from "react-toastify";
import { OTPTokenT } from "types";
import { toastError } from "utils";
import { formatDateTimeHumanReadable } from "utils/convert";

const OTPView = () => {
    const [generatedToken, setGeneratedToken] = useState<OTPTokenT | null>(
        null,
    );

    const { data, isLoading } = sharedApi.useGetOTPStatusQuery();
    const [createOTP, createOTPProps] = sharedApi.useCreateOTPMutation();
    const [deleteOTP, deleteOTPProps] = sharedApi.useDeleteOTPMutation();

    const generateHandle = () => {
        createOTP()
            .unwrap()
            .then((response) => {
                setGeneratedToken(response.payload);
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const handleCloseModal = () => {
        setGeneratedToken(null);
    };

    const deleteHandle = () => {
        deleteOTP()
            .unwrap()
            .then(() => {
                toast.success("OTP token was removed successfully");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    if (isLoading) return <LinearProgress />;

    return (
        <Box display="flex" flexDirection="column" gap={1}>
            <Modal open={Boolean(generatedToken)} onClose={handleCloseModal}>
                {generatedToken && <OTPTokenView data={generatedToken} />}
            </Modal>
            <Box display="flex" alignItems="center" gap={1}>
                {data ? (
                    <>
                        <Typography>
                            Your OTP token was generated{" "}
                            {formatDateTimeHumanReadable(data.created)}
                        </Typography>
                        <LoadingButton
                            onClick={deleteHandle}
                            loading={deleteOTPProps.isLoading}
                            variant="outlined"
                            size="small"
                        >
                            Delete
                        </LoadingButton>
                    </>
                ) : (
                    <>
                        <Typography>You don't have OTP token yet.</Typography>
                        <LoadingButton
                            onClick={generateHandle}
                            loading={createOTPProps.isLoading}
                            variant="outlined"
                            size="small"
                        >
                            Generate
                        </LoadingButton>
                    </>
                )}
            </Box>
        </Box>
    );
};

export default OTPView;
