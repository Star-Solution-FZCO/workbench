import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";
import BadgeIcon from "@mui/icons-material/Badge";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CalendarViewMonthIcon from "@mui/icons-material/CalendarViewMonth";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import EngineeringIcon from "@mui/icons-material/Engineering";
import EventIcon from "@mui/icons-material/Event";
import GMobiledataIcon from "@mui/icons-material/GMobiledata";
import GroupsIcon from "@mui/icons-material/Groups";
import HelpCenterIcon from "@mui/icons-material/HelpCenter";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import ImportContactsIcon from "@mui/icons-material/ImportContacts";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PersonIcon from "@mui/icons-material/Person";
import PolicyIcon from "@mui/icons-material/Policy";
import QuizIcon from "@mui/icons-material/Quiz";
import StarIcon from "@mui/icons-material/Star";
import SummarizeIcon from "@mui/icons-material/Summarize";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import TagIcon from "@mui/icons-material/Tag";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import { NavItemT } from "_components";
import { today, weekAgo } from "config";
import { endOfWeek, format, startOfWeek } from "date-fns";
import { createSearchParams } from "react-router-dom";
import { ProfileModelT } from "types/models";

const catalogs = [
    {
        href: "organization",
        title: "Organizations",
        icon: <CorporateFareIcon fontSize="small" />,
    },
    {
        href: "grade",
        title: "Grades",
        icon: <GMobiledataIcon fontSize="small" />,
    },
    {
        href: "position",
        title: "Positions",
        icon: <BusinessCenterIcon fontSize="small" />,
    },
    {
        href: "holiday_set",
        title: "Holiday Sets",
        icon: <EventIcon fontSize="small" />,
    },
    {
        href: "cooperation_type",
        title: "Cooperation Types",
        icon: <HomeWorkIcon fontSize="small" />,
    },
    {
        href: "people-pool",
        title: "People pools",
        icon: <WorkspacesIcon fontSize="small" />,
    },
    {
        href: "team-tag",
        title: "Team tags",
        icon: <TagIcon fontSize="small" />,
    },
];

export const getNavItems: (profile: ProfileModelT) => NavItemT[] = (
    profile,
) => {
    const start = format(
        startOfWeek(weekAgo(), {
            weekStartsOn: 1,
        }),
        "yyyy-MM-dd",
    );
    const end = format(
        endOfWeek(today(), {
            weekStartsOn: 1,
        }),
        "yyyy-MM-dd",
    );

    const params = {
        id: profile.id.toString(),
        start,
        end,
    };

    const items: NavItemT[] = [
        {
            href: "/my-calendar",
            icon: <CalendarMonthIcon fontSize="small" />,
            title: "My Calendar",
        },
        {
            href: "/my-presence",
            icon: <AccessTimeFilledIcon fontSize="small" />,
            title: "My Presence",
        },
        {
            href: "/people",
            icon: <BadgeIcon fontSize="small" />,
            title: "People",
        },
        {
            href: "/counteragents",
            icon: <SupervisorAccountIcon fontSize="small" />,
            title: "Counteragents",
        },
        {
            href: "/my-reports/activity-summary",
            icon: <EngineeringIcon fontSize="small" />,
            title: "My Reports",
            params: createSearchParams(params).toString(),
        },
        {
            href: "/profile",
            icon: <PersonIcon fontSize="small" />,
            title: "My Profile",
        },
        {
            href: "/teams",
            icon: <GroupsIcon fontSize="small" />,
            title: "Teams",
        },
        {
            href: "/policies",
            icon: <PolicyIcon fontSize="small" />,
            title: "Policies",
            external: true,
        },
        {
            href: "/quizzes",
            icon: <QuizIcon fontSize="small" />,
            title: "Quizzes",
        },
        {
            href: "/reports",
            icon: <SummarizeIcon fontSize="small" />,
            title: "Work Reports",
        },
        {
            href: "/requests",
            icon: <ListAltIcon fontSize="small" />,
            title: "Requests",
        },
        {
            href: "/help-center",
            icon: <HelpCenterIcon fontSize="small" />,
            title: "Help Center",
        },
        {
            href: "/useful-links",
            icon: <StarIcon fontSize="small" />,
            title: "Useful Links",
        },
        {
            href: "/production-calendar",
            title: "Production Calendar",
            icon: <CalendarViewMonthIcon fontSize="small" />,
        },
    ];

    if (profile.hr || profile.admin) {
        items.push({
            href: "/catalog",
            icon: <ImportContactsIcon fontSize="small" />,
            title: "Catalogs",
            subItems: catalogs,
        });
    }

    return items;
};
