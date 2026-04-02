<?php
session_start();
header('Content-Type: application/json; charset=UTF-8');

// Désactive l'affichage des erreurs pour éviter de polluer le JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);

if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'user') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}

$file = __DIR__ . '/../data/Reservations.json';
$ch_file = __DIR__ . '/../data/Chambres.json';

if (!file_exists($file)) {
    http_response_code(500);
    echo json_encode(['error' => 'Reservations.json introuvable']);
    exit;
}
if (!file_exists($ch_file)) {
    http_response_code(500);
    echo json_encode(['error' => 'Chambres.json introuvable']);
    exit;
}

$reservations = json_decode(file_get_contents($file), true);
if ($reservations === null) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur décodage Reservations.json']);
    exit;
}
// Récupérer les chambres
$chambres = json_decode(file_get_contents($ch_file), true);
// Vérifier que le décodage a réussi
if ($chambres === null) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur décodage Chambres.json']);
    exit;
}

// Filtrer les réservations de l'utilisateur
$userReservations = array_filter($reservations, function($reservation) {
    return $reservation['email'] === $_SESSION['user']['email'];
});

// Ajouter les informations de la chambre et le prix
foreach ($userReservations as &$reservation) {
    if (!empty($reservation['id_chambre'])) {
        $idChambre = $reservation['id_chambre'];
        foreach ($chambres["chambres"] as $chambre) {
            if ($chambre['id'] === $idChambre) {
                $reservation['chambre'] = $chambre;
                $reservation['prix'] = $chambre['prix'];
                break;
            }
        }
    }
}
echo json_encode([
    'success' => true,
    'reservations' => array_values($userReservations)  
]);