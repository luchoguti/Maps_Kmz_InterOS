export function sendToQRForm(shapeName, overlays) {
    $.ajax({
        url: 'https://administracion.interos.com.co/crm/_plugins/kmz-interos/public.php',
        method: 'POST',
        data: {
            action: 'generate-qr',
            serial: shapeName
        },
        success: function(response) {
            console.log('Código QR generado exitosamente.');
            const overlay = overlays[shapeName];
            if (overlay) {
                const contentString = `
                        <div>
                            ${response}
                            <p class="success">Código QR generado exitosamente para: ${shapeName}</p>
                        </div>
                    `;
                const infowindow = new google.maps.InfoWindow({
                    content: contentString
                });
                infowindow.open(map, overlay);
            } else {
                $('#qrCode').html(response);
                $('#qrCode').prepend(`<p class="success">Código QR generado exitosamente para: ${shapeName}</p>`);
            }
        },
        error: function(error) {
            console.error('Error al generar el código QR:', error);
        }
    });
}