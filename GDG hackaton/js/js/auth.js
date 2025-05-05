
document.addEventListener('DOMContentLoaded', function () {
    const authModal = document.getElementById('authModal');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authToggle = document.querySelectorAll('.auth-toggle');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginBtn = document.getElementById('loginBtn');
    const userAvatar = document.getElementById('userAvatar');
    const closeModal = document.querySelector('.close-modal');

    function checkAuth() {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (user) {
            userAvatar.textContent = user.name.charAt(0).toUpperCase();
            userAvatar.style.display = 'flex';
            logoutBtn.style.display = 'block';
            loginBtn.style.display = 'none';
        } else {
            userAvatar.style.display = 'none';
            logoutBtn.style.display = 'none';
            loginBtn.style.display = 'block';
        }
    }

    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const email = this.querySelector('#loginEmail').value;
            const password = this.querySelector('#loginPassword').value;
            console.log('Login attempt:', { email, password });

            const users = JSON.parse(localStorage.getItem('users')) || [];
            console.log('Registered users:', users);

            if (users.length === 0) {
                showNotification('No registered users found. Please register first.', 'error');
                return;
            }

            const user = users.find(u => u.email === email && u.password === password);
            console.log('Matching user:', user);

            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                checkAuth();
                authModal.classList.remove('show');
                showNotification('Login successful!', 'success');
            } else {
                showNotification('Invalid email or password', 'error');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const name = this.querySelector('#registerName').value;
            const email = this.querySelector('#registerEmail').value;
            const password = this.querySelector('#registerPassword').value;
            let users = JSON.parse(localStorage.getItem('users')) || [];
            if (users.some(u => u.email === email)) {
                showNotification('Email already registered', 'error');
                return;
            }
            const newUser = { id: Date.now(), name, email, password };
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify(newUser));
            checkAuth();
            authModal.classList.remove('show');
            showNotification('Registration successful!', 'success');
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            localStorage.removeItem('currentUser');
            checkAuth();
            showNotification('Logged out successfully', 'success');
        });
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', function () {
            authModal.classList.add('show');
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', function () {
            authModal.classList.remove('show');
        });
    }

    authModal.addEventListener('click', function (e) {
        if (e.target === authModal) {
            authModal.classList.remove('show');
        }
    });

    authToggle.forEach(toggle => {
        toggle.addEventListener('click', function () {
            if (loginForm.style.display === 'none') {
                loginForm.style.display = 'block';
                registerForm.style.display = 'none';
            } else {
                loginForm.style.display = 'none';
                registerForm.style.display = 'block';
            }
        });
    });

    checkAuth();
});

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}