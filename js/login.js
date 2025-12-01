// Cek Login Session
if(localStorage.getItem('user_sig')) {
    window.location.href = 'map.html';
}

const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const usernameError = document.getElementById('usernameError');
const passwordError = document.getElementById('passwordError');
const btn = document.querySelector('button');

// Fungsi Reset Error (Hapus merah-merah)
function clearErrors() {
    usernameError.innerText = "";
    passwordError.innerText = "";
    usernameInput.classList.remove('input-error');
    passwordInput.classList.remove('input-error');
}

// Fungsi Tampilkan Error di spesifik kolom
function showError(inputElement, errorElement, message) {
    errorElement.innerText = message;
    inputElement.classList.add('input-error');
}

// Event saat tombol diklik
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors(); // Bersihkan error lama dulu

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    let isValid = true;

    // 1. VALIDASI FRONTEND (Cek Kosong)
    if (!username) {
        showError(usernameInput, usernameError, "Username wajib diisi!");
        isValid = false;
    }

    if (!password) {
        showError(passwordInput, passwordError, "Password wajib diisi!");
        isValid = false;
    }

    // Kalau ada yang kosong, stop di sini. Jangan kirim ke server.
    if (!isValid) return;

    // 2. KIRIM KE BACKEND
    const originalBtnText = btn.innerText;
    btn.innerText = "Memproses...";
    btn.disabled = true;

    try {
        const response = await fetch('https://bonnily-profanatory-jordynn.ngrok-free.dev/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (response.ok) {
            // SUKSES
            localStorage.setItem('user_sig', result.username);
            window.location.href = 'map.html';
        } else {
            // GAGAL (Password/Username Salah dari Server)
            // Tampilkan pesan error dari Golang di bawah password
            showError(passwordInput, passwordError, result.message || "Login gagal");
            
            // Opsional: Merahkan username juga kalau mau
            usernameInput.classList.add('input-error');
        }

    } catch (error) {
        console.error(error);
        showError(passwordInput, passwordError, "Gagal terhubung ke server!");
    } finally {
        // Kembalikan tombol seperti semula
        btn.innerText = originalBtnText;
        btn.disabled = false;
    }
});

// Fitur Tambahan: Hapus error saat user mulai mengetik ulang
usernameInput.addEventListener('input', () => {
    usernameError.innerText = "";
    usernameInput.classList.remove('input-error');
});
passwordInput.addEventListener('input', () => {
    passwordError.innerText = "";
    passwordInput.classList.remove('input-error');
});