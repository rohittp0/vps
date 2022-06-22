import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";

import {client_id, redirect_uri, refresh_user, setAuth, setObj, setRefresh} from "../../api/authUtils";
import {getQueryVariable} from "../../api/QueryCreator";
import {baseUrl, post} from "../../api/api";

import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";

export default function HandleToken()
{
    const navigate = useNavigate();

    const [error, setError] = useState("");

    useEffect(() => 
    {
        const code = getQueryVariable("code");
        const state = getQueryVariable("state");
        const error = getQueryVariable("error");

        if (error)
            navigate("/");

        const kwargs = {
            client_id,
            redirect_uri,
            state,
            grant_type: "authorization_code",
            code: code,
            response_type: "token"
        };

        post(`${baseUrl}/auth/o/token/`, kwargs).then((response) => 
        {
            setAuth(response.access_token);
            setRefresh(response.refresh_token);
            const location = localStorage.getItem(state as string);

            post(`${baseUrl}/auth/users/me/`, {}, {"Authorization": `Bearer ${response.access_token}`}).then((response) => 
            {
                setObj("user", response.results[0]);
                if (location)
                    navigate(location);
                else
                    navigate("/");

            }).catch(() => 
            {
                setError("Oops something went wrong");
                setTimeout(navigate, 1000, "/");
            });

        }).catch(reason => 
        {
            console.log(reason);
            refresh_user();
        });
    });

    return(
        <Container className="mt-5 pt-5">
            <CircularProgress />
            {error && <Alert severity={"error"}>{error}</Alert>}
        </Container>
    );
}
