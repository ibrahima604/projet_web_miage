<?php
session_start();
header('Content-Type: application/json; charset=UTF-8');

if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'user') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}

$file = __DIR__ . '/../data/Reservations.json';
$file_ch = __DIR__ . '/../data/Chambres.json';

$reservations = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
$chambres = file_exists($file_ch) ? json_decode(file_get_contents($file_ch), true) : [];

// Récupérer l'ID de la réservation depuis les paramètres GET
$id_reservation = (int) ($_GET['id'] ?? 0);

$reservationSelectionnee = null;

foreach ($reservations as $reservation) {
    if ($reservation['id'] == $id_reservation) {
        $reservationSelectionnee = $reservation;
        break;
    }
}

if ($reservationSelectionnee) {

    // Vérifie structure chambres
    $listeChambres = isset($chambres['chambres']) ? $chambres['chambres'] : $chambres;

    foreach ($listeChambres as $chambre) {
        if ($chambre['id'] == $reservationSelectionnee['id_chambre']) {
            $reservationSelectionnee['chambre'] = $chambre;
            break;
        }
    }

    ini_set('display_errors', 1);
    error_reporting(E_ALL);
    echo json_encode([
        'success' => true,
        'reservation' => $reservationSelectionnee
    ]);
} else {
    echo json_encode([
        'success' => false,
        'error' => 'Réservation non trouvée'
    ]);
}
