// --- KONFIGURASI API ---
const API_URL = "https://bonnily-profanatory-jordynn.ngrok-free.dev";

// Cek Login Session
if(localStorage.getItem('user_sig')) {
    window.location.href = 'map.html';
}

const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const usernameError = document.getElementById('usernameError');
const passwordError = document.getElementById('passwordError');
const btn = document.querySelector('button');

function clearErrors() {
    usernameError.innerText = "";
    passwordError.innerText = "";
    usernameInput.classList.remove('input-error');
    passwordInput.classList.remove('input-error');
}

function showError(inputElement, errorElement, message) {
    errorElement.innerText = message;
    inputElement.classList.add('input-error');
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    let isValid = true;

    if (!username) { showError(usernameInput, usernameError, "Username wajib diisi!"); isValid = false; }
    if (!password) { showError(passwordInput, passwordError, "Password wajib diisi!"); isValid = false; }
    if (!isValid) return;

    const originalBtnText = btn.innerText;
    btn.innerText = "Memproses...";
    btn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                "ngrok-skip-browser-warning": "true" 
            },
            body: JSON.stringify({ username, password })
        });

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Respon bukan JSON. Cek URL Backend.");
        }

        const result = await response.json();

        if (response.ok) {
            localStorage.setItem('user_sig', result.username);
            window.location.href = 'map.html';
        } else {
            showError(passwordInput, passwordError, result.message || "Login gagal");
        }

    } catch (error) {
        console.error("Error Detail:", error);
        
        // --- VALIDASI POPUP SERVER MATI (Di sini letaknya) ---
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
            alert("⚠️ KONEKSI GAGAL!\n\nServer Backend tidak dapat dijangkau.\n\nPastikan:\n1. Laptop Developer menyala\n2. Terminal 'go run main.go' aktif\n3. Terminal 'ngrok' aktif");
        } else {
            showError(passwordInput, passwordError, "Gagal koneksi ke server.");
        }

    } finally {
        btn.innerText = originalBtnText;
        btn.disabled = false;
    }
});

usernameInput.addEventListener('input', () => { usernameError.innerText = ""; usernameInput.classList.remove('input-error'); });
passwordInput.addEventListener('input', () => { passwordError.innerText = ""; passwordInput.classList.remove('input-error'); });