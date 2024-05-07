import { request } from "_redux/utils";
import { toast } from "react-toastify";
import { storageUrl } from "utils/url";

class UploadAdapter {
    [x: string]: any;

    constructor(loader: any) {
        this.loader = loader;
        this.controller = new AbortController();
        this.signal = this.controller.signal;
    }

    upload() {
        return this.loader.file.then(
            (file: File) =>
                new Promise((resolve, reject) => {
                    const formData = new FormData();
                    formData.append("file", file);

                    request<{ url: string }>({
                        url: "v1/upload/attachment",
                        method: "post",
                        data: formData,
                        onUploadProgress: (progressEvent: any) => {
                            this.loader.uploadTotal = progressEvent.total;
                            this.loader.uploaded = progressEvent.loaded;
                        },
                        signal: this.signal,
                    })
                        .then((res) => {
                            resolve({
                                default: storageUrl(res.url),
                            });
                        })
                        .catch((err) => {
                            toast.error(
                                "An error occurred while uploading the file",
                            );
                            reject(err);
                        });
                }),
        );
    }

    abort() {
        this.controller.abort();
    }
}

function UploadAdapterPlugin(editor: any) {
    editor.plugins.get("FileRepository").createUploadAdapter = (
        loader: any,
    ) => {
        return new UploadAdapter(loader);
    };
}

export default UploadAdapterPlugin;
