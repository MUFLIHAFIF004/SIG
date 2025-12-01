const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const usernameError = document.getElementById('usernameError');
const passwordError = document.getElementById('passwordError');
const btn = document.querySelector('button');

// Fungsi Reset Error
function clearErrors() {
    usernameError.innerText = "";
    passwordError.innerText = "";
    usernameInput.classList.remove('input-error');
    passwordInput.classList.remove('input-error');
}

// Fungsi Tampilkan Error
function showError(inputElement, errorElement, message) {
    errorElement.innerText = message;
    inputElement.classList.add('input-error');
}

// Event saat tombol Daftar diklik
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    let isValid = true;

    // 1. VALIDASI FRONTEND (Cek Kosong)
    if (!username) {
        showError(usernameInput, usernameError, "Username wajib diisi!");
        isValid = false;
    } else if (username.length < 3) {
        // Validasi tambahan: Minimal 3 huruf
        showError(usernameInput, usernameError, "Username minimal 3 karakter!");
        isValid = false;
    }

    if (!password) {
        showError(passwordInput, passwordError, "Password wajib diisi!");
        isValid = false;
    } else if (password.length < 4) {
        // Validasi tambahan: Password jangan terlalu pendek
        showError(passwordInput, passwordError, "Password minimal 4 karakter!");
        isValid = false;
    }

    if (!isValid) return; // Stop kalau ada yang salah

    // 2. KIRIM KE BACKEND
    const originalBtnText = btn.innerText;
    btn.innerText = "Mendaftarkan...";
    btn.disabled = true;

    try {
        const response = await fetch('https://muflihafif004.github.io/SIG/register.html', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (response.ok) {
            // SUKSES DAFTAR
            alert("✅ Registrasi Berhasil! Silakan Login.");
            window.location.href = 'index.html'; // Pindah ke Login
        } else {
            // GAGAL (Misal: Username sudah dipakai)
            if (result.message.includes("Username")) {
                showError(usernameInput, usernameError, result.message);
            } else {
                showError(passwordInput, passwordError, result.message || "Gagal mendaftar");
            }
        }

    } catch (error) {
        console.error(error);
        showError(passwordInput, passwordError, "Gagal terhubung ke server!");
    } finally {
        btn.innerText = originalBtnText;
        btn.disabled = false;
    }
});

// Hapus error saat mengetik
usernameInput.addEventListener('input', () => {
    usernameError.innerText = "";
    usernameInput.classList.remove('input-error');
});
passwordInput.addEventListener('input', () => {
    passwordError.innerText = "";
    passwordInput.classList.remove('input-error');
});