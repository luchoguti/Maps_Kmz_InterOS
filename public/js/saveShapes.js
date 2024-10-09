import { sendToQRForm} from "./sendToQRForm.js";

export async function saveShapes(shapeData, overlays) {
    try {
        const response = await $.ajax({
            url: 'https://red-interna.interos.com.co/api/items/save_shape',
            method: 'POST',
            data: {
                shapes: JSON.stringify(shapeData)
            }
        });

        const data = typeof response === 'string' ? JSON.parse(response) : response;
        if (data.status === 'success') {
            console.log("Formas guardadas exitosamente.");
            if (shapeData.markerType !== 'poste') {
                sendToQRForm(data.item.shape_name, overlays);
            }
            return data.item;
        } else {
            console.error('Error al guardar las formas:', data.message);
        }
    } catch (error) {
        console.error('Error en la solicitud:', error);
    }
}