const AUTH_KEY = 'nova_admin_session';

function getAdminCredentials() {
    const u = atob('Tm92YXN0cmVhbTEyeXkhISFycnI=');
    const p = atob('Tm92YXN0cmVhbTEyeSEhIWVlZQ==');
    return { user: u, pass: p };
}

function login(username, password) {
    const { user, pass } = getAdminCredentials();
    if (username === user && password === pass) {
        sessionStorage.setItem(AUTH_KEY, JSON.stringify({ loggedIn: true, at: Date.now() }));
        return true;
    }
    return false;
}

function logout() {
    sessionStorage.removeItem(AUTH_KEY);
}

function isLoggedIn() {
    const session = sessionStorage.getItem(AUTH_KEY);
    if (!session) return false;
    try {
        const data = JSON.parse(session);
        return data.loggedIn === true;
    } catch (e) {}
    return false;
}
