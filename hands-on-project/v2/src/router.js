import { loadLogin, loadRegister } from './modules/auth.js';
import { loadChat } from './modules/chat.js';
import { loadSettings } from './modules/settings.js';

export const Router = {
    routes: {
        '#/login': loadLogin,
        '#/register': loadRegister,
        '#/chat': loadChat,
        '#/settings': loadSettings,
    },

    init() {
        window.addEventListener('hashchange', () => this.handleRouteChange());
        this.handleRouteChange(); // Handle initial route
    },

    handleRouteChange() {
        const { hash } = window.location;
        const routeHandler = this.routes[hash];
        if (routeHandler) {
            routeHandler();
        } else {
            window.location.hash = '#/login';
        }
    },

    navigateTo(hash) {
        window.location.hash = hash;
    }
};
