<?php

namespace KMZMap;

class Config
{
    public static $requiredGoogleApiKey = null;
    public static $requiredKmzFile = null;

    /**
     * @param $config_path
     * @return void
     */
    public static function initializeStaticProperties($config_path): void
    {
        if (file_exists($config_path)) {
            $config_string = file_get_contents($config_path);
            $config_json = json_decode($config_string);

            error_log('Config JSON: ' . print_r($config_json, true)); // Línea de depuración

            foreach ($config_json as $key => $value) {
                switch ($key) {
                    case 'requiredGoogleApiKey':
                        self::$requiredGoogleApiKey = $value;
                        break;
                    case 'requiredKmzFile':
                        self::$requiredKmzFile = $value;
                        break;
                }
            }

            error_log('requiredGoogleApiKey: ' . self::$requiredGoogleApiKey); // Línea de depuración
            error_log('requiredKmzFile: ' . self::$requiredKmzFile); // Línea de depuración
        } else {
            error_log('Config file not found: ' . $config_path); // Línea de depuración
        }
    }
}