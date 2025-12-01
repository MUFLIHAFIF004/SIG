// --- KONFIGURASI ---
// GANTI DENGAN LINK NGROK KAMU YANG BARU:
const API_URL = "https://bonnily-profanatory-jordynn.ngrok-free.dev/api/map"; 

// 1. CEK LOGIN
const username = localStorage.getItem('user_sig');
if (!username) {
    window.location.href = 'index.html';
} else {
    document.getElementById('userNameDisplay').innerText = username;
}

// 2. INISIALISASI MAP
const map = L.map("map").setView([-6.914744, 107.60981], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const coordinateList = document.getElementById("coordinateList");
let markers = {}; 

// --- FUNGSI TAMPILKAN LIST ---
function addToList(data) {
    // Bersihkan pesan kosong
    const emptyMsg = coordinateList.querySelector('p');
    if (emptyMsg) emptyMsg.remove();

    // Cek apakah item sudah ada? Kalau ada, kita update isinya saja (biar ga dobel)
    let item = document.getElementById(`item-${data.id}`);
    
    // HTML Konten List
    const contentHTML = `
        <div>
            <strong id="nama-${data.id}">${data.nama}</strong><br>
            <span id="pos-${data.id}" style="font-size:0.8rem; color:#ccc;">
                Lat: ${data.latitude.toFixed(5)}<br>
                Lng: ${data.longitude.toFixed(5)}
            </span>
        </div>
        <div style="margin-top:10px;">
            <button onclick="editLokasi('${data.id}')" style="background:#f59e0b; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer;">Edit Nama</button>
            <button onclick="hapusLokasi('${data.id}')" style="background:#ef4444; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer;">Hapus</button>
            <button onclick="zoomKe('${data.id}')" style="background:#3b82f6; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer;">Lihat</button>
        </div>
    `;

    if (item) {
        // Update item lama
        item.innerHTML = contentHTML;
    } else {
        // Buat item baru
        item = document.createElement("div");
        item.classList.add("coord-item");
        item.id = `item-${data.id}`;
        item.innerHTML = contentHTML;
        coordinateList.prepend(item);
    }
}

// --- FUNGSI TAMBAH MARKER KE PETA (DRAGGABLE) ---
function addMarkerToMap(data) {
    // 1. Buat Marker dengan opsi draggable: true
    const marker = L.marker([data.latitude, data.longitude], {
        draggable: true, // <--- INI KUNCINYA BIAR BISA DIGESER
        autoPan: true
    })
    .addTo(map)
    .bindPopup(`<b>${data.nama}</b><br><small>Geser untuk pindah</small>`);

    // 2. Event Listener: Saat marker selesai digeser (dragend)
    marker.on('dragend', function(event) {
        const marker = event.target;
        const position = marker.getLatLng();
        
        // Update koordinat di Database
        updatePosisiMarker(data.id, position.lat, position.lng);
        
        // Update koordinat di Marker Popup
        marker.setPopupContent(`<b>${document.getElementById(`nama-${data.id}`).innerText}</b><br><small>Menyimpan posisi baru...</small>`);
    });

    // Simpan di memori browser
    markers[data.id] = marker;
}

// --- FUNGSI UPDATE POSISI (Backend) ---
async function updatePosisiMarker(id, lat, lng) {
    try {
        const response = await fetch(`${API_URL}/api/map/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude: lat, longitude: lng })
        });

        if (response.ok) {
            // Update Teks di List Panel Kiri secara Realtime
            const posSpan = document.getElementById(`pos-${id}`);
            if(posSpan) {
                posSpan.innerHTML = `Lat: ${lat.toFixed(5)}<br>Lng: ${lng.toFixed(5)}`;
            }
            
            // Update Popup supaya user tau sudah tersimpan
            const marker = markers[id];
            const nama = document.getElementById(`nama-${id}`).innerText;
            marker.setPopupContent(`<b>${nama}</b><br>Lat: ${lat.toFixed(5)}<br>Lng: ${lng.toFixed(5)}`);
            
            console.log("Posisi baru tersimpan!");
        } else {
            alert("Gagal update posisi di server.");
        }
    } catch (error) {
        console.error(error);
        alert("Error koneksi saat geser marker.");
    }
}

// --- FUNGSI READ (AMBIL DATA) ---
async function loadLocations() {
    try {
        const response = await fetch(`${API_URL}/api/map`);
        const data = await response.json();

        coordinateList.innerHTML = "";
        
        if (data.length === 0) {
            coordinateList.innerHTML = "<p style='text-align:center; color:#888;'>Belum ada lokasi tersimpan.</p>";
            return;
        }

        data.forEach(item => {
            addMarkerToMap(item); // Panggil fungsi marker yang baru
            addToList(item);
        });

    } catch (error) {
        console.error(error);
        coordinateList.innerHTML = "<p style='color:red; text-align:center;'>Gagal connect ke server.</p>";
    }
}
loadLocations();

// --- FUNGSI CREATE (SIMPAN) ---
let tempMarker = null;

map.on("click", function (e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    if (tempMarker) map.removeLayer(tempMarker);

    const popupContent = `
        <div class="popup-header">Simpan Lokasi Ini?</div>
        <input type="text" id="inputNama" class="popup-input" placeholder="Nama tempat..." autocomplete="off">
        <button onclick="simpanKeDatabase(${lat}, ${lng})" class="btn-save">Simpan Data</button>
    `;

    tempMarker = L.popup().setLatLng([lat, lng]).setContent(popupContent).openOn(map);
});

window.simpanKeDatabase = async function(lat, lng) {
    const namaInput = document.getElementById('inputNama').value;
    if (!namaInput) { alert("Nama harus diisi!"); return; }

    const dataBaru = { nama: namaInput, latitude: lat, longitude: lng };

    try {
        const response = await fetch(`${API_URL}/api/map`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataBaru)
        });
        const result = await response.json();

        if (response.ok) {
            map.closePopup();
            const savedData = result.data; // Data lengkap dr server (ada ID)
            
            addMarkerToMap(savedData); // Langsung draggable
            addToList(savedData);
        } else {
            alert("Gagal menyimpan.");
        }
    } catch (error) { alert("Error koneksi."); }
};

// --- FUNGSI DELETE (HAPUS) ---
window.hapusLokasi = async function(id) {
    if(!confirm("Yakin mau menghapus lokasi ini?")) return;

    try {
        const response = await fetch(`${API_URL}/api/map/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            document.getElementById(`item-${id}`).remove();
            if(markers[id]) {
                map.removeLayer(markers[id]);
                delete markers[id];
            }
        } else {
            alert("Gagal menghapus.");
        }
    } catch (error) { console.error(error); }
};

// --- FUNGSI UPDATE NAMA (EDIT) ---
window.editLokasi = async function(id) {
    const namaLama = document.getElementById(`nama-${id}`).innerText;
    const namaBaru = prompt("Masukkan nama baru:", namaLama);

    if (namaBaru && namaBaru !== namaLama) {
        try {
            const response = await fetch(`${API_URL}/api/map/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nama: namaBaru })
            });

            if (response.ok) {
                document.getElementById(`nama-${id}`).innerText = namaBaru;
                if(markers[id]) {
                    markers[id].setPopupContent(`<b>${namaBaru}</b><br><small>Geser untuk pindah</small>`);
                }
            } else {
                alert("Gagal update.");
            }
        } catch (error) { console.error(error); }
    }
};

window.zoomKe = function(id) {
    const marker = markers[id];
    if (marker) {
        map.setView(marker.getLatLng(), 17);
        marker.openPopup();
    }
};

// LOGOUT
document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('user_sig');
    window.location.href = 'index.html';
});