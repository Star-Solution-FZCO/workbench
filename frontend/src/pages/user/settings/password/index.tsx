import { Title } from "_components";
import { Route, Routes } from "react-router-dom";
import PasswordView from "./view.tsx";

const PasswordPage = () => {
    return (
        <>
            <Title title="Password" />

            <Routes>
                <Route index element={<PasswordView />} />
            </Routes>
        </>
    );
};

export default PasswordPage;
