// 1. CEK LOGIN
const username = localStorage.getItem('user_sig');
if (!username) {
    window.location.href = 'index.html';
} else {
    document.getElementById('userNameDisplay').innerText = username;
}

// 2. INISIALISASI PETA
// Set view ke Bandung (sesuai kodingan lamamu)
const map = L.map("map").setView([-6.914744, 107.60981], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Referensi ke HTML List
const coordinateList = document.getElementById("coordinateList");

// --- FUNGSI BANTUAN ---

// Fungsi: Menambahkan Item ke Sidebar (Panel Kiri)
function addToList(data) {
    // Cek apakah list masih berisi "Belum ada titik..."
    if (coordinateList.querySelector('p')) {
        coordinateList.innerHTML = ""; // Bersihkan pesan kosong
    }

    const item = document.createElement("div");
    item.classList.add("coord-item");
    
    // Isi konten list
    item.innerHTML = `
        <strong>${data.nama}</strong>
        <span>Lat: ${data.latitude.toFixed(5)}</span><br>
        <span>Lng: ${data.longitude.toFixed(5)}</span>
    `;

    // (Opsional) Klik item di list -> Peta zoom ke lokasi
    item.addEventListener('click', () => {
        map.setView([data.latitude, data.longitude], 16);
    });

    // Masukkan ke paling atas (prepend)
    coordinateList.prepend(item);
}

// Fungsi: Menambahkan Marker ke Peta
function addMarker(data) {
    L.marker([data.latitude, data.longitude])
        .addTo(map)
        .bindPopup(`<b>${data.nama}</b><br>Lat: ${data.latitude}<br>Lng: ${data.longitude}`);
}

// 3. LOAD DATA DARI BACKEND (Database)
async function loadLocations() {
    try {
        const response = await fetch(' https://bonnily-profanatory-jordynn.ngrok-free.dev/api/map');
        const data = await response.json();

        // Bersihkan list dulu
        coordinateList.innerHTML = "";

        if (data.length === 0) {
            coordinateList.innerHTML = "<p style='text-align:center; color:#888;'>Belum ada lokasi tersimpan.</p>";
            return;
        }

        // Loop data dari database
        data.forEach(item => {
            addMarker(item); // Taruh di Peta
            addToList(item); // Taruh di List Kiri
        });

    } catch (error) {
        console.error(error);
        coordinateList.innerHTML = "<p style='color:red; text-align:center;'>Gagal mengambil data dari server.</p>";
    }
}

// Panggil saat pertama buka
loadLocations();

// 4. INTERAKSI: KLIK PETA UNTUK TAMBAH DATA
let tempMarker = null;

map.on("click", function (e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    // Hapus marker sementara sebelumnya
    if (tempMarker) map.removeLayer(tempMarker);

    // Isi Popup dengan Form Input Nama
    const popupContent = `
        <div class="popup-header">Simpan Lokasi Ini?</div>
        <input type="text" id="inputNama" class="popup-input" placeholder="Nama tempat..." autocomplete="off">
        <button onclick="simpanKeDatabase(${lat}, ${lng})" class="btn-save">Simpan Data</button>
    `;

    tempMarker = L.popup()
        .setLatLng([lat, lng])
        .setContent(popupContent)
        .openOn(map);
});

// 5. FUNGSI SIMPAN (Dipanggil tombol di Popup)
window.simpanKeDatabase = async function(lat, lng) {
    const namaInput = document.getElementById('inputNama').value;

    if (!namaInput) {
        alert("Nama lokasi harus diisi!");
        return;
    }

    const dataBaru = {
        nama: namaInput,
        latitude: lat,
        longitude: lng
    };

    try {
        // Kirim ke Backend Golang
        const response = await fetch('https://muflihafif004.github.io/SIG/map.html', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataBaru)
        });

        if (response.ok) {
            map.closePopup(); // Tutup popup input
            
            // Tambahkan visual langsung (tanpa reload)
            addMarker(dataBaru);
            addToList(dataBaru);
            
            alert("✅ Data berhasil disimpan ke Database!");
        } else {
            alert("Gagal menyimpan data.");
        }
    } catch (error) {
        console.error(error);
        alert("Error koneksi ke server.");
    }
};

// 6. LOGOUT
document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('user_sig');
    window.location.href = 'index.html';
});