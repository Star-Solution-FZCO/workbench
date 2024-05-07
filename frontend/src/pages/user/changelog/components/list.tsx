import { Typography } from "@mui/material";
import { FC } from "react";
import { ApiResponse, ChangelogT, ListResponseT } from "types";
import { Changelog } from "./changelog";

interface IChangelogListProps {
    data: ApiResponse<ListResponseT<ChangelogT>> | undefined;
}

const ChangelogList: FC<IChangelogListProps> = ({ data }) => {
    return (
        <>
            {data?.payload?.items && data.payload.items.length > 0 ? (
                data.payload.items.map((changelog) => (
                    <Changelog key={changelog.id} changelog={changelog} />
                ))
            ) : (
                <Typography fontWeight={500}>No changelogs</Typography>
            )}
        </>
    );
};

export { ChangelogList };
