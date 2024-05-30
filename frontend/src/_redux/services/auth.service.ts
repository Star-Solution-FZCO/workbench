import { ProfileModelT } from "types/models";
import {
    removeAuthorizationInfo,
    requestRefreshToken,
    sendRegistrationRequest,
    setProfileInfo,
} from "../utils";

type AuthT = {
    profile: ProfileModelT;
};

const login = (
    login: string,
    password: string,
    remember: boolean,
): Promise<ProfileModelT> =>
    requestRefreshToken<AuthT>(login, password, remember).then(({ profile }) =>
        setProfileInfo(profile),
    );

const logout = () => removeAuthorizationInfo();

const register = (
    register_token: string,
    password: string,
): Promise<{ success: boolean }> =>
    sendRegistrationRequest(register_token, password);

export const authService = {
    login,
    logout,
    register,
};
