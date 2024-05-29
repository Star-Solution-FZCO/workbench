import { ProfileModelT } from "types/models";
import { authService } from "../services";

export const authActions = {
    login:
        (
            handleSuccess: (response: ProfileModelT) => void,
            handleError: (error: string) => void,
        ) =>
        (username: string, password: string, remember: boolean) => {
            authService
                .login(username, password, remember)
                .then((profile) => handleSuccess(profile))
                .catch((error) => handleError(error));
        },
    logout: () => authService.logout(),
    register:
        (handleSuccess: () => void, handleError: (error: string) => void) =>
        (register_token: string, password: string) => {
            authService
                .register(register_token, password)
                .then(() => handleSuccess())
                .catch((error) => handleError(error));
        },
};
