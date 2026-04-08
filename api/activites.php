<?php
session_start();
header('Content-Type: application/json charset=UTF-8');

if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'user') {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Accès refusé']);
    exit;
}

$file_act= __DIR__ . '/../data/Activites.json';
if (!file_exists($file_act)) {
    echo json_encode(['success' => false, 'error' => 'Fichier introuvable']);
    exit;
}

$activites = json_decode(file_get_contents($file_act), true);
$activite=[];
foreach($activites['activites'] as $a){
    $activite[]=$a;
    
}
echo json_encode(['success' => true, 'activites' => $activite]);

