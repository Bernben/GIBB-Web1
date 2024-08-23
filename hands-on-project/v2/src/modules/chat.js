import { apiRequest } from '../utils.js';
import { Router } from '../router.js';
import { setupWebSocket, showNotification } from '../websocket.js';

let messages = []; // Store all messages in memory

export async function loadChat() {
    document.getElementById('main-content').innerHTML = `
        <div id="loading-screen" class="loading">
            <h2>Loading...</h2>
        </div>
        <div id="chat-section" class="hidden">
            <button id="logout-btn">Logout</button>
            <button id="user-settings-btn">Update</button>
            <div id="chat-messages"></div>
            <form id="message-form">
                <input type="text" id="message-input" placeholder="Type a message..." required>
                <button type="submit">Send</button>
            </form>
        </div>
    `;

    // Fetch initial messages
    messages = await apiRequest('messages');
    if (messages) {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('chat-section').classList.remove('hidden');
        renderMessages(messages);
        setupWebSocket(handleNewMessage); // Initialize WebSocket once
    } else {
        showNotification('Failed to load chat messages.', 'error');
    }

    document.getElementById('message-form').addEventListener('submit', sendMessage);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    document.getElementById('user-settings-btn').addEventListener('click', () => Router.navigateTo('#/settings'));
}

function renderMessages(messagesToRender) {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = '';
    messagesToRender.forEach(renderMessage); // Render each message
    scrollToBottom(); // Scroll to the latest message
}

function renderMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    const isCurrentUser = message.username === localStorage.getItem('currentUser');
    const messageClass = isCurrentUser ? 'message-right' : 'message-left';
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${messageClass}`;
    messageElement.setAttribute('data-id', message._id);
    messageElement.innerHTML = `
        <strong>${message.username}:</strong> ${message.message}
        ${isCurrentUser ? renderMessageActions(message._id) : ''}
    `;
    
    chatMessages.appendChild(messageElement);
    scrollToBottom(); // Ensure the new message is visible
}

function renderMessageActions(messageId) {
    return `
        <button onclick="editMessage('${messageId}')">Edit</button>
        <button onclick="deleteMessage('${messageId}')">Delete</button>
    `;
}

async function sendMessage(e) {
    e.preventDefault();
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    if (!message) return;

    const newMessage = await apiRequest('messages', 'POST', { message });
    if (newMessage) {
        handleNewMessage(newMessage); // This will render the message and add edit/delete options
    }
    messageInput.value = ''; // Clear the input field
}

function handleNewMessage(message) {
    if (!messages.some(m => m._id === message._id)) {
        messages.push(message); // Add the new message to the list
        renderMessage(message); // Render the new message
    }
}

window.editMessage = async function editMessage(messageId) {
    const newMessage = prompt('Edit your message:');
    if (newMessage) {
        const updatedMessage = await apiRequest(`messages/${messageId}`, 'PUT', { message: newMessage });
        if (updatedMessage) {
            // UI update will be handled via WebSocket broadcast
            showNotification('Message updated successfully', 'info');
        }
    }
}

window.deleteMessage = async function deleteMessage(messageId) {
    if (confirm('Are you sure you want to delete this message?')) {
        const deletedMessage = await apiRequest(`messages/${messageId}`, 'DELETE');
        if (deletedMessage) {
            // UI update will be handled via WebSocket broadcast
            showNotification('Message deleted successfully', 'info');
        }
    }
}

function scrollToBottom() {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleLogout() {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('currentUser');
    Router.navigateTo('#/login');
}
