document.addEventListener("DOMContentLoaded", function () {
  // --- Inisialisasi peta ---
  const map = L.map("map").setView([-6.914744, 107.60981], 13);

  // --- Tambahkan tile layer (OpenStreetMap) ---
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  // --- Variabel global ---
  let savedCoordinates = [];
  let markers = [];
  const coordinateList = document.getElementById("coordinateList");

  // Fungsi untuk render daftar titik di panel kiri
  function renderCoordinateList() {
    coordinateList.innerHTML = "";

    if (savedCoordinates.length === 0) {
      coordinateList.innerHTML = "<p><i>Belum ada titik tersimpan.</i></p>";
      return;
    }

    savedCoordinates.forEach((coord, index) => {
      const item = document.createElement("div");
      item.classList.add("coord-item");

      const text = document.createElement("span");
      text.textContent = `[${coord.lat.toFixed(5)}, ${coord.lng.toFixed(5)}]`;

      const delBtn = document.createElement("button");
      delBtn.textContent = "Hapus";

      // Hapus marker saat tombol ditekan
      delBtn.addEventListener("click", function () {
        map.removeLayer(markers[index]);
        markers.splice(index, 1);
        savedCoordinates.splice(index, 1);
        localStorage.setItem("clickedPoints", JSON.stringify(savedCoordinates));
        renderCoordinateList();
      });

      item.appendChild(text);
      item.appendChild(delBtn);
      coordinateList.appendChild(item);
    });
  }

  // --- Muat marker dari localStorage (jika ada) ---
  const stored = localStorage.getItem("clickedPoints");
  if (stored) {
    savedCoordinates = JSON.parse(stored);
    savedCoordinates.forEach((coord) => {
      const marker = L.marker([coord.lat, coord.lng])
        .addTo(map)
        .bindPopup(
          `Koordinat tersimpan: [${coord.lat.toFixed(5)}, ${coord.lng.toFixed(5)}]`
        );
      markers.push(marker);
    });
  }

  renderCoordinateList();

  // --- Tambah marker baru saat map diklik ---
  map.on("click", function (e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    // Simpan koordinat baru
    savedCoordinates.push({ lat, lng });

    // Tambahkan marker ke peta
    const marker = L.marker([lat, lng])
      .addTo(map)
      .bindPopup(`Titik disimpan di: [${lat.toFixed(5)}, ${lng.toFixed(5)}]`)
      .openPopup();

    markers.push(marker);

    // Simpan ke localStorage
    localStorage.setItem("clickedPoints", JSON.stringify(savedCoordinates));

    // Perbarui daftar
    renderCoordinateList();
  });
});
