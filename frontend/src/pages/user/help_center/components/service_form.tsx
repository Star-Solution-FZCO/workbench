import { LoadingButton } from "@mui/lab";
import { Box, Button, InputLabel, TextField } from "@mui/material";
import MDEditor from "@uiw/react-md-editor";
import { helpCenterApi } from "_redux";
import { format } from "date-fns";
import { debounce, omit } from "lodash";
import React, { FC, useCallback, useState } from "react";
import {
    Controller,
    FormProvider,
    SubmitHandler,
    useForm,
} from "react-hook-form";
import { useNavigate } from "react-router-dom";
import rehypeSanitize from "rehype-sanitize";
import { ServiceT } from "types";
import { toastError } from "utils";
import { ArticleList } from "./article_list";
import { DynamicForm } from "./dynamic_form";

const paginationLimit = 3;

interface IServiceFormProps {
    service: ServiceT;
    disabled?: boolean;
}

const ServiceForm: FC<IServiceFormProps> = ({ service, disabled }) => {
    const navigate = useNavigate();

    const [articlesPage, setArticlesPage] = useState(1);
    const [query, setQuery] = useState("");

    const [createHelpCenterRequest, { isLoading: requestLoading }] =
        helpCenterApi.useCreateHelpCenterRequestMutation();
    const [
        uploadHelpCenterRequestAttachments,
        { isLoading: attachmentsUploading },
    ] = helpCenterApi.useUploadHelpCenterRequestAttachmentsMutation();

    const methods = useForm({
        defaultValues: {
            summary: "",
            description: "",
        },
    });

    const summary = methods.watch("summary");

    const {
        data: articles,
        isLoading: articlesLoading,
        isFetching: articlesFetching,
    } = helpCenterApi.useSearchArticlesQuery(
        {
            start: articlesPage,
            limit: paginationLimit,
            query,
            portal_id: service.group.portal.id,
        },
        { skip: query.length === 0 },
    );

    const search = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setQuery(value);
        methods.setValue("summary", value);
        if (articlesPage !== 1) setArticlesPage(1);
    };

    const handleChangeSummary = useCallback(debounce(search, 300), []);

    const onSubmit: SubmitHandler<any> = async (data) => {
        const customFormData = omit(data, [
            "summary",
            "description",
            "attachments",
        ]);

        for (const [key, value] of Object.entries(customFormData)) {
            if (value instanceof Date) {
                customFormData[key] = format(value, "dd/MM/yyyy");
            }
        }

        const newRequestData = {
            service_id: service.id,
            summary: data.summary,
            description: data.description,
            fields: customFormData,
        };

        try {
            const res = await createHelpCenterRequest(newRequestData).unwrap();
            const issueId = res.payload.idReadable;

            if (data.attachments) {
                const attachmentsFormData = new FormData();

                for (const file of data.attachments) {
                    attachmentsFormData.append("files", file);
                }

                await uploadHelpCenterRequestAttachments({
                    issueId,
                    body: attachmentsFormData,
                }).unwrap();
            }
            navigate(`/help-center/requests/${issueId}`);
        } catch (error) {
            toastError(error);
        }
    };

    return (
        <Box
            sx={{
                "& form": {
                    width: "600px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 1,
                },
            }}
        >
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                    <TextField
                        {...methods.register("summary", {
                            required: "Required field",
                        })}
                        label="Summary"
                        onChange={handleChangeSummary}
                        error={!!methods.formState.errors.summary}
                        helperText={methods.formState.errors.summary?.message}
                        required
                        fullWidth
                    />

                    {summary.length > 0 &&
                        articles &&
                        articles.payload.results.length > 0 && (
                            <ArticleList
                                articles={articles}
                                page={articlesPage}
                                onPageChange={(page) => setArticlesPage(page)}
                                limit={paginationLimit}
                                loading={articlesLoading || articlesFetching}
                            />
                        )}

                    <InputLabel>Description (optional)</InputLabel>
                    <Box data-color-mode="light" width="100%">
                        <Box className="wmde-markdown-var" />
                        <Controller
                            name="description"
                            control={methods.control}
                            render={({ field: { value, onChange } }) => (
                                <MDEditor
                                    value={value}
                                    // @ts-ignore
                                    onChange={onChange}
                                    previewOptions={{
                                        rehypePlugins: [[rehypeSanitize]],
                                    }}
                                />
                            )}
                        />
                    </Box>

                    <DynamicForm fields={service.user_fields} />

                    <Box display="flex" gap={1}>
                        <LoadingButton
                            type="submit"
                            variant="contained"
                            size="small"
                            loading={requestLoading || attachmentsUploading}
                            disabled={disabled}
                        >
                            Create
                        </LoadingButton>
                        <Button
                            onClick={() => navigate(-1)}
                            variant="outlined"
                            color="error"
                            size="small"
                            disabled={disabled}
                        >
                            Cancel
                        </Button>
                    </Box>
                </form>
            </FormProvider>
        </Box>
    );
};

export { ServiceForm };
