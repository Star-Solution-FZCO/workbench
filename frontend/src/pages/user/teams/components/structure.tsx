import { Box, LinearProgress, Typography } from "@mui/material";
import { OrganizationalStructure } from "_components";
import { employeesApi } from "_redux";
import { FC } from "react";

interface ITeamStructureProps {
    id: number;
}

const data = {
    name: "root",
    attributes: null,
    children: [
        {
            name: "Stanislav Zvyagin",
            attributes: {
                label: "Stanislav Zvyagin",
                value: 396,
                email: "s.zvyagin@gaijin.team",
                pararam: "zvyagin_stas",
            },
            children: [
                {
                    name: "Yan Prourzin",
                    attributes: {
                        label: "Yan Prourzin",
                        value: 453,
                        email: "y.prourzin@gaijin.team",
                        pararam: "yan_prourzin",
                    },
                    children: [],
                },
            ],
        },
        {
            name: "Sergey Galkin",
            attributes: {
                label: "Sergey Galkin",
                value: 367,
                email: "sdk@gaijin.team",
                pararam: "sergey_galkin",
            },
            children: [
                {
                    name: "Eugene Guskov",
                    attributes: {
                        label: "Eugene Guskov",
                        value: 176,
                        email: "e.guskov@gaijin.team",
                        pararam: "eugene_guskov",
                    },
                    children: [],
                },
                {
                    name: "Evgeny Smirnov",
                    attributes: {
                        label: "Evgeny Smirnov",
                        value: 191,
                        email: "e.smirnov@gaijin.team",
                        pararam: "evgeny_smirnov",
                    },
                    children: [],
                },
                {
                    name: "Filipp Mirzayants",
                    attributes: {
                        label: "Filipp Mirzayants",
                        value: 193,
                        email: "f.mirzayants@gaijin.team",
                        pararam: "filipp_mirzayants",
                    },
                    children: [],
                },
                {
                    name: "Nataliia Popkova",
                    attributes: {
                        label: "Nataliia Popkova",
                        value: 297,
                        email: "n.popkova@gaijin.team",
                        pararam: "nataliia_popkova",
                    },
                    children: [],
                },
                {
                    name: "Sergey Dunaev",
                    attributes: {
                        label: "Sergey Dunaev",
                        value: 366,
                        email: "s.dunaev@gaijin.team",
                        pararam: "sergey_dunaev",
                    },
                    children: [],
                },
                {
                    name: "Vladimir Baboshin",
                    attributes: {
                        label: "Vladimir Baboshin",
                        value: 430,
                        email: "v.baboshin@gaijin.team",
                        pararam: "vladimir_baboshin",
                    },
                    children: [],
                },
                {
                    name: "Vladimir Kalinin",
                    attributes: {
                        label: "Vladimir Kalinin",
                        value: 433,
                        email: "v.kalinin@gaijin.team",
                        pararam: "vladimir_kalinin",
                    },
                    children: [],
                },
                {
                    name: "Vladislav Greznev",
                    attributes: {
                        label: "Vladislav Greznev",
                        value: 440,
                        email: "v.greznev@gaijin.team",
                        pararam: "vladislav_greznev",
                    },
                    children: [],
                },
                {
                    name: "Vladislav Udalov",
                    attributes: {
                        label: "Vladislav Udalov",
                        value: 445,
                        email: "v.udalov@gaijin.team",
                        pararam: "vladislav_udalov",
                    },
                    children: [],
                },
            ],
        },
    ],
};

const TeamStructure: FC<ITeamStructureProps> = ({ id }) => {
    const { data, isLoading } =
        employeesApi.useGetEmployeeHierarchyByTeamQuery(id);

    if (isLoading) return <LinearProgress />;

    if (!data) return <Typography fontWeight={500}>No data</Typography>;

    if (!data.children.length)
        return (
            <Typography fontWeight={500}>
                No subordinates to build a hierarchy at the moment
            </Typography>
        );

    return (
        <Box display="flex" flexDirection="column" gap={0.5} height="100%">
            <Box display="flex" alignItems="center" gap={0.5}>
                The person with the colored{" "}
                <Box bgcolor="#0052cc" width="16px" height="16px" /> border is
                the manager. Click on the person to go to the person's profile.
            </Box>

            <Typography>
                Click on the person's name to expand the subordinates.
            </Typography>

            <OrganizationalStructure data={data} />
        </Box>
    );
};

export { TeamStructure };
