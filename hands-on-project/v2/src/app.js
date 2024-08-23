import { Router } from './router.js';

document.addEventListener('DOMContentLoaded', async () => {
    Router.init();
   
    // If authenticated, navigate to chat
    const jwtToken = localStorage.getItem('jwtToken');
    if (jwtToken) {
        Router.navigateTo('#/chat');
    } else {
        Router.navigateTo('#/login');
    }
});
