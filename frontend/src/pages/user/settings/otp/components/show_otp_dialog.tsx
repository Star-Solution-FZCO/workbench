import { Box } from "@mui/material";
import { FC } from "react";
import QRCode from "react-qr-code";
import { OTPTokenT } from "types";
import { formatDateTimeHumanReadable } from "utils/convert";

interface IOTPTokenViewProps {
    data: OTPTokenT;
}

const OTPTokenView: FC<IOTPTokenViewProps> = ({ data }) => {
    return (
        <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            gap={1}
            width="100%"
        >
            <table>
                <tr>
                    <td>Secret:</td>
                    <td>{data.secret}</td>
                </tr>
                <tr>
                    <td>Created:</td>
                    <td>{formatDateTimeHumanReadable(data.created)}</td>
                </tr>
                <tr>
                    <td>Link:</td>
                    <td>{data.link}</td>
                </tr>
                <tr>
                    <td>Period:</td>
                    <td>{data.period}</td>
                </tr>
                <tr>
                    <td>Digits:</td>
                    <td>{data.digits}</td>
                </tr>
                <tr>
                    <td>Digest:</td>
                    <td>{data.digest}</td>
                </tr>
                <tr>
                    <td colSpan={2}>
                        <QRCode value={data.link} />
                    </td>
                </tr>
            </table>
        </Box>
    );
};

export { OTPTokenView };
