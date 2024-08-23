import { showNotification } from './websocket.js';
import { config } from './config.js';

export async function apiRequest(endpoint, method = 'GET', body = null) {
    const jwtToken = localStorage.getItem('jwtToken');
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwtToken}`,
        },
    };
    if (body) options.body = JSON.stringify(body);

    try {
        const response = await fetch(`${config.API_BASE_URL}/${endpoint}`, options);
        if (!response.ok) {
            const errorData = await response.json();
            showNotification(`Error: ${errorData.error || 'An error occurred'}`, 'error');
            throw new Error(`API request failed: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        showNotification('An unexpected error occurred. Please try again.', 'error');
        return null;
    }
}
