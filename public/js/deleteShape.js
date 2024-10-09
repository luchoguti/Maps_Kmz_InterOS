export async function deleteShape(shapeName, button) {
    try {
        const response = await $.ajax({
            url: 'https://red-interna.interos.com.co/api/items/delete_shape',
            method: 'POST',
            data: {
                shapeName: shapeName
            }
        });

        const data = typeof response === 'string' ? JSON.parse(response) : response;
        if (data.status === 'success') {
            location.reload();
        } else {
            console.error('Error al eliminar la forma:', data.message);
        }
    } catch (error) {
        console.error('Error en la solicitud:', error);
    }
}