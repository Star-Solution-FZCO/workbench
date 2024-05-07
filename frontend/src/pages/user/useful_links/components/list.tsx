import { Box, Typography } from "@mui/material";
import { DeleteButton, EditButton } from "_components";
import { useAppSelector } from "_redux";
import { FC } from "react";
import { ApiResponse, ListResponseT, UsefulLinkT } from "types";

interface IUsefulListProps {
    data: ApiResponse<ListResponseT<UsefulLinkT>> | undefined;
    withControls?: boolean;
    onEdit?: (data: UsefulLinkT) => void;
    onDelete?: (data: UsefulLinkT) => void;
}

const UsefulList: FC<IUsefulListProps> = ({
    data,
    withControls = false,
    onEdit,
    onDelete,
}) => {
    const isAdmin = useAppSelector((state) => state.profile.payload.admin);

    return (
        <Box
            sx={{
                "& table": {
                    borderSpacing: 0,
                    fontSize: 14,
                    textAlign: "center",
                    width: "100%",
                },
                "& td, th": {
                    border: "1px solid #ccc",
                    padding: "4px",
                },
                "& tbody > tr:focus": {
                    background: "#357DED !important",
                    color: "white",
                    "& a": {
                        color: "white",
                    },
                },
            }}
        >
            {data?.payload?.items && data.payload.items.length > 0 ? (
                <table>
                    <thead>
                        <tr>
                            {withControls && isAdmin && <th>Actions</th>}
                            <th>Resource</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.payload.items.map((usefulLink) => (
                            <tr key={usefulLink.id} tabIndex={0}>
                                {withControls && isAdmin && (
                                    <td width="60px">
                                        <Box
                                            display="flex"
                                            justifyContent="center"
                                            width="100%"
                                        >
                                            <EditButton
                                                onClick={() =>
                                                    onEdit && onEdit(usefulLink)
                                                }
                                            />
                                            <DeleteButton
                                                onClick={() =>
                                                    onDelete &&
                                                    onDelete(usefulLink)
                                                }
                                            />
                                        </Box>
                                    </td>
                                )}
                                <td>
                                    <a
                                        href={usefulLink.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {usefulLink.name}
                                    </a>
                                </td>
                                <td>{usefulLink.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <Typography fontWeight={500}>No links</Typography>
            )}
        </Box>
    );
};

export { UsefulList };
