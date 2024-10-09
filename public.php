<?php
const PROJECT_PATH = __DIR__ . '/src';
require_once(PROJECT_PATH . '/initialize.php');
require_once(PROJECT_PATH . '/GenerateQR.php');
require_once __DIR__ . '/vendor/autoload.php';

use KMZMap\GenerateQR;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;

function filterUrl($url)
{
    return filter_var($url, FILTER_VALIDATE_URL, [
        'flags' => FILTER_NULL_ON_FAILURE,
    ]) ?? '';
}

$request = Request::createFromGlobals();

if ($request->isMethod('POST')) {
    switch ($request->get('action')) {
        case 'generate-qr':
            $serial = $request->get('serial');
            $qrGenerator = new GenerateQR();
            $response = $qrGenerator->generate($serial);
            $response->send();
            break;

        default:
            $response = new JsonResponse(['status' => 'error', 'message' => 'Acción no válida.']);
            $response->send();
            break;
    }
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Google Map with KMZ</title>
    <meta name="description" content="Tower Coverage Map">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href='https://fonts.googleapis.com/css?family=Lato:300,400,400i,700' rel="stylesheet">
    <link rel="stylesheet" href="public/css/styles.css">
    <link rel="stylesheet" href="public/css/btn_downland.css">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="public/js/scripts.js" type="module" defer></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://maps.googleapis.com/maps/api/js?key=<?php echo htmlspecialchars(\KMZMap\Config::$requiredGoogleApiKey, ENT_QUOTES); ?>&libraries=drawing&callback=loadGoogleMaps" async defer></script>
</head>
<body>
<input id="kmzFile" value="<?php echo filterUrl(\KMZMap\Config::$requiredKmzFile); ?>" type="hidden">
<div class="container-title">
    <div id="markerCounts" class="horizontal-counters"></div>
    <div class="container">
        <div class="left-pane">
            <h1>Codigo QR</h1>
            <div id="qrCode"></div>
        </div>
        <div id="map" class="right-pane"></div>
    </div>
</div>
</body>
</html>