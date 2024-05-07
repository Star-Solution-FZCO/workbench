import { SITE_NAME } from "config";
import { FC } from "react";
import { Helmet } from "react-helmet-async";

interface ITitleProps {
    title: React.ReactNode;
    loading?: boolean;
}

const Title: FC<ITitleProps> = ({ title, loading }) => {
    return (
        <Helmet>
            {/* @ts-ignore */}
            <title>
                {loading
                    ? SITE_NAME + " - Loading..."
                    : SITE_NAME + " - " + title}
            </title>
        </Helmet>
    );
};

export { Title };
