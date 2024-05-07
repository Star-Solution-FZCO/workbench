import { Box, Typography } from "@mui/material";
import { DeleteButton } from "_components";
import { FC } from "react";
import { APITokenT, ApiResponse, ListResponseT } from "types";
import { formatDateTimeHumanReadable } from "utils/convert";

interface IAPITokenListProps {
    data: ApiResponse<ListResponseT<APITokenT>> | undefined;
    onDelete?: (data: APITokenT) => void;
}

const APITokenList: FC<IAPITokenListProps> = ({ data, onDelete }) => {
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
                            <th>Revoke</th>
                            <th>Created</th>
                            <th>Name</th>
                            <th>Token</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.payload.items.map((token) => (
                            <tr key={token.id} tabIndex={0}>
                                <td width="60px">
                                    <Box
                                        display="flex"
                                        justifyContent="center"
                                        width="100%"
                                    >
                                        <DeleteButton
                                            onClick={() =>
                                                onDelete && onDelete(token)
                                            }
                                        />
                                    </Box>
                                </td>
                                <td>
                                    {formatDateTimeHumanReadable(token.created)}
                                </td>
                                <td>{token.name}</td>
                                <td>**********{token.token_suffix}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <Typography fontWeight={500}>No Tokens</Typography>
            )}
        </Box>
    );
};

export { APITokenList };
