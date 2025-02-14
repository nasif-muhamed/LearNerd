class tokenManager {
    constructor() {
        this.accessToken = localStorage.getItem('accessToken');
        this.refreshToken = localStorage.getItem('refreshToken');
    }

    getAccessToken() {
        return this.accessToken;
    }

    setAccessToken(token) {
        this.accessToken = token;
        localStorage.setItem('accessToken', token);
    }

    getRefreshToken() {
        return this.refreshToken;
    }

    setRefreshToken(token) {
        this.refreshToken = token;
        localStorage.setItem('refreshToken', token);
    }

    clearTokens() {
        this.accessToken = null;
        this.refreshToken = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }
}