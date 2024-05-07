import CloseIcon from "@mui/icons-material/Close";
import GroupIcon from "@mui/icons-material/Group";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import {
    Box,
    Button,
    CircularProgress,
    IconButton,
    Modal,
    Tab,
    Typography,
} from "@mui/material";
import { policiesApi } from "_redux";
import { FC, useState } from "react";
import EmployeeList from "./employee_list";
import ExclusionList from "./exclusion_list";
import NestedModal from "./nested_modal";
import {
    ActionTypeT,
    NestedModalTypeT,
    SelectedEmployeeT,
    TabT,
    defaultModalStyles,
} from "./utils";

interface IRevisionEmployeeListProps {
    policy_id: number;
    revision_id: number;
    policy_name: string;
}

const RevisionEmployeeList: FC<IRevisionEmployeeListProps> = ({
    policy_id,
    revision_id,
    policy_name,
}) => {
    const [open, setOpen] = useState(false);
    const [nestedOpen, setNestedOpen] = useState(false);
    const [nestedModalType, setNestedModalType] =
        useState<NestedModalTypeT>(null);
    const [currentTab, setCurrentTab] = useState<TabT>("employees");
    const [selectedEmployee, setSelectedEmployee] =
        useState<SelectedEmployeeT>(null);
    const [actionType, setActionType] = useState<ActionTypeT>(null);

    const { data: revision } = policiesApi.useGetPolicyRevisionQuery({
        policy_id,
        revision_id,
    });

    const handleTabChange = (_: React.SyntheticEvent, value: TabT) => {
        setCurrentTab(value);
    };

    const closeNestedModal = () => {
        setNestedOpen(false);
        setNestedModalType(null);
        setActionType(null);
        setSelectedEmployee(null);
    };

    const approvedPercent = revision?.payload
        ? (revision?.payload.count_approved * 100) /
          (revision?.payload.count_approved +
              revision?.payload.count_unapproved)
        : 0;

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                variant="outlined"
                color="info"
                size="small"
                startIcon={<GroupIcon />}
            >
                People list
            </Button>

            <Modal open={open} onClose={() => setOpen(false)}>
                <Box
                    sx={{
                        ...defaultModalStyles,
                        width: "600px",
                        height: "80vh",
                    }}
                >
                    <NestedModal
                        open={nestedOpen}
                        onClose={closeNestedModal}
                        modalType={nestedModalType}
                        policy_id={policy_id}
                        actionType={actionType}
                        selectedEmployee={selectedEmployee}
                    />

                    <Box
                        display="flex"
                        flexDirection="column"
                        height="100%"
                        gap={1}
                    >
                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                        >
                            <Typography fontWeight={500} pl={2}>
                                Policy: {policy_name}
                            </Typography>

                            <Box display="flex" alignItems="center" gap={1}>
                                {revision?.payload && (
                                    <Typography fontSize={14}>
                                        Approved{" "}
                                        {revision?.payload.count_approved} out
                                        of{" "}
                                        {revision?.payload.count_approved +
                                            revision?.payload?.count_unapproved}
                                    </Typography>
                                )}

                                <Box
                                    position="relative"
                                    display="flex"
                                    alignItems="center"
                                >
                                    <CircularProgress
                                        value={100}
                                        color="secondary"
                                        variant="determinate"
                                        sx={{
                                            color: "#d6d6d6",
                                        }}
                                        thickness={4}
                                        size={24}
                                    />
                                    <CircularProgress
                                        value={approvedPercent}
                                        color="secondary"
                                        variant="determinate"
                                        sx={{
                                            position: "absolute",
                                            left: 0,
                                        }}
                                        thickness={4}
                                        size={24}
                                    />
                                </Box>

                                <Typography fontSize={14}>
                                    ({approvedPercent.toFixed(2)}
                                    %)
                                </Typography>

                                <IconButton onClick={() => setOpen(false)}>
                                    <CloseIcon />
                                </IconButton>
                            </Box>
                        </Box>

                        <TabContext value={currentTab}>
                            <Box
                                sx={{
                                    borderBottom: 1,
                                    borderColor: "divider",
                                }}
                            >
                                <TabList onChange={handleTabChange}>
                                    <Tab
                                        label="People list"
                                        value="employees"
                                    />
                                    <Tab
                                        label="Exclusions"
                                        value="exclusions"
                                    />
                                </TabList>
                            </Box>

                            <TabPanel
                                value="employees"
                                sx={{ p: 0, height: "100%" }}
                            >
                                <EmployeeList
                                    policy_id={policy_id}
                                    revision_id={revision_id}
                                    setActionType={setActionType}
                                    setSelectedEmployee={setSelectedEmployee}
                                    setNestedOpen={setNestedOpen}
                                    setNestedModalType={setNestedModalType}
                                />
                            </TabPanel>

                            <TabPanel
                                value="exclusions"
                                sx={{ p: 0, height: "100%" }}
                            >
                                <ExclusionList
                                    policy_id={policy_id}
                                    setActionType={setActionType}
                                    setSelectedEmployee={setSelectedEmployee}
                                    setNestedOpen={setNestedOpen}
                                    setNestedModalType={setNestedModalType}
                                />
                            </TabPanel>
                        </TabContext>
                    </Box>
                </Box>
            </Modal>
        </>
    );
};

export { RevisionEmployeeList };
