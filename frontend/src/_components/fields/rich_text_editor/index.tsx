import { CKEditor } from "@ckeditor/ckeditor5-react";
import loadable from "@loadable/component";
import { LinearProgress } from "@mui/material";
import { FC } from "react";
import "./ckeditor.css";
import UploadAdapterPlugin from "./upload_adapter_plugin";

const CustomEditor = loadable.lib(() => import("ckeditor5-custom-build"));

interface IRichTextEditorProps {
    data: string;
    placeholder?: string;
    onChange: (value: string) => void;
    readOnly?: boolean;
}

const RichTextEditor: FC<IRichTextEditorProps> = ({
    data,
    placeholder,
    onChange,
    readOnly,
}) => {
    return (
        <CustomEditor fallback={<LinearProgress />}>
            {/* @ts-ignore */}
            {({ default: Editor }) => (
                <CKEditor
                    editor={Editor}
                    data={data}
                    onReady={(editor: any) => {
                        editor.editing.view.change((writer: any) => {
                            writer.setStyle(
                                "height",
                                "calc(100% - 40px)",
                                editor.editing.view.document.getRoot(),
                            );
                        });

                        if (readOnly) {
                            editor.enableReadOnlyMode("");
                        }
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onChange={(_: unknown, editor: any) => {
                        const data = editor.getData();
                        onChange(data);
                    }}
                    config={{
                        extraPlugins: [UploadAdapterPlugin],
                        placeholder,
                    }}
                />
            )}
        </CustomEditor>
    );
};

export { RichTextEditor };
