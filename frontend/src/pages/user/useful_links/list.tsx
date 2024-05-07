import AddIcon from "@mui/icons-material/Add";
import { Box, Button, LinearProgress, Pagination } from "@mui/material";
import { ListStateT, Modal, SearchField, initialListState } from "_components";
import { catalogsApi, useAppSelector } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { debounce } from "lodash";
import React, { useCallback, useState } from "react";
import { UsefulLinkT } from "types";
import { calculatePageCount } from "utils";
import {
    CreateUsefulLinkForm,
    DeleteUsefulLinkForm,
    EditUsefulLinkForm,
    UsefulList as UsefulListComponent,
} from "./components";

type DialogTypeT = "edit" | "delete" | "add" | null;

const UsefulLinkList = () => {
    const isAdmin = useAppSelector((state) => state.profile.payload.admin);
    const [listState, setListState] = useState<ListStateT>(initialListState);
    const [page, setPage] = useState(1);
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [dialogType, setDialogType] = useState<DialogTypeT>(null);
    const [selectedRow, setSelectedRow] = useState<UsefulLinkT | null>(null);

    const { data, isLoading } = catalogsApi.useListUsefulLinkQuery(
        makeListParams(listState, [
            "name___icontains",
            "link___icontains",
            "description___icontains",
        ]),
    );

    const handleListStateChange = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (name: keyof ListStateT) => (value: any) =>
            setListState({
                ...listState,
                [name]: value,
            }),
        [listState],
    );

    const search = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleListStateChange("search")(event.target.value);
    };

    const handleChangeSearch = useCallback(debounce(search, 300), []);

    const handleChangePagination = (
        _: React.ChangeEvent<unknown>,
        page: number,
    ) => {
        setPage(page);
        handleListStateChange("offset")(listState.limit * (page - 1));
    };

    const openModal = (dialogType: DialogTypeT, row: UsefulLinkT | null) => {
        setSelectedRow(row);
        setDialogType(dialogType);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setDialogType(null);
        setSelectedRow(null);
    };

    const count = calculatePageCount(listState.limit, data?.payload?.count);

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <Modal open={modalOpen} onClose={handleCloseModal}>
                {dialogType === "edit" && selectedRow && (
                    <EditUsefulLinkForm
                        data={selectedRow}
                        onClose={handleCloseModal}
                    />
                )}
                {dialogType === "add" && (
                    <CreateUsefulLinkForm onClose={handleCloseModal} />
                )}
                {dialogType === "delete" && selectedRow && (
                    <DeleteUsefulLinkForm
                        data={selectedRow}
                        onClose={handleCloseModal}
                    />
                )}
            </Modal>

            <Box flex={3} display="flex" flexDirection="column" gap={1}>
                <Box display={"flex"} gap={1}>
                    <Box flex={1}>
                        <SearchField onChange={handleChangeSearch} />
                    </Box>

                    {isAdmin && (
                        <Button
                            sx={{ height: "40px" }}
                            onClick={() => {
                                openModal("add", null);
                            }}
                            startIcon={<AddIcon />}
                            variant="outlined"
                            color="secondary"
                        >
                            Add link
                        </Button>
                    )}
                </Box>

                {isLoading ? (
                    <LinearProgress />
                ) : (
                    <UsefulListComponent
                        data={data}
                        onEdit={(data) => {
                            openModal("edit", data);
                        }}
                        onDelete={(data) => {
                            openModal("delete", data);
                        }}
                        withControls
                    />
                )}
            </Box>

            {count > 1 && (
                <Pagination
                    page={page}
                    count={count}
                    onChange={handleChangePagination}
                />
            )}
        </Box>
    );
};

export default UsefulLinkList;
