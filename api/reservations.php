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
$file_ch = __DIR__ . '/../data/Chambres.json';

$reservations = [];
if (file_exists($file)) {
    $reservations = json_decode(file_get_contents($file), true);
}

$chambres = [];
if (file_exists($file_ch)) {
    $chambres = json_decode(file_get_contents($file_ch), true);
}

$today = date('Y-m-d');
$updatedReservations = [];

//Mettre à jour automatiquement les réservations expirées
foreach ($reservations as &$reservation) {

    if ($reservation['status'] === 'confirmée') {

        if ($today > $reservation['date de fin']) {

            $reservation['status'] = 'terminée';

            // Libérer la chambre
            foreach ($chambres['chambres'] as &$chambre) {
                if ($chambre['id'] == $reservation['id_chambre']) {
                    $chambre['statut'] = 'libre';
                    break;
                }
            }

            $reservation['id_chambre'] = null;
            $updatedReservations[] = $reservation;
        }
    }
}

// Sauvegarder les DEUX fichiers
file_put_contents($file, json_encode($reservations, JSON_PRETTY_PRINT));
file_put_contents($file_ch, json_encode($chambres, JSON_PRETTY_PRINT));

// Renvoie les données JSON mises à jour
echo json_encode([
    'success' => true,
    'reservations' => $reservations,
    'updated' => $updatedReservations
]);