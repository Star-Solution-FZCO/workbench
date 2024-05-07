import CloseIcon from "@mui/icons-material/Close";
import {
    Box,
    Button,
    Checkbox,
    Divider,
    FormControlLabel,
    IconButton,
    Modal,
    Pagination,
    SxProps,
    Typography,
} from "@mui/material";
import { sharedApi } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ParsedHTMLContent } from "./parsed_html_content";
import { ListStateT, initialListState } from "./views";

const styles: SxProps = {
    width: "800px",
    maxHeight: "80vh",
    background: "#fff",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    borderRadius: 2,
    display: "flex",
    flexDirection: "column",
    gap: 1,
    p: 2,
};

const listParams: ListStateT = {
    ...initialListState,
    filter: {
        read: "read:null",
        show_on_main_page: "show_on_main_page:true",
        type: "type___icontains:new-release",
    },
    limit: 10,
};

const doesNotShowNewReleaseDialogAgain = localStorage.getItem(
    "doesNotShowNewReleaseDialogAgain",
);

const NewReleaseDialog = () => {
    const navigate = useNavigate();

    const [open, setOpen] = useState(false);
    const [index, setIndex] = useState(0);
    const [doesNotShowThisAgain, setDoesNotShowThisAgain] = useState(
        !!doesNotShowNewReleaseDialogAgain,
    );

    const { data: notifications } = sharedApi.useListEmployeeNotificationQuery(
        makeListParams(listParams, []),
    );

    const [markNotificationsAsRead] =
        sharedApi.useMarkNotificationsAsReadMutation();

    const handleCloseModal = () => {
        setOpen(false);
        notifications &&
            markNotificationsAsRead(
                notifications.payload.items.map((n) => n.id),
            );
    };

    const handleClickViewAll = () => {
        handleCloseModal();
        navigate("/changelog");
    };

    const handleChangeDoesNotShowThisAgain = (
        _: React.ChangeEvent<HTMLInputElement>,
        checked: boolean,
    ) => {
        setDoesNotShowThisAgain(checked);
        if (checked) {
            localStorage.setItem("doesNotShowNewReleaseDialogAgain", "true");
        } else {
            localStorage.removeItem("doesNotShowNewReleaseDialogAgain");
        }
    };

    useEffect(() => {
        if (doesNotShowNewReleaseDialogAgain) return;
        if (notifications && notifications.payload.items.length > 0) {
            setOpen(true);
        }
    }, [notifications]);

    return (
        <Modal open={open} onClose={handleCloseModal}>
            <Box sx={styles}>
                <Box display="flex" alignItems="center">
                    <Typography flex={1} variant="h6">
                        {notifications?.payload?.items[index]?.subject}
                    </Typography>

                    <IconButton onClick={handleCloseModal}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Divider flexItem />

                <Box overflow="auto">
                    <ParsedHTMLContent
                        text={
                            notifications?.payload?.items[index]?.content || ""
                        }
                    />
                </Box>

                <Divider flexItem />

                {notifications && notifications.payload.items.length > 1 && (
                    <Pagination
                        count={notifications?.payload?.items?.length}
                        page={index + 1}
                        onChange={(_, page) => setIndex(page - 1)}
                    />
                )}

                <Button
                    onClick={handleClickViewAll}
                    variant="outlined"
                    color="info"
                >
                    View all changelog
                </Button>

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={doesNotShowThisAgain}
                            onChange={handleChangeDoesNotShowThisAgain}
                            color="info"
                        />
                    }
                    label="Don't show this again"
                />
            </Box>
        </Modal>
    );
};

export { NewReleaseDialog };
