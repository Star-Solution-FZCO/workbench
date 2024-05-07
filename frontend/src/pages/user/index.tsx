import loadable from "@loadable/component";
import { Title } from "_components";
import Fallback from "_components/fallback";
import { Route, Routes } from "react-router-dom";
import { UserLayout } from "./layout";
import ActivitySummaryReport from "./reports/activity_summary";

const loadableOptions = { fallback: <Fallback /> };

const NotFound = loadable(() => import("../404"), loadableOptions);
const Dashboard = loadable(() => import("./dashboard"), loadableOptions);
const ChangelogRoutes = loadable(() => import("./changelog"), loadableOptions);
const MyCalendarRoute = loadable(
    () => import("./my_calendar"),
    loadableOptions,
);
const MyPresenceRoute = loadable(
    () => import("./my_presence"),
    loadableOptions,
);
const EmployeeRoutes = loadable(() => import("./employees"), loadableOptions);
const CounteragentRoutes = loadable(
    () => import("./counteragents"),
    loadableOptions,
);
const ProfileRoute = loadable(() => import("./profile"), loadableOptions);

const TeamRoutes = loadable(() => import("./teams"), loadableOptions);
const PolicyRoutes = loadable(() => import("./policies"), loadableOptions);
const QuizzesRoutes = loadable(() => import("./quizzes"), loadableOptions);
const ReportRoutes = loadable(() => import("./reports"), loadableOptions);
const RequestRoutes = loadable(() => import("./requests"), loadableOptions);
const HelpCenterRoutes = loadable(
    () => import("./help_center"),
    loadableOptions,
);
const UsefulLinkRoutes = loadable(
    () => import("./useful_links"),
    loadableOptions,
);
const ProductionCalendarRoutes = loadable(
    () => import("../_shared/catalogs/holiday_sets"),
    loadableOptions,
);
// catalogs
const CatalogRoutes = loadable(
    () => import("../_shared/catalogs"),
    loadableOptions,
);

const SettingsRoute = loadable(() => import("./settings"), loadableOptions);

const MyReports = () => {
    return (
        <>
            <Title title="My Reports" />
            <ActivitySummaryReport />
        </>
    );
};

export const UserRouter = () => (
    <Routes>
        <Route path="*" element={<NotFound />} />
        <Route path="/*" element={<UserLayout />}>
            <Route index element={<Dashboard />} />
            <Route path={"employees/*"} element={<EmployeeRoutes />} />
            <Route path={"people/*"} element={<EmployeeRoutes />} />
            <Route path={"counteragents/*"} element={<CounteragentRoutes />} />
            <Route path={"profile/*"} element={<ProfileRoute />} />
            <Route path={"my-presence"} element={<MyPresenceRoute />} />
            <Route path={"my-calendar"} element={<MyCalendarRoute />} />
            <Route path={"my-reports/*"} element={<MyReports />} />
            <Route path={"requests/*"} element={<RequestRoutes />} />
            <Route path={"teams/*"} element={<TeamRoutes />} />
            <Route path={"policies/*"} element={<PolicyRoutes />} />
            <Route path={"quizzes/*"} element={<QuizzesRoutes />} />
            <Route path={"reports/*"} element={<ReportRoutes />} />
            <Route path={"changelog/*"} element={<ChangelogRoutes />} />
            <Route path={"help-center/*"} element={<HelpCenterRoutes />} />
            <Route path={"catalog/*"} element={<CatalogRoutes />} />
            <Route path={"useful-links/*"} element={<UsefulLinkRoutes />} />
            <Route
                path={"production-calendar/*"}
                element={<ProductionCalendarRoutes />}
            />
            <Route path={"settings/*"} element={<SettingsRoute />} />
        </Route>
    </Routes>
);
