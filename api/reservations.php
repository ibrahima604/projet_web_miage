<?php
session_start();
header('Content-Type: application/json; charset=UTF-8');

// Vérifie si l'utilisateur est connecté et a le rôle d'administrateur
if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}

// Fichier JSON des réservations
$file = __DIR__ . '/../data/Reservations.json';
$reservations = [];
if (file_exists($file)) {
    $reservations = json_decode(file_get_contents($file), true);
}

$today = date('Y-m-d');
$updatedReservations = [];

// 🔥 Mettre à jour automatiquement les réservations expirées
foreach ($reservations as &$reservation) {

    // On ne touche que les réservations confirmées
    if ($reservation['status'] === 'confirmée') {

        // Si la date de fin est dépassée
        if ($today > $reservation['date de fin']) {

            // Changer le statut en "terminée"
            $reservation['status'] = 'terminée';

            // Libérer la chambre
            $reservation['id_chambre'] = null;

            $updatedReservations[] = $reservation;
        }
    }
}

// Sauvegarder les modifications
file_put_contents($file, json_encode($reservations, JSON_PRETTY_PRINT));

// Renvoie les données JSON mises à jour
echo json_encode([
    'success' => true,
    'reservations' => $reservations,
    'updated' => $updatedReservations
]);