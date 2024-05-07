import { Box, Typography } from "@mui/material";
import JSONEditorComp from "_components/fields/json_editor";
import { JSONEditorMode } from "jsoneditor";
import { useState } from "react";

const modes: JSONEditorMode[] = [
    "tree",
    "view",
    "form",
    "code",
    "text",
    "preview",
];

const JSONEditor = () => {
    const [json, setJson] = useState<any>({ hello: "world" });

    return (
        <Box display="flex" flexDirection="column" gap={1} height="100%">
            <Typography
                fontSize={20}
                fontWeight={500}
                textAlign="center"
                mt={1}
            >
                JSON Editor
            </Typography>

            <Box flex={1} display="flex" gap={0.5}>
                <JSONEditorComp
                    mode="code"
                    modes={modes}
                    json={json}
                    onChangeText={(value) => {
                        try {
                            setJson(JSON.parse(value));
                        } catch (err) {
                            console.log(err);
                        }
                    }}
                />

                <JSONEditorComp
                    mode="tree"
                    modes={modes}
                    json={json}
                    onChangeText={(value) => {
                        try {
                            setJson(JSON.parse(value));
                        } catch (err) {
                            console.log(err);
                        }
                    }}
                />
            </Box>
        </Box>
    );
};

export default JSONEditor;
