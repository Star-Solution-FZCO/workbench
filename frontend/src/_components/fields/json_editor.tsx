import { Box } from "@mui/material";
import JSONEditorClass, { JSONEditorMode, JSONEditorOptions } from "jsoneditor";
import "jsoneditor/dist/jsoneditor.css";
import { Component } from "react";

export interface IJSONEditorProps {
    mode: JSONEditorMode;
    modes?: JSONEditorMode[];
    json: any;
    onChangeText?: (value: string) => void;
    onChangeJSON?: (json: any) => void;
}

class JSONEditor extends Component<IJSONEditorProps> {
    jsonEditor: JSONEditorClass | null = null;
    container: HTMLDivElement | null = null;

    componentDidMount() {
        const options: JSONEditorOptions = {
            mode: this.props.mode,
            modes: this.props.modes,
            onChangeText: this.props.onChangeText,
            onChangeJSON: this.props.onChangeJSON,
        };

        if (this.container) {
            this.jsonEditor = new JSONEditorClass(this.container, options);
            this.jsonEditor.set(this.props.json);
        }
    }

    componentWillUnmount() {
        if (this.jsonEditor) {
            this.jsonEditor.destroy();
        }
    }

    componentDidUpdate() {
        this.jsonEditor?.update(this.props.json);
    }

    render() {
        return (
            <Box
                sx={{ width: "100%", height: "100%" }}
                ref={(elem) => (this.container = elem as HTMLDivElement)}
            />
        );
    }
}

export default JSONEditor;
