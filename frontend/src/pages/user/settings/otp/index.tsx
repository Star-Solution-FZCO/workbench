import { Title } from "_components";
import { Route, Routes } from "react-router-dom";
import OTPView from "./view.tsx";

const OTPPage = () => {
    return (
        <>
            <Title title="OTP" />

            <Routes>
                <Route index element={<OTPView />} />
            </Routes>
        </>
    );
};

export default OTPPage;
