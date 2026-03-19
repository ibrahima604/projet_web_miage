<?php
session_start();
header('Content-Type: application/json charset=UTF-8');
if (isset($_SESSION['user'])) {
    $data='../data/User_activites.json';
    $activites=json_decode(file_get_contents($data), true);
    $userActivites = [];
    foreach($activites as $activite){
        if($activite['email'] === $_SESSION['user']['email']){
            $userActivites[] = $activite;
        }

    }
    echo json_encode([
        'success' => true,
        'activites' => $userActivites
    ]);
} else {
    echo json_encode([
        'success' => false
    ]);
    
}