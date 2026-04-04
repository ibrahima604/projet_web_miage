<?php
session_start();
header('Content-Type: application/json; charset=UTF-8');

// Vérifie si l'utilisateur est connecté et admin
if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}

$file = __DIR__ . '/../data/Reservations.json';
$reservations = [];
if (file_exists($file)) {
    $reservations = json_decode(file_get_contents($file), true);
}

if (isset($_POST['reservation_id']) && isset($_POST['prestation_id'])) {
    $reservationId = $_POST['reservation_id'];
    $prestationId = (int) $_POST['prestation_id'];
    $updated = false;

    foreach ($reservations as &$reservation) {
        if ($reservation['id'] === $reservationId) {
            if (!isset($reservation['prestations'])) {
                $reservation['prestations'] = [];
            }
            // évite doublons
            if (!in_array($prestationId, $reservation['prestations'])) {
                $reservation['prestations'][] = $prestationId;
            }
            $updated = true;
            break;
        }
    }

    if ($updated) {
        // sauvegarde le JSON mis à jour
        file_put_contents($file, json_encode($reservations, JSON_PRETTY_PRINT));
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Réservation non trouvée']);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Données manquantes']);
}