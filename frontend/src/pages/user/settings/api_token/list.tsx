import AddIcon from "@mui/icons-material/Add";
import {
    Box,
    Button,
    LinearProgress,
    Pagination,
    Typography,
} from "@mui/material";
import { ListStateT, Modal, SearchField, initialListState } from "_components";
import { catalogsApi } from "_redux";
import { makeListParams } from "_redux/utils/helpers";
import { debounce } from "lodash";
import React, { useCallback, useState } from "react";
import { APITokenT } from "types";
import { calculatePageCount } from "utils";
import {
    APITokenList as APITokenListComponent,
    CreateAPITokenForm,
    RevokeAPITokenForm,
} from "./components";

type DialogTypeT = "delete" | "add" | null;

const APITokenList = () => {
    const [listState, setListState] = useState<ListStateT>(initialListState);
    const [page, setPage] = useState(1);
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [dialogType, setDialogType] = useState<DialogTypeT>(null);
    const [selectedRow, setSelectedRow] = useState<APITokenT | null>(null);

    const { data, isLoading } = catalogsApi.useListAPITokenQuery(
        makeListParams(listState, ["name___icontains"]),
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

    const openModal = (dialogType: DialogTypeT, row: APITokenT | null) => {
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
                {dialogType === "add" && (
                    <CreateAPITokenForm onClose={handleCloseModal} />
                )}
                {dialogType === "delete" && selectedRow && (
                    <RevokeAPITokenForm
                        data={selectedRow}
                        onClose={handleCloseModal}
                    />
                )}
            </Modal>

            <Box flex={3} display="flex" flexDirection="column" gap={1}>
                <Box>
                    <Typography>
                        Here you can create private tokens for the API and use
                        them with the HTTP Bearer Authentication.
                        <br />
                        Documentation of the API is available by{" "}
                        <a href="/api/docs">this link</a>
                    </Typography>
                </Box>
                <Box display={"flex"} gap={1}>
                    <Box flex={1}>
                        <SearchField onChange={handleChangeSearch} />
                    </Box>

                    <Button
                        sx={{ height: "40px" }}
                        onClick={() => {
                            openModal("add", null);
                        }}
                        startIcon={<AddIcon />}
                        variant="outlined"
                        color="secondary"
                    >
                        Add token
                    </Button>
                </Box>

                {isLoading ? (
                    <LinearProgress />
                ) : (
                    <APITokenListComponent
                        data={data}
                        onDelete={(data) => {
                            openModal("delete", data);
                        }}
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

export default APITokenList;
