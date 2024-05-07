import CloseIcon from "@mui/icons-material/Close";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormLabel,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from "@mui/material";
import { Modal } from "_components";
import { employeesApi } from "_redux";
import { FC, useState } from "react";
import { toastError } from "utils";
import { NotificationType } from "./utils";

interface ICreateCredentialsDialogProps {
    id: number;
    open: boolean;
    onClose: () => void;
    onCreated: (rid: string) => void;
}

const CreateCredentialsDialog: FC<ICreateCredentialsDialogProps> = ({
    id,
    open,
    onClose,
    onCreated,
}) => {
    const [notifications, setNotifications] = useState<
        Array<{ type: NotificationType; value: string }>
    >([
        {
            type: NotificationType.email,
            value: "",
        },
    ]);
    const [bundle, setBundle] = useState({
        openvpn: false,
        ssh: false,
        certificate: false,
        pvpn: false,
    });
    const [ca, setCa] = useState<number>(0);
    const [personConfirmed, setPersonConfirmed] = useState(false);

    const [createCredentials, { isLoading }] =
        employeesApi.useCreateCounteragentCredentialsMutation();

    const handleChangeNotifications = (
        index: number,
        key: string,
        value: string | number,
    ) => {
        const newNotifications = [...notifications];
        newNotifications[index] = {
            ...newNotifications[index],
            [key]: value,
        };
        setNotifications(newNotifications);
    };

    const handleChangeBundle = (key: string, checked: boolean) => {
        if (key === "openvpn" && checked) {
            setBundle({
                ...bundle,
                certificate: true,
                [key]: checked,
            });
        } else {
            setBundle({
                ...bundle,
                [key]: checked,
            });
        }
    };

    const resetState = () => {
        setNotifications([
            {
                type: NotificationType.email,
                value: "",
            },
        ]);
        setBundle({
            openvpn: false,
            ssh: false,
            certificate: false,
            pvpn: false,
        });
        setCa(0);
        setPersonConfirmed(false);
    };

    const handleClickCreate = () => {
        createCredentials({
            id,
            notifications,
            bundle,
            ca,
        })
            .unwrap()
            .then((res) => {
                onClose();
                resetState();
                onCreated(res.payload.rid);
            })
            .catch((error) => {
                toastError(error);
            });
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box display="flex" flexDirection="column" gap={1}>
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Typography fontWeight={500}>Add credentials</Typography>

                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <FormGroup>
                    <FormLabel sx={{ mb: 1 }}>Notifications</FormLabel>

                    <Box display="flex" flexDirection="column" gap={1}>
                        {notifications.map((notification, index) => (
                            <Box key={index} display="flex" gap={1}>
                                <FormControl sx={{ width: "180px" }}>
                                    <InputLabel id="notification-select">
                                        Type
                                    </InputLabel>
                                    <Select
                                        id="notification-select"
                                        labelId="notification-select"
                                        label="Type"
                                        value={notification.type}
                                        onChange={(e) =>
                                            handleChangeNotifications(
                                                index,
                                                "type",
                                                Number(e.target.value),
                                            )
                                        }
                                        size="small"
                                    >
                                        <MenuItem value="1">Email</MenuItem>
                                        <MenuItem value="2">SMS</MenuItem>
                                        <MenuItem value="3">Telegram</MenuItem>
                                        <MenuItem value="4">Pararam</MenuItem>
                                    </Select>
                                </FormControl>

                                <TextField
                                    value={notification.value}
                                    onChange={(e) =>
                                        handleChangeNotifications(
                                            index,
                                            "value",
                                            e.target.value,
                                        )
                                    }
                                    size="small"
                                    fullWidth
                                />

                                <Button
                                    onClick={() =>
                                        setNotifications(
                                            notifications.filter(
                                                (_, i) => i !== index,
                                            ),
                                        )
                                    }
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                >
                                    <CloseIcon />
                                </Button>
                            </Box>
                        ))}
                        <Box>
                            <Button
                                onClick={() =>
                                    setNotifications([
                                        ...notifications,
                                        {
                                            type: NotificationType.email,
                                            value: "",
                                        },
                                    ])
                                }
                                variant="outlined"
                                size="small"
                            >
                                Add notification
                            </Button>
                        </Box>
                    </Box>

                    <FormLabel sx={{ mt: 1 }}>Credentials</FormLabel>

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={bundle.openvpn}
                                onChange={(e) =>
                                    handleChangeBundle(
                                        "openvpn",
                                        e.target.checked,
                                    )
                                }
                            />
                        }
                        label="OpenVPN"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={bundle.ssh}
                                onChange={(e) =>
                                    handleChangeBundle("ssh", e.target.checked)
                                }
                            />
                        }
                        label="SSH"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={bundle.certificate}
                                onChange={(e) =>
                                    handleChangeBundle(
                                        "certificate",
                                        e.target.checked,
                                    )
                                }
                            />
                        }
                        label="Certificate"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={bundle.pvpn}
                                onChange={(e) =>
                                    handleChangeBundle("pvpn", e.target.checked)
                                }
                            />
                        }
                        label="PVPN"
                    />

                    <FormControl sx={{ mt: 1 }}>
                        <InputLabel id="ca-select" size="small">
                            Certification authority
                        </InputLabel>
                        <Select
                            id="ca-select"
                            labelId="ca-select"
                            label="Certification authority"
                            value={ca}
                            onChange={(e) => setCa(Number(e.target.value))}
                            size="small"
                        >
                            <MenuItem value="0">CA</MenuItem>
                        </Select>
                    </FormControl>
                </FormGroup>

                <Typography fontSize={14}>
                    Warning: When generating a new certificate, OpenVPN will be
                    out of date
                </Typography>

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={personConfirmed}
                            onChange={(e) =>
                                setPersonConfirmed(e.target.checked)
                            }
                        />
                    }
                    label="I made sure he was the right person"
                />

                <LoadingButton
                    onClick={handleClickCreate}
                    variant="outlined"
                    size="small"
                    loading={isLoading}
                    disabled={
                        Object.values(bundle).every(
                            (value) => value === false,
                        ) ||
                        notifications.length === 0 ||
                        notifications.some(
                            (notification) => notification.value === "",
                        ) ||
                        !personConfirmed
                    }
                >
                    Create
                </LoadingButton>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    size="small"
                    color="error"
                    disabled={isLoading}
                >
                    Cancel
                </Button>
            </Box>
        </Modal>
    );
};

export { CreateCredentialsDialog };
