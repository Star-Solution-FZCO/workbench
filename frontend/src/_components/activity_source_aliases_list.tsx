import { CircularProgress } from "@mui/material";
import { reportsApi } from "_redux";
import { FC } from "react";

interface IActivitySourceAliasesList {
    id: number;
}

const ActivitySourceAliasesList: FC<IActivitySourceAliasesList> = ({ id }) => {
    const { data, isLoading, isUninitialized } =
        reportsApi.useListEmployeeActivitySourceAliasQuery({ id });

    if (isUninitialized || isLoading || !data)
        return <CircularProgress color="success" />;

    return (
        <>
            <table>
                <thead>
                    <tr>
                        <th>Source</th>
                        <th>Alias</th>
                    </tr>
                </thead>
                <tbody>
                    {data.payload.items.map((row) => (
                        <tr>
                            <td>{row.source.label}</td>
                            <td>{row.alias || "---"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
};

export default ActivitySourceAliasesList;
