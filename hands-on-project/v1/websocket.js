
// WebSocket Notifications
function showNotification(message) {
    const notificationElement = document.createElement('div');
    notificationElement.className = 'notification';
    notificationElement.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    elements.notificationContainer.appendChild(notificationElement);

    setTimeout(() => notificationElement.remove(), 5000);
}


function setupWebSocket() {
    const socket = new WebSocket('ws://localhost:3000');
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
            case 'new_message':
                if (!recentlySentMessageIds.has(data.data._id)) {
                    renderMessages([data.data]);
                    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
                }
                break;
            case 'changed_message':
                updateMessageInDOM(data.data);
                break;
            case 'deleted_message':
                deleteMessageInDOM(data.data._id);
                break;
            case 'new_login':
                showNotification(`${data.data.username} has logged in.`);
                break;
            case 'changed_user':
                showNotification(`${data.data.username} updated their profile.`);
                break;
            case 'deleted_user':
                showNotification(`${data.data.username} has deleted their account.`);
                break;
            default:
                break;
        }
    };
}


// Update message in DOM for changed_message event
function updateMessageInDOM(message) {
    const messageElement = document.querySelector(`.message[data-id='${message._id}']`);
    if (messageElement) {
        messageElement.innerHTML = `<strong>${message.username}:</strong> ${message.message} ${message.username === currentUser ? renderMessageActions(message._id) : ''}`;
    }
}

// Delete message from DOM for deleted_message event
function deleteMessageInDOM(messageId) {
    const messageElement = document.querySelector(`.message[data-id='${messageId}']`);
    if (messageElement) {
        messageElement.remove();
    }
}
