<?php

namespace KMZMap;

use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Exception;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Monolog\Handler\StreamHandler;
use Monolog\Logger;
use Psr\Log\LogLevel;
use Symfony\Component\HttpFoundation\Response;

class GenerateQR
{
    private Logger $logger;
    private Client $httpClient;

    public function __construct()
    {
        $this->logger = new Logger('QRGenerator');
        $this->logger->pushHandler(new StreamHandler(__DIR__ . '/../data/plugin.log', LogLevel::WARNING));
        $this->httpClient = new Client();
    }

    /**
     * @param $serial
     * @return Response
     * @throws GuzzleException
     */
    public function generate($serial): Response
    {
        if (empty($serial)) {
            return $this->createResponse('Serial is required', 400);
        }

        try {
            $qrCode = QrCode::create("https://example.com/test?serial={$serial}")
                ->setSize(200)
                ->setMargin(10)
                ->setErrorCorrectionLevel(ErrorCorrectionLevel::High);

            $writer = new PngWriter();
            $result = $writer->write($qrCode);

            $qrImage = $result->getString();
            $filePath = __DIR__ . '/../data/qr_codes/' . $serial . '.png';
            file_put_contents($filePath, $qrImage);

            $response = $this->httpClient->post('https://red-interna.interos.com.co/api/upload_image', [
                'multipart' => [
                    [
                        'name'     => 'image',
                        'contents' => fopen($filePath, 'r'),
                        'filename' => $serial . '.png'
                    ]
                ]
            ]);
            error_log('Response: ' . $response->getBody());
            $responseBody = json_decode($response->getBody(), true);
            $imageUrl = $responseBody['url'] ?? '';

            $jsonFilePath = __DIR__ . '/../uploads/shapes.json';
            $shapesData = json_decode(file_get_contents($jsonFilePath), true);

            if (isset($shapesData[$serial])) {
                $shapesData[$serial]['codeQR'] = base64_encode($qrImage);
            }

            file_put_contents($jsonFilePath, json_encode($shapesData, JSON_PRETTY_PRINT));

            $htmlResponse = '<img src="' . $imageUrl . '">';

            return $this->createResponse($htmlResponse, 200, 'text/html');
        } catch (Exception $exception) {
            $this->logger->error($exception->getMessage());
            return $this->createResponse('Error generating QR code: ' . $exception->getMessage(), 500);
        }
    }

    /**
     * @param $content
     * @param $statusCode
     * @param string $contentType
     * @return Response
     */
    private function createResponse($content, $statusCode, string $contentType = 'text/plain'): Response
    {
        return new Response($content, $statusCode, ['Content-Type' => $contentType]);
    }
}