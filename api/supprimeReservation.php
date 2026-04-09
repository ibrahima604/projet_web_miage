<?php
session_start();
header('Content-Type: application/json');
if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}
$reservationsFile = __DIR__ . '/../data/reservations.json';
if (!file_exists($reservationsFile)) {
    http_response_code(500);
    echo json_encode(['error' => 'Fichier réservations introuvable.']);
    exit;
}
$reservations = json_decode(file_get_contents($reservationsFile), true);
if (!is_array($reservations)) {
    http_response_code(500);
    echo json_encode(['error' => 'Données réservations invalides.']);
    exit;
}
$reservationId = isset($_POST['id']) ? trim($_POST['id']) : null;
if (!$reservationId) {
    http_response_code(400);
    echo json_encode(['error' => 'ID de réservation manquant.']);
    exit;
}
$found = false;
foreach ($reservations as $index => $reservation) {
    if ((string)$reservation['id'] === (string)$reservationId) {
        $found = true;
        // Supprimer la réservation
        array_splice($reservations, $index, 1);
        break;
    }
}
if (!$found) {
    http_response_code(404);
    echo json_encode(['error' => 'Réservation non trouvée.']);
    exit;
}
// Sauvegarder les modifications
file_put_contents($reservationsFile, json_encode($reservations));
echo json_encode(['success' => true]);
?>