<?php
session_start();
header('Content-Type: application/json; charset=UTF-8');

// Vérifie si l'utilisateur est connecté et a le rôle d'administrateur
if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}
$chambres=json_decode(file_get_contents(__DIR__.'/../data/chambres.json'), true);
$chambres_libres = [];
foreach($chambres['chambres'] as $chambre){
   
    if($chambre['statut'] === 'libre'){
        $chambres_libres[] = $chambre;
    }

}


// Renvoie les données JSON
echo json_encode([
    'success' => true,
    'chambres' => $chambres_libres
]);