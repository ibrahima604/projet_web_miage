<?php
session_start();
header('Content-Type: application/json charset=UTF-8');
if (isset($_SESSION['user'])) {
    $data=file_get_contents('../data/User_services.json');
    $services=json_decode($data, true);
    $userServices = [];
    foreach($services as $service){
        if($service['email'] === $_SESSION['user']['email']){
            $userServices[] = $service;
        }

    }
    echo json_encode([
        'success' => true,
        'services' => $userServices
    ]);
} else {
    echo json_encode([
        'success' => false
    ]);
}