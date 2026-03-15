<?php
session_start();
header('Content-Type: application/json charset=UTF-8');
// Vérifie si l'utilisateur est connecté et a le rôle d'administrateur sinon refuse l'accès
if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}
$file=__DIR__.'/../data/Reservations.json';
$reservations=[];
if(file_exists($file)){
    $reservations=json_decode(file_get_contents($file),true);
}
echo json_encode($reservations);
