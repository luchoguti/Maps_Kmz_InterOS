import { MapModule } from './mapModule.js';
window.MapModule = MapModule;

function loadGoogleMaps() {
    MapModule.loadGoogleMaps();
}

async function updateMarkerCounts() {
    try {
        const response = await $.ajax({
            url: 'https://red-interna.interos.com.co/api/items/count_markers',
            method: 'POST'
        });

        const data = typeof response === 'string' ? JSON.parse(response) : response;
        if (data.status === 'success') {
            const counts = data.counts;
            $('#markerCounts').html(`
                <div class="caja-empalme">CAJA DE EMPALME: ${counts.caja_de_empalme || 0}</div>
                <div class="caja-nap-activa">CAJA NAP ACTIVA: ${counts.caja_nap_active || 0}</div>
                <div class="caja-nap-desactiva">CAJA NAP DESACTIVA: ${counts.caja_nap_desactive || 0}</div>
                <div class="poste">POSTE: ${counts.poste || 0}</div>
            `);
        } else {
            console.error('Error al obtener el conteo de marcadores:', data.message);
        }
    } catch (error) {
        console.error('Error en la solicitud:', error);
    }
}

window.loadGoogleMaps = loadGoogleMaps;

$(document).ready(() => {
    console.log("DOM completamente cargado y analizado.");
    updateMarkerCounts();
    setInterval(updateMarkerCounts, 10000);

    MapModule.loadGoogleMaps();
});