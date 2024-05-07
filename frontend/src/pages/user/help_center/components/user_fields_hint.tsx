import CloseIcon from "@mui/icons-material/Close";
import InfoIcon from "@mui/icons-material/Info";
import { Box, Button, IconButton, Typography } from "@mui/material";
import { Modal } from "_components";
import { useState } from "react";

const mockFormFields = [
    {
        name: "relocation_country",
        label: "Relocation country",
        type: "select",
        options: ["Cyprus", "Montenegro", "Armenia"],
        required: true,
    },
    {
        name: "date",
        label: "Date",
        type: "date",
        required: true,
    },
    {
        name: "attachment",
        label: "Attachments",
        type: "file",
        required: true,
    },
];

const UserFieldsHints = () => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                startIcon={<InfoIcon />}
                variant="outlined"
                color="info"
                size="small"
            >
                Open User fields hints
            </Button>

            <Modal open={open} onClose={() => setOpen(false)}>
                <Box>
                    <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Typography variant="h6">
                            User form fields hint
                        </Typography>

                        <IconButton onClick={() => setOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <Box
                        sx={{
                            "& pre": {
                                display: "inline",
                                fontSize: 14,
                                lineHeight: 1,
                            },
                        }}
                        display="flex"
                        gap={4}
                    >
                        <Box flex={1}>
                            <Typography>
                                JSON should always be an array with objects as
                                in the example below:
                            </Typography>

                            <Box border="1px solid #ccc" borderRadius={1} p={1}>
                                <pre>
                                    {JSON.stringify(mockFormFields, null, 2)}
                                </pre>
                            </Box>
                        </Box>

                        <Box
                            sx={{
                                "& table": {
                                    borderSpacing: 0,
                                    fontSize: 14,
                                    textAlign: "center",
                                },
                                "& td, th": {
                                    border: "1px solid #ccc",
                                    padding: "4px",
                                },
                                "& tbody > tr:focus": {
                                    background: "#357DED !important",
                                    color: "white",
                                },
                            }}
                            display="flex"
                            flexDirection="column"
                            gap={1}
                        >
                            <ul>
                                <Typography fontWeight={500}>
                                    Explanation of object keys:
                                </Typography>
                                <li>
                                    <pre>name</pre> - Unique field name (Type:
                                    string)
                                </li>
                                <li>
                                    <pre>label</pre> - Label of the field that
                                    will be visible to the user (Type: string)
                                </li>
                                <li>
                                    <pre>type</pre> - Field type. Available
                                    types:{" "}
                                    <pre>
                                        string | text | number | select | file |
                                        date
                                    </pre>
                                </li>
                                <li>
                                    <pre>required</pre> - Defines a required
                                    field in the form or not (Type: boolean)
                                </li>
                                <li>
                                    <pre>options</pre> - Select options,
                                    required if the field type is "select"
                                    <br />
                                    (Example:{" "}
                                    <pre>
                                        ["Option 1", "Option 2", "Option 3",
                                        ...]
                                    </pre>
                                    )
                                </li>
                            </ul>

                            <table>
                                <thead>
                                    <tr>
                                        <th>Field type</th>
                                        <th>Rendering input</th>
                                        <th>Note</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr tabIndex={0}>
                                        <td>
                                            <pre>string</pre>
                                        </td>
                                        <td>Textfield (single line)</td>
                                        <td />
                                    </tr>
                                    <tr tabIndex={0}>
                                        <td>
                                            <pre>text</pre>
                                        </td>
                                        <td>Markdown editor</td>
                                        <td />
                                    </tr>
                                    <tr tabIndex={0}>
                                        <td>
                                            <pre>number</pre>
                                        </td>
                                        <td>Number input</td>
                                        <td />
                                    </tr>
                                    <tr tabIndex={0}>
                                        <td>
                                            <pre>select</pre>
                                        </td>
                                        <td>Single select with options</td>
                                        <td>
                                            <pre>select</pre> key required
                                        </td>
                                    </tr>
                                    <tr tabIndex={0}>
                                        <td>
                                            <pre>date</pre>
                                        </td>
                                        <td>Datepicker</td>
                                        <td />
                                    </tr>
                                    <tr tabIndex={0}>
                                        <td>
                                            <pre>file</pre>
                                        </td>
                                        <td>
                                            Field for attaching <b>multiple</b>{" "}
                                            files
                                        </td>
                                        <td>
                                            <b>
                                                Can be only one in User Fields,
                                                because user can upload multiple
                                                files
                                            </b>
                                            <br />
                                            <pre>name</pre> key must have value{" "}
                                            <pre>"attachments"</pre>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </Box>
                    </Box>
                </Box>
            </Modal>
        </>
    );
};

export { UserFieldsHints };
