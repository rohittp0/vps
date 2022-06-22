import "./bootstrap.css";

import {Workbox} from "workbox-window";
import {BrowserRouter, Route, Routes} from "react-router-dom";

import HandleToken from "./pages/HandleToken";
import Home from "./pages/Home";
import {HandleAppState} from "./components/HandleAppState";
import {createRoot} from "react-dom/client";

const wb = new Workbox("/sw.js");

const isProduction = location.hostname !== "localhost" && location.protocol !== "http:" && "serviceWorker" in navigator;

if (isProduction)
    wb.register().catch(console.error);


function App()
{
    return (
        <>
            {isProduction && <HandleAppState wb={wb}/>}
            <BrowserRouter>
                <Routes>
                    <Route path="/set_token" element={<HandleToken/>}/>
                    <Route path="/" element={<Home/>}/>
                </Routes>
            </BrowserRouter>
        </>
    );
}

const root = createRoot(document.getElementById("root") as Element);
root.render(<App />);
