<?php
session_start();
header('Content-Type: application/json; charset=UTF-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'user') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}

$file_res  = __DIR__ . '/../data/Reservations.json';
$file_ch   = __DIR__ . '/../data/Chambres.json';
$file_pr   = __DIR__ . '/../data/Prestations.json';

foreach (['reservations' => $file_res, 'chambres' => $file_ch, 'prestations' => $file_pr] as $name => $path) {
    if (!file_exists($path)) {
        http_response_code(500);
        echo json_encode(['error' => "$name introuvable"]);
        exit;
    }
}

$reservations = json_decode(file_get_contents($file_res), true);
$chambresData = json_decode(file_get_contents($file_ch),  true);
$prestations  = json_decode(file_get_contents($file_pr),  true);

if ($reservations === null || $chambresData === null || $prestations === null) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur de décodage JSON']);
    exit;
}

$listeChambres = $chambresData['chambres'] ?? $chambresData;

// Filtrer les réservations de l'utilisateur connecté
$userReservations = array_filter($reservations, fn($r) => $r['email'] === $_SESSION['user']['email']);

// Enrichir chaque réservation avec les infos chambre
foreach ($userReservations as &$r) {
    foreach ($listeChambres as $ch) {
        if ($ch['id'] == $r['id_chambre']) {
            $r['chambre'] = $ch;
            $r['prix']    = $ch['prix'];
            break;
        }
    }
}

echo json_encode([
    'success'      => true,
    'reservations' => array_values($userReservations),
    'prestations'  => $prestations   // liste complète pour le dropdown
]);