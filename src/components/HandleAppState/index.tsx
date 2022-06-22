import { Workbox } from "workbox-window";
import {useState} from "react";

import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";

export const HandleAppState = ({wb}: { wb: Workbox; }) =>
{
    const strings =
        {
            UPDATE: "New Update Available 🎉",
            ONLINE: "Back on line.",
            OFFLINE: "Internet connection lost."
        };

    const [workerWaiting, setWorkerWaiting] = useState(false);
    const [toggleOnline, setToggleOnline] = useState({online: navigator.onLine, change: !navigator.onLine});

    wb.addEventListener("waiting", () => setWorkerWaiting(true));

    window.addEventListener("online", () => setToggleOnline({online: true, change: true}));
    window.addEventListener("offline", () => setToggleOnline({online: false, change: true}));


    function updateWorker()
    {
        wb.addEventListener("controlling", () => window.location.reload());
        setWorkerWaiting(false);
        wb.messageSkipWaiting();
    }

    return(
        <>
            <Snackbar
                open={workerWaiting}
                autoHideDuration={60000}
                message={strings.UPDATE}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
                action={
                    <>
                        <Button color="secondary" size="small"
                            onClick={updateWorker}>
                            UPDATE
                        </Button>
                        <IconButton size="small" aria-label="close" onClick={() => setWorkerWaiting(false)}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </>
                }
                onClose={() => setWorkerWaiting(false)}
            />
            <Snackbar open={toggleOnline.change}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
                autoHideDuration={10000}
                onClose={() => setToggleOnline({online: navigator.onLine, change: false})}
            >
                <Alert severity={toggleOnline.online ? "success": "error"} >
                    {toggleOnline.online ? strings.ONLINE : strings.OFFLINE}
                </Alert>
            </Snackbar>
        </>
    );
};
