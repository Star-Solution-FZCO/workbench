import { BaseLayout, NewReleaseDialog } from "_components";
import { useAppSelector } from "_redux";
import React from "react";
import { Outlet } from "react-router-dom";
import { getNavItems } from "./sidebar";

export const UserLayout: React.FC = () => {
    const profile = useAppSelector(({ profile }) => profile.payload);

    return (
        <BaseLayout sideBarItems={getNavItems(profile)}>
            <NewReleaseDialog />
            <Outlet />
        </BaseLayout>
    );
};
