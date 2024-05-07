/* eslint-disable @typescript-eslint/no-explicit-any */
import { Menu, MenuItem } from "@mui/material";
import { FC } from "react";
import { toast } from "react-toastify";

interface IDataGridContextMenuProps {
    newTabPath: string;
    contextMenuEvent: any | null;
    contextMenuEventCurrentTarget: any | null;
    onClose: () => void;
}

const DataGridContextMenu: FC<IDataGridContextMenuProps> = ({
    newTabPath,
    contextMenuEvent,
    contextMenuEventCurrentTarget,
    onClose,
}) => {
    const openInNewTab = () => {
        if (!contextMenuEventCurrentTarget) return;

        const selectedRowId = Number(
            contextMenuEventCurrentTarget.getAttribute("data-id").split("-")[0],
        );

        let url = window.location.protocol + "//" + window.location.host;
        url += newTabPath + "/" + selectedRowId;
        window.open(url);
        onClose();
    };

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text);
        toast.success("Сopied to the clipboard");
        onClose();
    };

    const copyValueToClipboard = async () => {
        if (!contextMenuEvent) return;
        copyToClipboard(contextMenuEvent.target.textContent);
        onClose();
    };

    const copyRowToClipboard = async () => {
        if (!contextMenuEventCurrentTarget) return;
        copyToClipboard(contextMenuEventCurrentTarget.innerText);
        onClose();
    };

    return (
        <Menu
            open={contextMenuEvent !== null}
            onClose={onClose}
            anchorReference="anchorPosition"
            anchorPosition={
                contextMenuEvent !== null
                    ? {
                          top: contextMenuEvent.clientY - 4,
                          left: contextMenuEvent.clientX - 2,
                      }
                    : undefined
            }
            slotProps={{
                root: {
                    onContextMenu: (e) => {
                        e.preventDefault();
                        onClose();
                    },
                },
            }}
        >
            <MenuItem onClick={openInNewTab}>Open in new tab</MenuItem>
            <MenuItem onClick={copyValueToClipboard}>Copy value</MenuItem>
            <MenuItem onClick={copyRowToClipboard}>Copy row</MenuItem>
        </Menu>
    );
};

export { DataGridContextMenu };
