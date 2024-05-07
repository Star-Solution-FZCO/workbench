import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import { Box, CircularProgress, TextField } from "@mui/material";
import { FC, useRef } from "react";

interface ISearchFieldProps {
    className?: string;
    placeholder?: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onClear?: () => void;
    loading?: boolean;
    clearable?: boolean;
    size?: "small" | "medium";
}
const SearchField: FC<ISearchFieldProps> = ({
    placeholder = "Type to start search",
    className,
    onChange,
    onClear,
    loading,
    clearable,
    size = "small",
}) => {
    const textfieldRef = useRef<HTMLInputElement>(null);

    const clear = () => {
        if (textfieldRef.current) {
            textfieldRef.current.value = "";
        }

        onClear && onClear();
    };

    return (
        <TextField
            className={className}
            inputRef={textfieldRef}
            placeholder={placeholder}
            onChange={onChange}
            InputProps={{
                startAdornment: <SearchIcon sx={{ color: "#757575" }} />,
                endAdornment: (
                    <Box display="flex" gap={1}>
                        {loading && (
                            <CircularProgress size={20} color="inherit" />
                        )}

                        {clearable &&
                            textfieldRef.current &&
                            textfieldRef.current.value.length > 0 && (
                                <ClearIcon
                                    onClick={clear}
                                    sx={{ color: "#757575", cursor: "pointer" }}
                                />
                            )}
                    </Box>
                ),
            }}
            size={size}
            fullWidth
        />
    );
};

export { SearchField };
