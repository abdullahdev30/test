import { http } from '../http';

export const authApi = {
    login: (credentials: any) =>
        http.post('/auth/login', {
            ...credentials,
            deviceId: "web-chrome-device-001"
        }),

    // This endpoint is used by the hook to see if the user is already logged in
    getMe: () => http.get('/auth/me'),

    logout: () => http.post('/auth/logout', {}),
};