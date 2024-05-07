import { CssBaseline, ThemeProvider } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";

import { enGB } from "date-fns/locale/en-GB";
import { HelmetProvider } from "react-helmet-async";
import { RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import router from "./router";
import { theme } from "./theme";

const App = () => (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <HelmetProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
            <ThemeProvider theme={theme}>
                <div className="App">
                    <CssBaseline />

                    <ToastContainer position="top-right" closeOnClick />

                    <RouterProvider router={router} />
                </div>
            </ThemeProvider>
        </LocalizationProvider>
    </HelmetProvider>
);

export default App;
