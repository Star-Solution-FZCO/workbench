import { ProfileModelT } from "types/models";
import {
    removeAuthorizationInfo,
    requestRefreshToken,
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

export const authService = {
    login,
    logout,
};
