import loadable from "@loadable/component";
import { Box } from "@mui/material";
import { IJSONEditorProps } from "_components/fields/json_editor";
import { FC } from "react";

const JSONEditor = loadable<IJSONEditorProps>(
    // @ts-ignore
    () => import("_components/fields/json_editor"),
);

interface IJSONEditorWithPreviewProps {
    json: any;
    onChange: (value: any) => void;
}

const JSONEditorWithPreview: FC<IJSONEditorWithPreviewProps> = ({
    json,
    onChange,
}) => {
    return (
        <Box height="400px" display="flex" gap={1}>
            <JSONEditor
                mode="code"
                json={json}
                onChangeText={(value) => {
                    try {
                        onChange(JSON.parse(value));
                    } catch (err) {
                        console.log(err);
                    }
                }}
            />
            <JSONEditor mode="tree" json={json} onChangeJSON={onChange} />
        </Box>
    );
};

export { JSONEditorWithPreview };
