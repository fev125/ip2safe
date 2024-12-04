import axios from 'axios';

class AuthService {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user'));
    }

    async login(credentials) {
        try {
            const response = await axios.post('/api/auth/login', credentials);
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                this.token = response.data.token;
                this.user = response.data.user;
            }
            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async register(userData) {
        try {
            const response = await axios.post('/api/auth/register', userData);
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                this.token = response.data.token;
                this.user = response.data.user;
            }
            return response.data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.token = null;
        this.user = null;
    }

    isAuthenticated() {
        return !!this.token;
    }

    getUser() {
        return this.user;
    }

    getToken() {
        return this.token;
    }

    async resetPassword(email) {
        try {
            const response = await axios.post('/api/auth/reset-password', { email });
            return response.data;
        } catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    }

    async updatePassword(token, newPassword) {
        try {
            const response = await axios.post('/api/auth/update-password', {
                token,
                newPassword
            });
            return response.data;
        } catch (error) {
            console.error('Password update error:', error);
            throw error;
        }
    }
}

export default new AuthService();
