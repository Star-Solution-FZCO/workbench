import KeyIcon from "@mui/icons-material/Key";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Box, Button, Tab, Typography } from "@mui/material";
import { Clipboard, Title } from "_components";
import { sharedApi, useAppSelector } from "_redux";
import { AUTH_MODE } from "config";
import { FC, useCallback, useState } from "react";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import { toastError } from "utils";
import APIToken from "./api_token";
import OTPPage from "./otp";
import PasswordPage from "./password";

const Settings: FC = () => {
    const { tab } = useParams();
    const navigate = useNavigate();

    const profile = useAppSelector(({ profile }) => profile.payload);

    const currentTab = tab || "api_token";

    const isLocalAuth = AUTH_MODE === "local";

    const [shownChangedTMKey, setShownChangedTMKey] = useState<string | null>(
        null,
    );

    const [setTMKey] = sharedApi.useSetTMKeyMutation();

    const handleTabChange = useCallback(
        (_: React.SyntheticEvent, newValue: string) =>
            navigate(`/settings/${newValue}`),
        [navigate],
    );

    const handleChangeTMKey = () => {
        const confirmed = confirm(
            "Are you sure you want to change the TM key?",
        );
        if (!confirmed) {
            return;
        }
        setTMKey(profile.id)
            .unwrap()
            .then((res) => {
                setShownChangedTMKey(res.payload.tm_key);
            })
            .catch((error) => {
                toastError(error);
            });
    };

    return (
        <>
            <Title title="Settings" />

            <TabContext value={currentTab}>
                <Box display="flex" alignItems="center">
                    <Box
                        flex={1}
                        sx={{ borderBottom: 1, borderColor: "divider", mt: 1 }}
                    >
                        <TabList onChange={handleTabChange}>
                            <Tab label="API Tokens" value="api_token" />
                            <Tab label="OTP" value="otp" />
                            <Tab label="TM Key" value="tm_key" />
                            {isLocalAuth && (
                                <Tab label="Password" value="password" />
                            )}
                        </TabList>
                    </Box>
                </Box>

                <TabPanel value="api_token" sx={{ px: 2 }}>
                    <APIToken />
                </TabPanel>
                <TabPanel value="otp" sx={{ px: 2 }}>
                    <OTPPage />
                </TabPanel>
                <TabPanel value="tm_key" sx={{ px: 2 }}>
                    {shownChangedTMKey && (
                        <Clipboard
                            open
                            value={shownChangedTMKey}
                            onClose={() => setShownChangedTMKey(null)}
                        />
                    )}

                    <Box display="flex" alignItems="center" gap={1}>
                        <Typography>Click to change TM Key</Typography>

                        <Button
                            onClick={handleChangeTMKey}
                            variant="outlined"
                            size="small"
                            startIcon={<KeyIcon />}
                        >
                            Change
                        </Button>
                    </Box>
                </TabPanel>
                {isLocalAuth && (
                    <TabPanel value="password" sx={{ px: 2 }}>
                        <PasswordPage />
                    </TabPanel>
                )}
            </TabContext>
        </>
    );
};

const SettingsRoutes = () => (
    <Routes>
        <Route path="/:tab" element={<Settings />} />
        <Route index element={<Settings />} />
    </Routes>
);

export default SettingsRoutes;
