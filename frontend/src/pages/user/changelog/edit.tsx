import { LinearProgress } from "@mui/material";
import { sharedApi } from "_redux";
import { useParams } from "react-router-dom";
import { ChangelogForm } from "./components";

const ChangelogEdit = () => {
    const { id } = useParams();
    const { data, isLoading } = sharedApi.useGetChangelogQuery(Number(id), {
        skip: !id,
    });

    if (isLoading) return <LinearProgress />;

    return <ChangelogForm ininitalData={data?.payload} editMode />;
};

export default ChangelogEdit;
