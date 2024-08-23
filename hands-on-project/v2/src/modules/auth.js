import { apiRequest } from '../utils.js';
import { Router } from '../router.js';
import { showNotification } from '../websocket.js';

export function loadLogin() {
    document.getElementById('main-content').innerHTML = `
        <div id="auth-section">
            <h2>Login</h2>
            <form id="auth-form">
                <input type="text" id="username" placeholder="Username" required>
                <input type="password" id="password" placeholder="Password" required>
                <button type="submit">Login</button>
            </form>
            <button id="toggle-auth">Don't have an account? Register</button>
        </div>
    `;

    document.getElementById('auth-form').addEventListener('submit', handleLogin);
    document.getElementById('toggle-auth').addEventListener('click', () => Router.navigateTo('#/register'));
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await apiRequest('auth/login', 'POST', { username, password });
        if (response && response.token) {
            localStorage.setItem('jwtToken', response.token);
            localStorage.setItem('currentUser', username);
            const userId = await getCurrentUserId();
            localStorage.setItem('currentUserId', userId);
            Router.navigateTo('#/chat');
        } else {
            showNotification('Login failed: Invalid username or password', 'error');
        }
    } catch (error) {
        console.error('Login Error:', error);
    }
}

async function getCurrentUserId() {
    const currentUser = localStorage.getItem('currentUser');
    const users = await apiRequest('users');
    const user = users.find(u => u.username === currentUser);
    return user ? user._id : null;
}
export function loadRegister() {
    document.getElementById('main-content').innerHTML = `
        <div id="auth-section">
            <h2>Register</h2>
            <form id="auth-form">
                <input type="text" id="username" placeholder="Username" required>
                <input type="password" id="password" placeholder="Password" required>
                <button type="submit">Register</button>
            </form>
            <button id="toggle-auth">Already have an account? Login</button>
        </div>
    `;
    document.getElementById('auth-form').addEventListener('submit', handleRegister);
    document.getElementById('toggle-auth').addEventListener('click', () => Router.navigateTo('#/login'));
}


async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await apiRequest('auth/register', 'POST', { username, password });
    if (response.success) {
        Router.navigateTo('#/login');
    } else {
        alert('Registration failed');
    }
}
