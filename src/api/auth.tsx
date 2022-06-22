import {useState} from "react";

import {getParam, getQueryVariable} from "./QueryCreator";
import {baseUrl, post} from "./api";
import {client_id, getAuth, getObj, getRefresh, redirect_uri, setAuth, setObj, setRefresh} from "./authUtils";

function makeid(length: number)
{
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++)

        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));

    return result;
}


interface Token {
    private_token: string,
    invite_token: string,
    invited: number,
    points: number,
    profile: string | null,
    phone_number: string
}

interface User{
    id: number,
    tokens: Token,
    email: string,
    username: string,
    first_name: string,
    last_name: string,
}

export function useAuth(needUser = false)
{
    const [auth, setAuthState] = useState(getAuth());
    const [refresh, setRefreshState] = useState(getAuth());
    const [user, setUserState] = useState<User | null>(getObj("user"));

    const refreshState = () =>
    {
        setAuthState(getAuth());
        setRefreshState(getRefresh());
        setUserState(getObj("user"));
    };

    const performAuth = () =>
    {
        const state = "st" + makeid(5);
        const invite = getParam("invite", "", false);

        const kwargs = {
            client_id,
            redirect_uri,
            state,
            response_type: "code",
            invite
        };

        let pathname = window.location.pathname;
        if (pathname.includes("invite"))

            pathname = "/";

        localStorage.setItem(state, pathname + window.location.search);
        window.location.href = `${baseUrl}/auth/o/authorize/?` + new URLSearchParams(kwargs);
    };

    const refreshAuth = async () =>
    {
        const state = getQueryVariable("state");
        const refresh_token = getRefresh();
        const kwargs = {
            client_id,
            redirect_uri,
            state,
            grant_type: "refresh_token",
            refresh_token: refresh_token,
            response_type: "token"
        };

        const response = await post(`${baseUrl}/auth/o/token/`, kwargs);

        setRefresh(response.refresh_token);
        setAuth(response.access_token);
        setObj("timer", Date.now());

        refreshState();

        return auth;
    };

    const removeAuth = () =>
    {

        setRefresh("");
        setAuth("");
        setObj("user", null);

        refreshState();

        return true;
    };

    if (Date.now() - getObj("timer") > 36000 * 1000)
        refreshAuth().then();

    if(needUser && !auth)
        performAuth();

    return {
        auth,
        refresh,
        user,
        refreshAuth,
        removeAuth,
        performAuth
    };
}

