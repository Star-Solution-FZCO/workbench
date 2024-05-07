import { Title } from "_components";
import { Route, Routes } from "react-router-dom";
import APITokenList from "./list";

const APIToken = () => {
    return (
        <>
            <Title title="API Tokens" />

            <Routes>
                <Route index element={<APITokenList />} />
            </Routes>
        </>
    );
};

export default APIToken;
