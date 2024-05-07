import CasinoIcon from "@mui/icons-material/Casino";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    IconButton,
    LinearProgress,
    Slider,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import stringEntropy from "fast-password-entropy";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

const YOUTRACK_PASSWORD_MIN_ENTROPY = 36;

const entropyMap = {
    very_weak: 20,
    weak: 36,
    medium: 60,
    strong: 120,
};

const PasswordGenerator = () => {
    const [password, setPassword] = useState("");
    const length = useRef(12);
    const [settings, setSettings] = useState({
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
        excludeSimilar: false,
    });
    const [entropy, setEntropy] = useState(0);

    const generatePassword = useCallback(() => {
        const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
        const numberChars = "0123456789";
        const symbolChars = ".{}[]()<>!@#$%^&*-_+=|";

        let password = "";

        const charsToUse = [
            ...(settings.uppercase ? uppercaseChars : ""),
            ...(settings.lowercase ? lowercaseChars : ""),
            ...(settings.numbers ? numberChars : ""),
            ...(settings.symbols ? symbolChars : ""),
        ].filter(
            (char) =>
                !(settings.excludeSimilar && /[0ODQ1ILJ8B5S2Z]/.test(char)),
        );

        for (let i = 0; i < length.current; i++) {
            const randomIndex = Math.floor(Math.random() * charsToUse.length);
            password += charsToUse[randomIndex];
        }

        return password;
    }, [settings]);

    const handleGenerate = useCallback(() => {
        const newPassword = generatePassword();
        const entropy = stringEntropy(newPassword);
        setPassword(newPassword);
        setEntropy(entropy);
    }, [generatePassword]);

    const handleChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Array.from(e.target.value)
            .filter((char) => char.charCodeAt(0) <= 127)
            .join("")
            .trim();
        setPassword(value);
        length.current = value.length;
        setEntropy(stringEntropy(value));
    };

    const handleChangeLength = (value: number) => {
        length.current = value;
        handleGenerate();
    };

    const handleChangeSettings = (key: string, checked: boolean) => {
        const trueCount = Object.values(settings).filter(
            (value) => value,
        ).length;

        setSettings((prev) => ({
            ...prev,
            [key]: trueCount > 1 ? checked : true,
        }));

        handleGenerate();
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(password);
        toast.success("Password is copied to the clipboard", {
            position: "top-center",
        });
    };

    useEffect(() => {
        handleGenerate();
    }, [handleGenerate]);

    return (
        <Box display="flex" justifyContent="center">
            <Box
                width="600px"
                mt="100px"
                display="flex"
                flexDirection="column"
                gap={1}
            >
                <Typography fontSize={20} fontWeight={500} textAlign="center">
                    Password Generator
                </Typography>

                <TextField
                    value={password}
                    onChange={handleChangePassword}
                    inputProps={{ min: 0, max: 50 }}
                    InputProps={{
                        endAdornment: (
                            <Box display="flex" alignItems="center" gap={1}>
                                <Tooltip title="Copy" placement="top">
                                    <IconButton
                                        onClick={handleCopy}
                                        color="info"
                                    >
                                        <ContentCopyIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Generate" placement="top">
                                    <IconButton
                                        onClick={handleGenerate}
                                        color="secondary"
                                    >
                                        <CasinoIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        ),
                    }}
                />

                <Box display="flex" alignItems="center" gap={1}>
                    <LinearProgress
                        sx={{ flex: 1, height: 12, borderRadius: 6 }}
                        value={
                            entropy >= entropyMap.strong
                                ? 100
                                : entropy >= entropyMap.medium
                                  ? 75
                                  : entropy >= entropyMap.weak
                                    ? 50
                                    : entropy >= entropyMap.very_weak
                                      ? 25
                                      : 0
                        }
                        variant="determinate"
                        color={
                            entropy >= entropyMap.strong
                                ? "primary"
                                : entropy >= entropyMap.medium
                                  ? "success"
                                  : entropy >= entropyMap.weak
                                    ? "warning"
                                    : "error"
                        }
                    />

                    <Typography fontWeight={500}>{entropy} bit</Typography>
                </Box>

                {entropy >= YOUTRACK_PASSWORD_MIN_ENTROPY && (
                    <Typography
                        sx={{ textDecoration: "underline" }}
                        fontWeight={500}
                        fontSize={18}
                        textAlign="center"
                    >
                        Password is good for YouTrack
                    </Typography>
                )}

                <Typography fontSize={18} fontWeight={500} textAlign="center">
                    Customize password
                </Typography>

                <Box
                    display="flex"
                    alignItems="flex-start"
                    gap={2}
                    border="1px solid #ccc"
                    borderRadius={1}
                    p={2}
                >
                    <Box display="flex" alignItems="center" gap={2} flex={1}>
                        <TextField
                            label="Length"
                            value={length.current}
                            onChange={(e) =>
                                handleChangeLength(Number(e.target.value))
                            }
                            type="number"
                        />

                        <Slider
                            sx={{ height: 10 }}
                            value={length.current}
                            onChange={(_, value) =>
                                handleChangeLength(value as number)
                            }
                            step={1}
                            min={1}
                            max={50}
                            color="error"
                        />
                    </Box>

                    <Box display="flex" flexDirection="column">
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={settings.uppercase}
                                    onChange={(e) =>
                                        handleChangeSettings(
                                            "uppercase",
                                            e.target.checked,
                                        )
                                    }
                                />
                            }
                            label="Uppercase (ABC...)"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={settings.lowercase}
                                    onChange={(e) =>
                                        handleChangeSettings(
                                            "lowercase",
                                            e.target.checked,
                                        )
                                    }
                                />
                            }
                            label="Lowercase (abc...)"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={settings.numbers}
                                    onChange={(e) =>
                                        handleChangeSettings(
                                            "numbers",
                                            e.target.checked,
                                        )
                                    }
                                />
                            }
                            label="Numbers (123...)"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={settings.symbols}
                                    onChange={(e) =>
                                        handleChangeSettings(
                                            "symbols",
                                            e.target.checked,
                                        )
                                    }
                                />
                            }
                            label="Symbols (!@#...)"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={settings.excludeSimilar}
                                    onChange={(e) =>
                                        handleChangeSettings(
                                            "excludeSimilar",
                                            e.target.checked,
                                        )
                                    }
                                />
                            }
                            label="No similar characters (0ODQ1ILJ8B5S2Z)"
                        />
                    </Box>
                </Box>

                <Button onClick={handleCopy} variant="contained" color="error">
                    Copy Password
                </Button>
            </Box>
        </Box>
    );
};

export default PasswordGenerator;
