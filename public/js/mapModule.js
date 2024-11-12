import { deleteShape } from './deleteShape.js';
import { saveShapes } from './saveShapes.js';
import { sendToQRForm } from './sendToQRForm.js';
import { getShapesInfo } from "./getShapesInfo.js";

export const MapModule = (function () {
    let overlays = {};
    let overlayIdCounter = 0;

    function loadGoogleMaps() {
        if (typeof google !== 'undefined') {
            initializeMap();
        } else {
            console.log("Google Maps API no se ha cargado correctamente.");
        }
    }

    function initializeMap() {
        const mapOptions = {
            center: {lat: 58.33, lng: -98.52},
            zoom: 11,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        const map = new google.maps.Map(document.getElementById("map"), mapOptions);

        loadKmzLayer(map);
        initializeDrawingManager(map);
        loadSavedShapes(map);
    }

    function loadKmzLayer(map) {
        const kmzUrl = $('#kmzFile').val();
        if (kmzUrl) {
            try {
                const kmzLayer = new google.maps.KmlLayer({
                    url: kmzUrl,
                    map: map,
                    preserveViewport: false
                });

                kmzLayer.addListener('defaultviewport_changed', () => {
                    console.log("El archivo KMZ se ha cargado correctamente.");
                });

                kmzLayer.addListener('status_changed', () => {
                    if (kmzLayer.getStatus() !== google.maps.KmlLayerStatus.OK) {
                        console.error("Error al cargar el archivo KMZ: " + kmzLayer.getStatus());
                    }
                });

                kmzLayer.setMap(map);
            } catch (error) {
                console.error("Error al intentar cargar el archivo KMZ: ", error);
            }
        } else {
            console.error("No se proporcionó una URL válida para el archivo KMZ.");
        }
    }

    function initializeDrawingManager(map) {
        const drawingManager = new google.maps.drawing.DrawingManager({
            drawingMode: null,
            drawingControl: true,
            drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_CENTER,
                drawingModes: ['marker', 'polyline']
            },
            markerOptions: {
                draggable: true,
            },
            polylineOptions: {
                editable: true,
                draggable: true
            }
        });
        drawingManager.setMap(map);

        google.maps.event.addListener(drawingManager, 'overlaycomplete', (event) => {
            handleOverlayComplete(event, map);
            drawingManager.setDrawingMode(null);
        });
    }

    async function handleOverlayComplete(event, map) {
        const overlay = event.overlay;
        overlay.type = event.type;
        overlay.overlayId = overlayIdCounter++;
        overlays[overlay.overlayId] = overlay;

        if (overlay.type === 'marker') {
            try {
                const { value: markerType } = await Swal.fire({
                    title: 'Seleccione el tipo de marcador:',
                    input: 'select',
                    inputOptions: {
                        'caja_de_empalme': 'CAJA DE EMPALME',
                        'caja_nap_active': 'CAJA NAP ACTIVA',
                        'caja_nap_desactive': 'CAJA NAP DESACTIVA',
                        'poste': 'POSTE'
                    },
                    inputPlaceholder: 'Seleccione un tipo',
                    showCancelButton: true,
                    confirmButtonText: 'Guardar',
                    cancelButtonText: 'Cancelar',
                    showLoaderOnConfirm: true,
                    customClass: {
                        popup: 'custom-swal-popup'
                    },
                    preConfirm: (markerType) => {
                        if (!markerType) {
                            Swal.showValidationMessage('El tipo de marcador es requerido');
                        }
                        return markerType;
                    }
                });

                if (markerType) {
                    overlay.markerType = markerType;
                    console.log("Nuevo marcador creado:", overlay);

                    const shapeData = {
                        type: overlay.type,
                        markerType: overlay.markerType,
                        position: overlay.getPosition().toJSON()
                    };

                    const savedShape = await saveShapes(shapeData, overlays);

                    drawShape(map, savedShape);

                    await Swal.fire({
                        title: 'Marcador creado',
                        text: `El marcador ha sido creado exitosamente.`,
                        icon: 'success',
                        confirmButtonText: 'OK',
                        customClass: {
                            popup: 'custom-swal-popup'
                        }
                    });
                } else {
                    overlay.setMap(null);
                }
            } catch (error) {
                console.error("Error al manejar la superposición:", error);
                overlay.setMap(null);
            }
        } else if (overlay.type === 'polyline') {
            const path = overlay.getPath().getArray().map(latlng => latlng.toJSON());
            const shapeData = {
                type: 'polyline',
                path: path
            };

            const savedShape = await saveShapes(shapeData);

            drawShape(map, savedShape);

            google.maps.event.addListener(overlay, 'click', (event) => {
                const infoWindow = new google.maps.InfoWindow({
                    content: `
                    <div class="overlay-info">
                        <div class="overlay-function">
                            <button class="noselect delete-button" onclick="MapModule.deleteShape('${overlay.shapeName}')" data-overlay-id="${overlay.overlayId}">
                                <span class="text">Delete</span>
                                <span class="icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                        <path d="M3 6h18v2H3zm2 3h14v12H5zm3-9h8v2H8z"/>
                                    </svg>
                                </span>
                            </button>
                        </div>
                    </div>`
                });
                infoWindow.setPosition(event.latLng);
                infoWindow.open(map);
            });
        }
    }

    async function loadSavedShapes(map) {
        try {
            const response = await $.ajax({
                url: 'https://red-interna.interos.com.co/api/items/load_shapes',
                method: 'GET'
            });

            const savedShapes = typeof response === 'string' ? JSON.parse(response) : response;
            savedShapes.forEach(shape => {
                if (shape.type === 'marker' || shape.type === 'polyline') {
                    drawShape(map, shape);
                }
            });
        } catch (error) {
            console.error('Error al cargar los marcadores guardados:', error);
        }
    }

    function drawShape(map, shape) {
        if (shape.type === 'marker') {
            drawMarker(map, shape);
        } else if (shape.type === 'polyline') {
            drawPolyline(map, shape);
        } else {
            console.error('Tipo de forma no válido o datos incompletos:', shape);
        }
    }

    function drawMarker(map, shape) {
        if (!shape.lat || !shape.lng) {
            console.error('Datos de latitud o longitud no válidos:', shape);
            return;
        }

        const imageUrl = getMarkerImageUrl(shape.marker_type);
        if (!imageUrl) return;

        const overlay = new google.maps.Marker({
            position: new google.maps.LatLng(parseFloat(shape.lat), parseFloat(shape.lng)),
            map: map,
            draggable: true,
            icon: {
                url: imageUrl,
                scaledSize: new google.maps.Size(30, 30)
            }
        });

        overlay.shapeName = shape.shape_name;
        overlay.markerType = shape.marker_type;
        overlay.overlayId = overlayIdCounter++;
        overlays[overlay.overlayId] = overlay;

        google.maps.event.addListener(overlay, 'click', (event) => {
            openInfoWindowForMarker(map, overlay, event.latLng);
        });
    }

    function getMarkerImageUrl(markerType) {
    switch (markerType) {
        case 'caja_de_empalme':
            return `https://administracion.interos.com.co/crm/_plugins/kmz-interos/public/css/caja_de_empalme.png`;
        case 'caja_nap_active':
            return `https://administracion.interos.com.co/crm/_plugins/kmz-interos/public/css/caja_nap_active.png`;
        case 'caja_nap_desactive':
            return `https://administracion.interos.com.co/crm/_plugins/kmz-interos/public/css/caja_nap_desactive.png`;
        case 'poste':
            return `https://administracion.interos.com.co/crm/_plugins/kmz-interos/public/css/poste.png`;
        default:
            console.error('Tipo de marcador no válido:', markerType);
            return null;
        }
    }

    async function openInfoWindowForMarker(map, overlay, position) {
        const infoWindow = new google.maps.InfoWindow();
        const overlayInfo = await getShapesInfo(overlay.shapeName);

        let hilosFusionados = 'N/A';
        if (overlayInfo && overlayInfo.hilos_fusionados) {
            const hilos = JSON.parse(overlayInfo.hilos_fusionados);
            hilosFusionados = `
            <p>Hilos Fusionados:</p>
            <ul>
                <li>Caja de empalme: ${hilos.caja_de_empalme ? `${hilos.caja_de_empalme.serial} Color: ${hilos.caja_de_empalme.color}` : 'N/A'}</li>
                <li>Caja nap: ${hilos.caja_nap ? `${hilos.caja_nap.serial} Color: ${hilos.caja_nap.color}` : 'N/A'}</li>
            </ul>`;
        }
        let content = `
            <div class="overlay-info">
                <div class="overlay-name">
                    ${overlay.shapeName}
                </div>
                <div class="overlay-details">
                    ${overlayInfo ? `
                        <p class="centered-text" style="font-size: 15px; font-weight: 400;">Potencia: ${overlayInfo.potencia || 'N/A'}</p>
                        <p class="centered-text">Puertos Disponibles: ${overlayInfo.puertos_disponibles || 'N/A'}</p>
                        <p class="centered-text">Zona de Equipos: ${overlayInfo.zona_equipos || 'N/A'}</p>
                        <p class="centered-text">Descripción: ${overlayInfo.descripcion || 'N/A'}</p>
                        ${hilosFusionados}
                    ` : '<p class="centered-text" style="margin-bottom: 10px">No additional information available</p>'}
                </div>
            <div class="overlay-function">
            <button class="noselect delete-button" onclick="MapModule.deleteShape('${overlay.shapeName}', this)">
                <span class="text">Delete</span>
                <span class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                        <path d="M24 20.188l-8.315-8.209 8.2-8.282-3.697-3.697-8.212 8.318-8.31-8.203-3.666 3.666 8.321 8.24-8.206 8.313 3.666 3.666 8.237-8.318 8.285 8.203z"></path>
                    </svg>
                </span>
            </button>
            <a href="https://red-interna.interos.com.co/images/${overlay.shapeName}.png" download="QR_${overlay.shapeName}.png" class="btn-downland" target="_blank">
                <svg class="svg-icon" viewBox="0 0 384 512" height="1em" xmlns="http://www.w3.org/2000/svg">
                    <path d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 370.8 224 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 306.7L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"></path>
                </svg>
                <span class="icon-2"></span>
            </a>`;
        if (overlay.markerType === 'caja_nap_active' || overlay.markerType === 'caja_nap_desactive') {
            content += `
            <label class="switch right">
                <input type="checkbox" ${overlay.markerType === 'caja_nap_active' ? 'checked' : ''} onchange="MapModule.toggleNapType('${overlay.shapeName}', this)">
                <div class="slider"></div>
                <div class="slider-card">
                    <div class="slider-card-face slider-card-front"></div>
                    <div class="slider-card-face slider-card-back"></div>
                </div>
            </label>`;
        }

        content += `</div></div>`;
        infoWindow.setContent(content);
        infoWindow.setPosition(position);
        infoWindow.open(map);
    }

    function drawPolyline(map, shape) {
        const polyline = new google.maps.Polyline({
            path: shape.path.map(latlng => new google.maps.LatLng(latlng.lat, latlng.lng)),
            map: map,
            editable: true,
            draggable: true
        });

        polyline.shapeName = shape.shape_name;
        polyline.overlayId = overlayIdCounter++;
        overlays[polyline.overlayId] = polyline;

        google.maps.event.addListener(polyline, 'click', (event) => {
            openInfoWindowForPolyline(map, polyline, event.latLng);
        });

        console.log("Línea cargada:", polyline);
    }

    function openInfoWindowForPolyline(map, polyline, position) {
        const infoWindow = new google.maps.InfoWindow({
            content: `
        <div class="overlay-info">
            <div class="overlay-function">
                <button class="noselect delete-button" onclick="MapModule.deleteShape('${polyline.shapeName}', this)">
                    <span class="text">Delete</span>
                    <span class="icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                            <path d="M3 6h18v2H3zm2 3h14v12H5zm3-9h8v2H8z"/>
                        </svg>
                    </span>
                </button>
            </div>
        </div>`
        });

        infoWindow.setPosition(position);
        infoWindow.open(map);
    }

    async function toggleNapType(shapeName, checkbox) {
        const napType = checkbox.checked ? 'caja_nap_active' : 'caja_nap_desactive';
        try {
            const response = await $.ajax({
                url: 'https://red-interna.interos.com.co/api/items/update_nap_type',
                method: 'POST',
                data: {
                    shapeName: shapeName,
                    napType: napType
                }
            });

            const data = typeof response === 'string' ? JSON.parse(response) : response;
            if (data.status === 'success') {
                const overlay = Object.values(overlays).find(overlay => overlay.shapeName === shapeName);
                console.log("Cambiando el tipo de caja NAP:", overlays);
                if (overlay) {
                    overlay.setIcon({
                        url: napType === 'caja_nap_active' ? 'https://administracion.interos.com.co/crm/_plugins/kmz-interos/public/css/caja_nap_active.png' : 'https://administracion.interos.com.co/crm/_plugins/kmz-interos/public/css/caja_nap_desactive.png',
                        scaledSize: new google.maps.Size(30, 30)
                    });
                    overlay.markerType = napType;
                } else {
                    console.error('Overlay no encontrado shapeName:', shapeName);
                }
            } else {
                console.error('Error al actualizar el estado de caja NAP:', data.message);
            }
        } catch (error) {
            console.error('Error en la solicitud:', error);
        }
    }

    return {
        loadGoogleMaps,
        deleteShape,
        toggleNapType
    };
})();