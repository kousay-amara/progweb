const dataDiv = document.querySelector('#data');

async function getWeatherByCoords(lat, lon) {
    const url = `https://www.prevision-meteo.ch/services/json/lat=${lat}lng=${lon}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

async function getCityName(lat, lon) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
        const response = await fetch(url);
        const data = await response.json();
        const adresse = data.address || {};
        return adresse.city || adresse.town || adresse.village || `Lat ${lat}, Lon ${lon}`;
    } catch (err) {
        return `Lat ${lat}, Lon ${lon}`;
    }
}

function render(data, titre) {
    const now = data.current_condition;

    let html = `
        <h2>${titre}</h2>
        <div class="actuel">
            <img src="${now.icon_big}">
            <p>Maintenant (${now.date} à ${now.hour})</p>
            <p class="temp">${now.tmp} °C</p>
            <p>${now.condition}</p>
        </div>
        <div class="grille">
    `;

    for (let i = 0; i < 5; i++) {
        const jour = data[`fcst_day_${i}`];
        html += `
            <div class="jour">
                <h3>${jour.day_long}</h3>
                <img src="${jour.icon}">
                <p>${jour.tmin}° / ${jour.tmax}°</p>
            </div>`;
    }

    html += '</div>';
    dataDiv.innerHTML = html;
}

// ----- Carte -----
const map = L.map('map').setView([46.6, 2.5], 5);

L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri'
}).addTo(map);

const marker = L.marker([0, 0]);

map.on('click', async (event) => {
    const lat = event.latlng.lat.toFixed(3);
    const lon = event.latlng.lng.toFixed(3);
    marker.setLatLng(event.latlng).addTo(map);
    dataDiv.innerHTML = '<p class="message">Chargement…</p>';
    try {
        const data = await getWeatherByCoords(lat, lon);
        const ville = await getCityName(lat, lon);
        if (data.errors) {
            dataDiv.innerHTML = '<p class="erreur">Pas de météo disponible à cet endroit.</p>';
            return;
        }
        render(data, ville);
    } catch (err) {
        console.error(err);
        dataDiv.innerHTML = `<p class="erreur">Le service météo est indisponible, réessaie plus tard.</p>`;
    }
});
