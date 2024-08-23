const API_BASE_URL = 'http://localhost:3000/api/';
let jwtToken = localStorage.getItem('jwtToken');
let currentUser = localStorage.getItem('currentUser');
let recentlySentMessageIds = new Set();

// DOM Elements
const elements = {
    loadingScreen: document.getElementById('loading-screen'),
    authSection: document.getElementById('auth-section'),
    chatSection: document.getElementById('chat-section'),
    userSettingsSection: document.getElementById('user-settings'),
    authForm: document.getElementById('auth-form'),
    toggleAuthBtn: document.getElementById('toggle-auth'),
    authTitle: document.getElementById('auth-title'),
    messageForm: document.getElementById('message-form'),
    messageInput: document.getElementById('message-input'),
    chatMessages: document.getElementById('chat-messages'),
    logoutBtn: document.getElementById('logout-btn'),
    passwordUpdateForm: document.getElementById('password-update-form'),
    deleteUserBtn: document.getElementById('delete-user-btn'),
    backToChatBtn: document.getElementById('back-to-chat'),
    notificationContainer: document.getElementById('notification-container'),
};

// Authentication State
let isRegistering = false;

// Utility function for API calls
async function apiRequest(endpoint, method = 'GET', body = null) {
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwtToken}`,
        },
    };
    if (body) options.body = JSON.stringify(body);
    try {
        const response = await fetch(API_BASE_URL + endpoint, options);
        return await response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        return null;
    }
}

// Show/Hide Sections
function showSection(sectionToShow) {
    elements.loadingScreen.classList.add('hidden');
    [elements.authSection, elements.chatSection, elements.userSettingsSection].forEach(section => section.classList.add('hidden'));
    sectionToShow.classList.remove('hidden');
}

// Fetch users and set the current user's ID in localStorage
async function fetchUsersAndSetUserId() {
    const currentUser = localStorage.getItem('currentUser'); // Get the username from localStorage

    try {
        const response = await fetch(`${API_BASE_URL}users`, {
            headers: {
                Authorization: `Bearer ${jwtToken}`,
            },
        });

        if (response.ok) {
            const users = await response.json();
            // Find the user whose username matches the current user
            const currentUserData = users.find(user => user.username === currentUser);

            if (currentUserData && currentUserData._id) {
                localStorage.setItem('currentUserId', currentUserData._id); // Store user ID in localStorage
            } else {
                console.error('Current user not found in user list.');
            }
        } else {
            console.error('Failed to fetch users.');
        }
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

function showAuthSection() {
    elements.loadingScreen.classList.add('hidden');
    elements.authSection.classList.remove('hidden');
}
// Initial App Load
document.addEventListener('DOMContentLoaded', async () => {
    if (jwtToken) {
        await fetchUsersAndSetUserId(); // Ensure user ID is set on initial load if logged in
        await loadChat();
    } else {
        showAuthSection();
    }
});

// Handle Authentication (Login/Register)
elements.authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const endpoint = isRegistering ? 'auth/register' : 'auth/login';
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (data.token) {
            localStorage.setItem('jwtToken', data.token);
            jwtToken = data.token;
            currentUser = username;
            localStorage.setItem('currentUser', currentUser); // Store username in localStorage

            // Fetch users and set the current user ID
            await fetchUsersAndSetUserId();

            await loadChat();
        }
        

        if (isRegistering && data.success) {
            setLoginPage();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
});
// Toggle between Login and Register

async function setLoginPage() {
    isRegistering = !isRegistering;
    elements.authTitle.innerText = isRegistering ? 'Register' : 'Login';
    elements.toggleAuthBtn.innerText = isRegistering ? 'Already have an account? Login' : 'Don’t have an account? Register';
}

elements.toggleAuthBtn.addEventListener('click', () => {
    setLoginPage();
});

// Load Chat Section
async function loadChat() {
    showSection(elements.loadingScreen);
    const messages = await apiRequest('messages');
    if (messages) {
        renderMessages(messages);
        setupWebSocket();
        showSection(elements.chatSection);
    }
}

// Render Messages in the Chat
function renderMessages(messages) {
    elements.chatMessages.innerHTML = messages.map(renderMessage).join('');
}

// Render a Single Message
function renderMessage(message) {
    const isCurrentUser = message.username === currentUser;
    const messageClass = isCurrentUser ? 'message-right' : 'message-left';
    return `
        <div class="message ${messageClass}" data-id="${message._id}">
            <strong>${message.username}:</strong> ${message.message}
            ${isCurrentUser ? renderMessageActions(message._id) : ''}
        </div>
    `;
}

// Render Action Buttons for Current User's Messages
function renderMessageActions(messageId) {
    return `
        <button onclick="editMessage('${messageId}')">Edit</button>
        <button onclick="deleteMessage('${messageId}')">Delete</button>
    `;
}

// Send Message
elements.messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = elements.messageInput.value.trim();
    
    if (!message) return;

    const newMessage = await apiRequest('messages', 'POST', { message });
    
    if (newMessage) {
        recentlySentMessageIds.add(newMessage._id);
        elements.messageInput.value = '';
        renderMessages([newMessage]);
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }
});

// Edit Message
async function editMessage(messageId) {
    const newMessage = prompt('Edit your message:');
    if (newMessage) {
        const updated = await apiRequest(`messages/${messageId}`, 'PUT', { message: newMessage });
        if (updated) updateMessageInDOM(updated);
    }
}

// Delete Message
async function deleteMessage(messageId) {
    if (confirm('Are you sure you want to delete this message?')) {
        const deleted = await apiRequest(`messages/${messageId}`, 'DELETE');
        if (deleted) deleteMessageInDOM(messageId);
    }
}

// Update Message in DOM
function updateMessageInDOM(message) {
    const messageElement = document.querySelector(`.message[data-id='${message._id}']`);
    if (messageElement) {
        messageElement.innerHTML = `
            <strong>${message.username}:</strong> ${message.message} 
            ${message.username === currentUser ? renderMessageActions(message._id) : ''}
        `;
    }
}

// Delete Message from DOM
function deleteMessageInDOM(messageId) {
    const messageElement = document.querySelector(`.message[data-id='${messageId}']`);
    if (messageElement) messageElement.remove();
}

// Logout
// Logout (Clear the stored user ID)
elements.logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserId'); // Clear the user ID as well
    jwtToken = null;
    currentUser = null;

    window.location.reload(); // Reload to reset the state
});

// elements.logoutBtn.addEventListener('click', () => {
//     localStorage.removeItem('jwtToken');
//     localStorage.removeItem('currentUser');
//     jwtToken = null;
//     currentUser = null;
//     window.location.reload();
// });

// Update User Password
elements.passwordUpdateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('new-password').value;

    const response = await apiRequest('users/' + localStorage.getItem('currentUserId'), 'PUT', { password: newPassword });
    if (response) alert('Password updated successfully');
    document.getElementById('new-password').value = '';
});

// Delete User Account
elements.deleteUserBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        const deleted = await apiRequest('users/' + localStorage.getItem('currentUserId'), 'DELETE');
        if (deleted) elements.logoutBtn.click();
    }
});

// Back to Chat from User Settings
elements.backToChatBtn.addEventListener('click', () => {
    showSection(elements.chatSection);
});

// Show User Settings
document.getElementById('user-settings-btn').addEventListener('click', () => {
    showSection(elements.userSettingsSection);
});
