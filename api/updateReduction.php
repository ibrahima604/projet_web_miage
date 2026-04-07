<?php
//updateReduction.php
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
// Récupérer les données de la requête POST
if(isset($_POST['reservation_id']) && isset($_POST['reduction'])) {
    $reservationId = $_POST['reservation_id'];
    $reduction = (int) $_POST['reduction'];
    $updated = false;
    // Mettre à jour la réduction de la réservation correspondante
    foreach ($reservations as &$reservation) {
        if ($reservation['id'] === $reservationId) {
            $reservation['reduction'] = $reduction;
            $updated = true;
            break;
        }
    }
    // Sauvegarder les données mises à jour dans le fichier JSON
    if ($updated) {
        file_put_contents($file, json_encode($reservations, JSON_PRETTY_PRINT));
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Réservation non trouvée']);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Données manquantes']);

}

