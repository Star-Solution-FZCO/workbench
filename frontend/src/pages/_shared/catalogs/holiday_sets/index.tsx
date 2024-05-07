import { Title } from "_components";
import { Route, Routes } from "react-router-dom";
import { HolidaySetList } from "./list";
import HolidaySetView from "./view";

const HolidaySets = () => (
    <>
        <Title title="Holiday Sets" />

        <Routes>
            <Route path="view/:id" element={<HolidaySetView />} />
            <Route index element={<HolidaySetList />} />
        </Routes>
    </>
);

export default HolidaySets;
