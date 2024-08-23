import { apiRequest } from '../utils.js';
import { Router } from '../router.js';

export function loadSettings() {
    document.getElementById('main-content').innerHTML = `
        <div id="user-settings">
            <h2>User Settings</h2>
            <form id="password-update-form">
                <input type="password" id="new-password" placeholder="New Password" required>
                <button type="submit">Update Password</button>
            </form>
            <button id="delete-user-btn">Delete Account</button>
            <button id="back-to-chat">Back to Chat</button>
        </div>
    `;

    document.getElementById('password-update-form').addEventListener('submit', updatePassword);
    document.getElementById('delete-user-btn').addEventListener('click', deleteUser);
    document.getElementById('back-to-chat').addEventListener('click', () => Router.navigateTo('#/chat'));
}

async function updatePassword(e) {
    e.preventDefault();
    const newPassword = document.getElementById('new-password').value;
    const response = await apiRequest('users/' + localStorage.getItem('currentUserId'), 'PUT', { password: newPassword });
    if (response) alert('Password updated successfully');
}

async function deleteUser() {
    if (confirm('Are you sure you want to delete your account?')) {
        const deleted = await apiRequest('users/' + localStorage.getItem('currentUserId'), 'DELETE');
        if (deleted) Router.navigateTo('#/login');
    }
}
