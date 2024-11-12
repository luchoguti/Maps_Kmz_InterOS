export async function getShapesInfo(shapeName) {
    try {
        const response = await $.ajax({
            url: `https://red-interna.interos.com.co/api/items/shapes_info?shape_name=${shapeName}`,
            method: 'GET',
            timeout: 10000
        });

        const data = typeof response === 'string' ? JSON.parse(response) : response;
        if (data.status === 'success') {
            return data.item_detail;
        } else {
            console.log('Error en la respuesta:', data.message);
            return null;
        }
    } catch (error) {
        if (error.statusText === 'timeout') {
            Swal.fire({
                title: 'Error',
                text: 'La solicitud ha tardado demasiado en responder. Por favor, inténtelo de nuevo más tarde.',
                icon: 'error'
            });
        } else {
            console.error('Error al obtener la información del overlay:', error);
            Swal.fire({
                title: 'Error',
                text: 'Ocurrió un error al obtener la información. Por favor, inténtelo de nuevo más tarde.',
                icon: 'error'
            });
        }
        return null;
    }
}