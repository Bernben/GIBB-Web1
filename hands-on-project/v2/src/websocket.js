import { config } from './config.js';

let socket = null;
let loginNotificationShown = false; // Flag to prevent multiple login notifications

export function setupWebSocket(onNewMessage) {
    if (typeof onNewMessage !== 'function') {
        throw new Error('onNewMessage must be a function');
    }

    // If the WebSocket is already initialized, don't create a new one
    if (socket) {
        return;
    }

    socket = new WebSocket(config.WEBSOCKET_URL);

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
            case 'new_message':
                onNewMessage(data.data); // Pass the new message to the callback
                break;
            case 'changed_message':
                handleChangedMessage(data.data);
                break;
            case 'deleted_message':
                handleDeletedMessage(data.data._id);
                break;
            case 'new_login':
                if (!loginNotificationShown && data.data.username === localStorage.getItem('currentUser')) {
                    showNotification(`You have logged in successfully`, 'info');
                    loginNotificationShown = true;
                } else if (data.data.username !== localStorage.getItem('currentUser')) {
                    showNotification(`${data.data.username} has logged in.`, 'info');
                }
                break;
            case 'changed_user':
                showNotification(`${data.data.username} updated their profile.`, 'info');
                break;
            case 'deleted_user':
                showNotification(`${data.data.username} has deleted their account.`, 'info');
                break;
            default:
                break;
        }
    };

    socket.onclose = () => {
        socket = null; // Reset socket to allow re-initialization if needed
    };
}

function handleChangedMessage(message) {
    const messageElement = document.querySelector(`.message[data-id='${message._id}']`);
    if (messageElement) {
        messageElement.innerHTML = `<strong>${message.username}:</strong> ${message.message}`;
    }
}

function handleDeletedMessage(messageId) {
    const messageElement = document.querySelector(`.message[data-id='${messageId}']`);
    if (messageElement) {
        messageElement.remove();
    }
}

export function showNotification(message, type = 'info') {
    const notificationContainer = document.getElementById('notification-container');
    const notificationElement = document.createElement('div');
    notificationElement.className = `notification ${type}`;
    notificationElement.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    notificationContainer.appendChild(notificationElement);

    setTimeout(() => notificationElement.remove(), 5000);
}
