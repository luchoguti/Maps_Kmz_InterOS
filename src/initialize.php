<?php

require_once __DIR__ . '/Config.php';

// Error Reporting
error_reporting(E_ALL);
ini_set('display_errors', 'Off');
ini_set('error_log', __DIR__ . '/../data/plugin.log');
file_put_contents(__DIR__ . '/../data/plugin.log', '', LOCK_EX);

// Setup Environment Constants
$ucrm_string = file_get_contents(__DIR__ . '/../ucrm.json');
$ucrm_json = json_decode($ucrm_string);
define('UCRM_PUBLIC_URL', $ucrm_json->ucrmPublicUrl);
define('UCRM_API_URL', $ucrm_json->ucrmApiUrl);

error_log('UCRM_PUBLIC_URL: ' . UCRM_PUBLIC_URL);
error_log('UCRM_API_URL: ' . UCRM_API_URL);

$config_path = __DIR__ . '/../data/config.json';
KMZMap\Config::initializeStaticProperties($config_path);