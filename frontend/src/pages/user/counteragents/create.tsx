import { Box, Typography } from "@mui/material";
import { employeesApi } from "_redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { toastError } from "utils";
import { CreateCounteragentForm } from "./components";
import { CounteragentFormData } from "./utils";

const CounteragentCreate = () => {
    const navigate = useNavigate();
    const [createCounteragent, { isLoading: loading }] =
        employeesApi.useCreateCounteragentMutation();

    const onSubmit = (formData: CounteragentFormData) => {
        createCounteragent(formData)
            .unwrap()
            .then(() => {
                navigate("/counteragents");
                toast.success("Counteragent successfully created");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    return (
        <Box width="500px" display="flex" flexDirection="column" gap={1}>
            <Typography fontWeight={500}>Add counteragent</Typography>

            <CreateCounteragentForm onSubmit={onSubmit} loading={loading} />
        </Box>
    );
};

export { CounteragentCreate };
