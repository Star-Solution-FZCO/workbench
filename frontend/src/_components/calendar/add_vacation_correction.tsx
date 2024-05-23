import IsoIcon from "@mui/icons-material/Iso";
import { LoadingButton } from "@mui/lab";
import { Box, Button, TextField, Typography } from "@mui/material";
import { Modal } from "_components";
import { scheduleApi } from "_redux";
import { FC, useState } from "react";
import { toast } from "react-toastify";
import { toastError } from "utils";

interface IAddVacationCorrectionProps {
    employee_id: number;
}

const AddVacationCorrection: FC<IAddVacationCorrectionProps> = ({
    employee_id: id,
}) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [days, setDays] = useState("");
    const [description, setDescription] = useState<string>("");

    const [createEmployeeVacationCorrection, mutationProps] =
        scheduleApi.useCreateEmployeeVacationCorrectionMutation();

    const save = () => {
        createEmployeeVacationCorrection({ id, days: +days, description })
            .unwrap()
            .then(() => {
                setDays("");
                setDescription("");
                setModalOpen(false);
                toast.success(
                    "Vacation correction has been successfully created",
                );
            })
            .catch((error) => {
                toastError(error);
            });
    };

    return (
        <>
            <Button
                variant="outlined"
                size="small"
                startIcon={<IsoIcon />}
                color="secondary"
                onClick={() => setModalOpen(true)}
            >
                Add vacation correction
            </Button>

            <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                <Box display="flex" flexDirection="column" gap={1}>
                    <Typography fontWeight={500}>
                        Add vacation correction
                    </Typography>

                    <TextField
                        placeholder="Enter the number of days (number may be negative)"
                        value={days}
                        type="number"
                        onChange={(e) => setDays(e.target.value)}
                    />

                    <Button
                        onClick={() => setDescription("From previous contract")}
                        variant="outlined"
                        size="small"
                    >
                        From previous contract
                    </Button>

                    <Button
                        onClick={() => setDescription("Compensation")}
                        variant="outlined"
                        size="small"
                    >
                        Compensation
                    </Button>

                    <TextField
                        placeholder="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    <Box display="flex" gap={1}>
                        <LoadingButton
                            variant="outlined"
                            size="small"
                            onClick={save}
                            loading={mutationProps.isLoading}
                            disabled={!days}
                        >
                            Save
                        </LoadingButton>
                        <Button
                            onClick={() => setModalOpen(false)}
                            color="error"
                            variant="outlined"
                            size="small"
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </>
    );
};

export default AddVacationCorrection;
