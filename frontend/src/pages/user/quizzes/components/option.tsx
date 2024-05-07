import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { LoadingButton } from "@mui/lab";
import {
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { policiesApi, setQuizStatus, useAppDispatch } from "_redux";
import { FC } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { QuestionOptionT } from "types";
import { toastError } from "utils";
import { AutoSave } from "./auto_save";

interface IOptionProps {
    option: QuestionOptionT;
}

const Option: FC<IOptionProps> = ({ option }) => {
    const dispatch = useAppDispatch();

    const methods = useForm({
        defaultValues: {
            content: option.content,
            correct: option.correct,
        },
    });

    const { control, register } = methods;

    const [updateOption] = policiesApi.useUpdateQuestionOptionMutation();
    const [deleteOption] = policiesApi.useDeleteQuestionOptionMutation();

    const onSave = (formData: { content: string; correct: boolean }) => {
        dispatch(setQuizStatus({ fetching: true }));
        updateOption({
            id: option.id,
            content: formData.content,
            correct: formData.correct,
        })
            .unwrap()
            .then(() => {
                dispatch(setQuizStatus({ success: true }));
            })
            .catch(() => {
                dispatch(setQuizStatus({ success: false }));
            })
            .finally(() => {
                dispatch(setQuizStatus({ fetching: false }));
            });
    };

    const handleClickDelete = () => {
        const confirmed = confirm(
            "Are you sure you want to delete the option?",
        );
        if (!confirmed) return;

        deleteOption(option.id)
            .unwrap()
            .then(() => {
                toast.success("Option was successfully deleted");
            })
            .catch((error) => toastError(error));
    };

    return (
        <FormProvider {...methods}>
            <Box
                display="flex"
                alignItems="center"
                gap={1}
                p={1}
                borderRadius={1}
                border="1px solid #ccc"
            >
                <Controller
                    control={control}
                    name="correct"
                    render={({ field: { onChange, value } }) => (
                        <FormControlLabel
                            label="Correct"
                            control={
                                <Checkbox
                                    checked={value}
                                    onChange={(_, checked) => onChange(checked)}
                                />
                            }
                        />
                    )}
                />

                <TextField {...register("content")} size="small" fullWidth />

                <AutoSave onSave={onSave} callbackDeps={[option]} />

                <Tooltip title="Delete" placement="top">
                    <Button
                        onClick={handleClickDelete}
                        sx={{
                            width: "40px",
                            height: "40px",
                            minWidth: 0,
                            p: 0,
                        }}
                        variant="outlined"
                        color="error"
                    >
                        <DeleteIcon />
                    </Button>
                </Tooltip>
            </Box>
        </FormProvider>
    );
};

interface IOptionListProps {
    options: QuestionOptionT[];
}

const OptionList: FC<IOptionListProps> = ({ options }) => {
    const { question_id } = useParams();

    const [addOption, { isLoading }] =
        policiesApi.useCreateQuestionOptionMutation();

    const handleClickAddOption = () => {
        addOption({
            question_id: Number(question_id),
            order: options.length + 1,
        });
    };

    return (
        <Box height="50%" display="flex" flexDirection="column" gap={1}>
            <Box borderBottom="1px solid #ccc">
                <Typography fontWeight={700} fontSize={20}>
                    Options
                </Typography>
            </Box>

            {options.length === 0 ? (
                <Typography fontWeight={500}>No options</Typography>
            ) : (
                <Box
                    display="flex"
                    flexDirection="column"
                    gap={1}
                    overflow="auto"
                    flex={1}
                >
                    {options.map((option) => (
                        <Option key={option.id} option={option} />
                    ))}
                </Box>
            )}

            <LoadingButton
                onClick={handleClickAddOption}
                variant="outlined"
                startIcon={<AddIcon />}
                loading={isLoading}
            >
                Add option
            </LoadingButton>
        </Box>
    );
};

export { Option, OptionList };
