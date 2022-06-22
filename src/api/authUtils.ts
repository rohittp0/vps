import {getQueryVariable} from "./QueryCreator";
import {baseUrl, post} from "./api";

export const client_id = process.env.CLIENT_ID || "somebody fucked-up .env";
export const reactUrl = process.env.REACT_URL || "somebody fucked-up .env";

export const redirect_uri = reactUrl + "/set_token/";

export function getAuth() 
{
    return localStorage.getItem("accessToken");
}

export function setAuth(token: string) 
{
    localStorage.setItem("accessToken", token);
}

export function getRefresh() 
{
    return localStorage.getItem("refreshToken");
}

export function setRefresh(token: string) 
{
    localStorage.setItem("refreshToken", token);

}

export async function refreshToken() 
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

    await post(`${baseUrl}/auth/o/token/`, kwargs).then((response) => 
    {
        setRefresh(response.refresh_token);
        setAuth(response.access_token);
        setObj("timer", Date.now());
    });
}

export function refresh_user(tries = 0) 
{
    const access_token = getAuth();

    post(`${baseUrl}/auth/users/me/`, {}, {"Authorization": `Bearer ${access_token}`}).then((response) => 
    {
        setObj("user", response.results[0]);
    }).catch((error) => 
    {
        console.log(error);
        if (tries < 1)

            refreshToken().then(() => 
            {
                refresh_user(1);
            });

    });
}

export function setObj(str: string, data: unknown) 
{
    localStorage.setItem(str, JSON.stringify(data));

}

export function getObj(str: string) 
{
    const item = localStorage.getItem(str);
    return JSON.parse(item || "{}");
}
