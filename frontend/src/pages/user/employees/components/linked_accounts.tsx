import { Box, Divider, Typography } from "@mui/material";
import { FC } from "react";
import { EmployeeLinkedAccountT } from "types";

interface IEmployeeLinkedAccountsProps {
    accounts: EmployeeLinkedAccountT[];
}

const EmployeeLinkedAccounts: FC<IEmployeeLinkedAccountsProps> = ({
    accounts,
}) => {
    return (
        <Box display="flex" flexDirection="column" gap={0.5}>
            <Box width="300px">
                <Typography fontWeight={500}>Linked accounts</Typography>
            </Box>

            {accounts.map((account, index) => (
                <Box
                    key={account.account_id}
                    display="flex"
                    flexDirection="column"
                >
                    <Box display="flex">
                        <Box width="300px">
                            <Typography fontWeight={500}>Source</Typography>
                        </Box>

                        <Box width="350px">
                            <Typography>{account.source.name}</Typography>
                        </Box>
                    </Box>

                    <Box display="flex">
                        <Box width="300px">
                            <Typography fontWeight={500}>Account ID</Typography>
                        </Box>

                        <Box width="350px">
                            <Typography>{account.account_id}</Typography>
                        </Box>
                    </Box>

                    <Box display="flex">
                        <Box width="300px">
                            <Typography fontWeight={500}>Status</Typography>
                        </Box>

                        <Box width="350px">
                            <Typography>
                                {account.active ? "Active" : "Not active"}
                            </Typography>
                        </Box>
                    </Box>

                    {index < accounts.length - 1 && (
                        <Divider sx={{ mb: 0.5 }} flexItem />
                    )}
                </Box>
            ))}
        </Box>
    );
};

export { EmployeeLinkedAccounts };
