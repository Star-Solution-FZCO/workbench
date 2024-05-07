import SchoolIcon from "@mui/icons-material/School";
import { Button, Tooltip } from "@mui/material";
import { useTour } from "@reactour/tour";

const TrainingButton = () => {
    const { isOpen, setIsOpen } = useTour();

    return (
        <Tooltip title="Complete training" placement="top">
            <Button
                onClick={() => {
                    if (!isOpen) {
                        setIsOpen(true);
                    }
                }}
                variant="outlined"
                size="small"
                color="info"
            >
                <SchoolIcon />
            </Button>
        </Tooltip>
    );
};

export { TrainingButton };
