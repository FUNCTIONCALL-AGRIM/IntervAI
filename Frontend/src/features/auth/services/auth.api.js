import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
    withCredentials: true
});

export async function register(data) {
    try {
        const res = await api.post("/api/auth/register", data);
        return res.data;
    } catch (err) {
        console.error("Register Error:", err.response?.data || err.message);
        throw err; // 🔥 IMPORTANT
    }
}

export async function login(data) {
    try {
        const res = await api.post("/api/auth/login", data);
        return res.data;
    } catch (err) {
        console.error("Login Error:", err.response?.data || err.message);
        throw err; // 🔥 IMPORTANT
    }
}

export async function logout() {
    try {
        const res = await api.get("/api/auth/logout");
        return res.data;
    } catch (err) {
        console.error("Logout Error:", err.response?.data || err.message);
        throw err;
    }
}

export async function getMe() {
    try {
        const res = await api.get("/api/auth/get-me");
        return res.data;
    } catch (err) {
        console.error("GetMe Error:", err.response?.data || err.message);
        throw err; // 🔥 IMPORTANT
    }
}