// Simple password protection
// Password is hashed to prevent casual viewing in source code
// This is NOT secure for sensitive data, but works for preventing bots/crawlers

(function() {
    'use strict';

    // SHA-256 hash of the password
    // Current password: "3ls3wh3r3" (change this by generating a new hash)
    const PASSWORD_HASH = '355cf750e11efa1f1fa3446a058643a25f55002e806196d7267186c73e6233ec';

    // Session storage key
    const AUTH_KEY = 'elsewhere_auth';

    // Check if already authenticated
    if (sessionStorage.getItem(AUTH_KEY) === 'true') {
        return; // Already authenticated, show content
    }

    // Hide content immediately with inline style on html element
    document.documentElement.style.cssText = 'overflow: hidden !important;';

    // Wait for DOM to be ready
    if (document.body) {
        showPasswordPrompt();
    } else {
        document.addEventListener('DOMContentLoaded', showPasswordPrompt);
    }

    function showPasswordPrompt() {
        // Hide all body content visually but keep it in DOM for scripts to work
        document.body.style.visibility = 'hidden';
        document.body.style.opacity = '0';

        // Create password overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #F3EFE9;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            font-family: 'Suisse Intl', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        `;

        overlay.innerHTML = `
            <div style="background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(10px); padding: 3rem; border: 1px solid rgba(214, 179, 112, 0.15); border-radius: 0; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08); max-width: 400px; width: 90%;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h1 style="margin: 0 0 0.5rem 0; font-size: 2.2rem; color: #2C2C2C; font-weight: 500; text-transform: lowercase; letter-spacing: 0;">elsewhere collective</h1>
                    <p style="margin: 0; color: #2C2C2C; font-size: 0.95rem; opacity: 0.7;">Enter password to continue</p>
                </div>
                <form id="passwordForm">
                    <input
                        type="email"
                        id="emailInput"
                        name="username"
                        placeholder="Email"
                        autocomplete="username"
                        value="alex@elsewherecollective.nl"
                        readonly
                        style="
                            width: 100%;
                            padding: 1rem;
                            border: 1px solid rgba(214, 179, 112, 0.3);
                            border-radius: 0;
                            font-size: 1rem;
                            font-family: 'Suisse Intl', sans-serif;
                            box-sizing: border-box;
                            margin-bottom: 1rem;
                            background: rgba(255, 255, 255, 0.4);
                            color: #2C2C2C;
                            opacity: 0.8;
                        "
                    />
                    <input
                        type="password"
                        id="passwordInput"
                        name="password"
                        placeholder="Password"
                        autocomplete="current-password"
                        style="
                            width: 100%;
                            padding: 1rem;
                            border: 1px solid rgba(214, 179, 112, 0.3);
                            border-radius: 0;
                            font-size: 1rem;
                            font-family: 'Suisse Intl', sans-serif;
                            box-sizing: border-box;
                            margin-bottom: 1rem;
                            transition: border-color 0.3s;
                            background: rgba(255, 255, 255, 0.8);
                            color: #2C2C2C;
                        "
                        onfocus="this.style.borderColor='#D6B370'"
                        onblur="this.style.borderColor='rgba(214, 179, 112, 0.3)'"
                    />
                    <button
                        type="submit"
                        id="submitBtn"
                        style="
                            width: 100%;
                            padding: 1rem;
                            background: #2C2C2C;
                            color: #F3EFE9;
                            border: none;
                            border-radius: 0;
                            font-size: 1rem;
                            font-weight: 500;
                            font-family: 'Suisse Intl', sans-serif;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        "
                        onmouseover="this.style.background='#D6B370'; this.style.color='#2C2C2C';"
                        onmouseout="this.style.background='#2C2C2C'; this.style.color='#F3EFE9';"
                    >
                        Enter
                    </button>
                    <div id="errorMessage" style="color: #95392E; margin-top: 1rem; text-align: center; font-size: 0.9rem; display: none;"></div>
                </form>
            </div>
        `;

        document.documentElement.appendChild(overlay);

        // Focus input
        setTimeout(() => {
            const input = document.getElementById('passwordInput');
            if (input) input.focus();
        }, 100);

        // Handle form submission
        const form = document.getElementById('passwordForm');
        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                const input = document.getElementById('passwordInput');
                const error = document.getElementById('errorMessage');
                const password = input.value;

                // Hash the password
                const hash = await hashPassword(password);

                if (hash === PASSWORD_HASH) {
                    // Correct password
                    sessionStorage.setItem(AUTH_KEY, 'true');
                    overlay.remove();
                    document.body.style.visibility = 'visible';
                    document.body.style.opacity = '1';
                    document.documentElement.style.cssText = '';
                } else {
                    // Wrong password
                    error.textContent = 'Incorrect password';
                    error.style.display = 'block';
                    input.value = '';
                    input.focus();

                    // Shake animation
                    input.style.animation = 'shake 0.5s';
                    setTimeout(() => {
                        input.style.animation = '';
                    }, 500);
                }
            });
        }

        // Add shake animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
                20%, 40%, 60%, 80% { transform: translateX(10px); }
            }
        `;
        document.head.appendChild(style);
    }

    // Simple SHA-256 hash function
    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }
})();
