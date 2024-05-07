import { Title } from "_components";
import { Route, Routes } from "react-router-dom";
import UsefulLinkList from "./list";

const UsefulLink = () => {
    return (
        <>
            <Title title="Useful Links" />

            <Routes>
                <Route index element={<UsefulLinkList />} />
            </Routes>
        </>
    );
};

export default UsefulLink;
