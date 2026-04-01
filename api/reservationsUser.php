<?php
session_start();
header('Content-Type: application/json; charset=UTF-8');

// Vérifie si l'utilisateur est connecté et a le rôle 'user'
if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'user') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}

// Fichiers JSON
$file = __DIR__ . '/../data/Reservations.json';
$ch_file = __DIR__ . '/../data/Chambres.json';
if (!file_exists($file) || !file_exists($ch_file)) {
    http_response_code(500);
    echo json_encode(['error' => 'Fichiers de données introuvables']);
    exit;
}

// Charger les réservations
$reservations = [];
if (file_exists($file)) {
    $reservations = json_decode(file_get_contents($file), true);
}

// Filtrer les réservations de l'utilisateur connecté
$userReservations = array_filter($reservations, function($reservation) {
    return $reservation['email'] === $_SESSION['user']['email'];
});

// Charger les chambres
$chambres = [];
if (file_exists($ch_file)) {
    $chambres = json_decode(file_get_contents($ch_file), true);
}

// Construire un tableau des chambres associées aux réservations de l'utilisateur
$userChambres = [];
foreach ($userReservations as &$reservation) {
    if (isset($reservation['id_chambre'])) {
        foreach ($chambres as $chambre) {
            if ($chambre['id'] == $reservation['id_chambre']) {
                $reservation['chambre'] = $chambre;
                $userChambres[$chambre['id']] = $chambre; // On stocke seulement les chambres utiles
                break;
            }
        }
    }
}

// Réindexer pour JSON propre
echo json_encode([
    'success' => true,
    'chambres' => array_values($userChambres), // seules les chambres de l'utilisateur
    'reservations' => array_values($userReservations)
]);