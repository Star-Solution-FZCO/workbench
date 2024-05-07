import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PreviewIcon from "@mui/icons-material/Preview";
import SaveIcon from "@mui/icons-material/Save";
import { LoadingButton, TabContext, TabList, TabPanel } from "@mui/lab";
import {
    Box,
    Button,
    IconButton,
    InputLabel,
    Tab,
    TextField,
    Typography,
} from "@mui/material";
import { ReduxSelect, RichTextEditor } from "_components";
import { helpCenterApi } from "_redux";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { NewServiceT, SelectOptionT, ServiceFieldT } from "types";
import { countElement, hasDuplicates, toastError } from "utils";
import {
    FormConstructor,
    JSONEditorWithPreview,
    UserFieldsHints,
} from "../components";
import { ImageUpload } from "../components/image";
import { PreviewService } from "./components";

const CreateService = () => {
    const navigate = useNavigate();

    const [currentTab, setCurrentTab] = useState<
        "user_fields" | "predefined_custom_fields"
    >("user_fields");

    const [preview, setPreview] = useState(false);
    const [portal, setPortal] = useState<SelectOptionT | null>(null);
    const [description, setDescription] = useState("");
    const [portalGroup, setPortalGroup] = useState<SelectOptionT | null>(null);
    const [iconURL, setIconURL] = useState<string | null>(null);
    const [userFields, setUserFields] = useState<ServiceFieldT[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [predefinedCustomFields, setPredefinedCustomFields] = useState<any[]>(
        [],
    );

    const [getPortal, { data: portalFromAPI }] =
        helpCenterApi.useLazyGetPortalQuery();
    const [
        getYoutrackProjectFields,
        { isLoading: fieldsLoading, isFetching: fieldsFetching },
    ] = helpCenterApi.useLazyGetYoutrackProjectFieldsQuery();

    const [createService, createServiceProps] =
        helpCenterApi.useCreateServiceMutation();
    const [createAttachment] =
        helpCenterApi.useCreateHelpCenterAttachmentMutation();

    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors },
    } = useForm<NewServiceT>();

    const handleChangeTab = (
        _: React.SyntheticEvent,
        tab: "user_fields" | "predefined_custom_fields",
    ) => {
        setCurrentTab(tab);
    };

    const handleImageUpload = (url: string | null) => {
        setIconURL(url);
        if (url) createAttachment({ url, type: "icon" });
    };

    const onSubmit: SubmitHandler<NewServiceT> = (data) => {
        if (!portalGroup || !iconURL) return;

        const userFieldsNames = userFields.map((o) => o.name);
        const userFieldsTypes = userFields.map((o) => o.type);

        if (
            hasDuplicates(userFieldsNames) ||
            userFieldsNames.includes("description")
        ) {
            toast.error(
                "User fields names must be unique and not contain the value 'description'",
            );
            return;
        }

        if (countElement(userFieldsTypes, "file") > 1) {
            toast.error(
                "Objects in User Fields with key 'type' and value 'file' must be no more than 1",
            );
            return;
        }

        if (
            userFieldsTypes.includes("file") &&
            userFields.find((o) => o.type === "file")?.name !== "attachments"
        ) {
            toast.error(
                "In User Fields there is an object with the key 'type' and the value 'file', but for this object the value of the key 'name' is not 'attachments'",
            );
            return;
        }

        if (
            userFields.some((field) =>
                field.options?.some((option) => option.length === 0),
            )
        ) {
            toast.error("In User Fields there should be no empty options");
            return;
        }

        const newService: NewServiceT = {
            ...data,
            description,
            portal_group_id: portalGroup.value as number,
            icon: iconURL,
            user_fields: userFields,
            predefined_custom_fields: predefinedCustomFields,
        };

        createService(newService)
            .unwrap()
            .then(() => {
                navigate("/help-center/admin/services");
                toast.success("Service was successfully updated");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    const handleFetchFields = () => {
        if (!portalFromAPI) return;

        getYoutrackProjectFields(portalFromAPI.payload.youtrack_project)
            .unwrap()
            .then((res) => {
                setPredefinedCustomFields(res.payload);
                toast.success("Youtrack project fields fetched successfully");
            })
            .catch((error) => {
                toastError(error);
            });
    };

    useEffect(() => {
        if (portal) {
            getPortal(Number(portal.value))
                .unwrap()
                .then((portalRes) => {
                    getYoutrackProjectFields(portalRes.payload.youtrack_project)
                        .unwrap()
                        .then((customFieldsRes) => {
                            setPredefinedCustomFields(customFieldsRes.payload);
                            toast.success(
                                "Youtrack project fields loaded successfully",
                            );
                        });
                });
        } else {
            setPredefinedCustomFields([]);
        }
    }, [getPortal, getYoutrackProjectFields, portal]);

    if (preview && portal)
        return (
            <PreviewService
                service={{
                    portalId: Number(portal.value),
                    portalName: portal.label,
                    serviceIcon: iconURL || "",
                    serviceName: getValues("name"),
                    serviceDescription: description,
                    userFields,
                }}
                onBack={() => setPreview(false)}
            />
        );

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <Box display="flex" alignItems="center" gap={1}>
                <IconButton
                    onClick={() => navigate("/help-center/admin/services")}
                >
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6">Create service</Typography>
            </Box>

            <Box display="flex" alignItems="flex-start" gap={1}>
                <form
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        width: "50%",
                    }}
                    onSubmit={handleSubmit(onSubmit)}
                >
                    <TextField
                        {...register("name", {
                            required: "Required field",
                        })}
                        label="Name"
                        error={!!errors.name}
                        helperText={errors.name?.message}
                    />

                    <TextField
                        {...register("short_description", {
                            required: "Required field",
                            maxLength: {
                                value: 200,
                                message: "Maximum length of 200 characters",
                            },
                        })}
                        label="Short description"
                        error={!!errors.short_description}
                        helperText={errors.short_description?.message}
                        multiline
                        rows={3}
                    />

                    <Box height="300px" mb={4}>
                        <InputLabel>Description</InputLabel>

                        <RichTextEditor
                            data={description}
                            onChange={(value) => setDescription(value)}
                        />
                    </Box>

                    <ReduxSelect
                        value={portal}
                        name="portal"
                        label="Portal"
                        optionsLoadFn={helpCenterApi.useListPortalSelectQuery}
                        onChange={(newValue) => {
                            if (!newValue) {
                                setPortalGroup(null);
                            }
                            setPortal(newValue);
                        }}
                        isClearable
                    />

                    {portal && (
                        <ReduxSelect
                            value={portalGroup}
                            name="portal_group"
                            label="Portal group"
                            optionsLoadFn={(search) =>
                                helpCenterApi.useListPortalGroupSelectQuery({
                                    portal_id: portal.value as number,
                                    search,
                                })
                            }
                            onChange={(newValue) => setPortalGroup(newValue)}
                            isClearable
                        />
                    )}

                    <ImageUpload
                        label="Icon"
                        url={iconURL || ""}
                        onUpload={handleImageUpload}
                    />

                    <TextField
                        {...register("tags")}
                        label="Tags (comma - separated)"
                        error={!!errors.tags}
                        helperText={errors.tags?.message}
                        multiline
                        rows={3}
                    />

                    <TabContext value={currentTab}>
                        <TabList onChange={handleChangeTab}>
                            <Tab label="User fields" value="user_fields"></Tab>
                            <Tab
                                label="Predefined custom fields"
                                value="predefined_custom_fields"
                            />
                        </TabList>

                        <TabPanel value="user_fields" sx={{ p: 0 }}>
                            <Box
                                display="flex"
                                flexDirection="column"
                                gap={1}
                                alignItems="flex-start"
                            >
                                <UserFieldsHints />

                                <Box width="100%">
                                    <JSONEditorWithPreview
                                        json={userFields}
                                        onChange={(value) =>
                                            setUserFields(value)
                                        }
                                    />
                                </Box>
                            </Box>
                        </TabPanel>
                        <TabPanel
                            value="predefined_custom_fields"
                            sx={{ p: 0 }}
                        >
                            <Box
                                display="flex"
                                flexDirection="column"
                                gap={1}
                                alignItems="flex-start"
                            >
                                <LoadingButton
                                    onClick={handleFetchFields}
                                    variant="outlined"
                                    size="small"
                                    loading={fieldsLoading || fieldsFetching}
                                    disabled={!portalFromAPI}
                                >
                                    Fetch fields
                                </LoadingButton>

                                <Box width="100%">
                                    <JSONEditorWithPreview
                                        json={predefinedCustomFields}
                                        onChange={(value) =>
                                            setPredefinedCustomFields(value)
                                        }
                                    />
                                </Box>
                            </Box>
                        </TabPanel>
                    </TabContext>

                    <Box
                        display="flex"
                        gap={1}
                        p={1}
                        mt={1}
                        bgcolor="#fff"
                        position="sticky"
                        bottom="0"
                        border="1px solid #ccc"
                        borderRadius={1}
                        zIndex="1000"
                    >
                        <LoadingButton
                            type="submit"
                            variant="outlined"
                            size="small"
                            startIcon={<SaveIcon />}
                            loading={createServiceProps.isLoading}
                            disabled={!portalGroup || !iconURL}
                        >
                            Save
                        </LoadingButton>

                        <Button
                            onClick={() => setPreview(true)}
                            startIcon={<PreviewIcon />}
                            variant="outlined"
                            size="small"
                            color="info"
                            disabled={!portal}
                        >
                            Preview
                        </Button>
                    </Box>
                </form>

                <FormConstructor
                    fields={userFields}
                    onChange={(fields) => setUserFields(fields)}
                />
            </Box>
        </Box>
    );
};

export default CreateService;
