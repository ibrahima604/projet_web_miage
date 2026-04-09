<?php
session_start();
header('Content-Type: application/json; charset=UTF-8');

if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}

$file          = __DIR__ . '/../data/Reservations.json';
$file_ch       = __DIR__ . '/../data/Chambres.json';
$file_pr       = __DIR__ . '/../data/Prestations.json';
$file_ac       = __DIR__ . '/../data/Activites.json';

$reservations = file_exists($file)    ? json_decode(file_get_contents($file),    true) : [];
$chambres     = file_exists($file_ch) ? json_decode(file_get_contents($file_ch), true) : [];
$prestations  = file_exists($file_pr) ? json_decode(file_get_contents($file_pr), true) : [];
$activitesRaw = file_exists($file_ac) ? json_decode(file_get_contents($file_ac), true) : [];

$today               = date('Y-m-d');
$updatedReservations = [];

foreach ($reservations as &$reservation) {

    if ($reservation['status'] !== 'confirmée') continue;
    if ($today <= $reservation['date de fin'])  continue;

    // Passer en terminée
    $reservation['status'] = 'terminée';

    // 1. Libérer la chambre
    foreach ($chambres['chambres'] as &$chambre) {
        if ($chambre['id'] == $reservation['id_chambre']) {
            $chambre['statut'] = 'libre';
            break;
        }
    }
    unset($chambre);
    $reservation['id_chambre'] = null;

    // 2. Vider les prestations
    $reservation['prestations']        = [];
    $reservation['prestations_detail'] = [];

    // 3. Vider les activités
    $reservation['activites'] = [];

    $updatedReservations[] = $reservation;
}
unset($reservation);

// Sauvegarder réservations + chambres
file_put_contents($file,    json_encode($reservations, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
file_put_contents($file_ch, json_encode($chambres,     JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode([
    'success'      => true,
    'prestations'  => $prestations,
    'reservations' => $reservations,
    'updated'      => $updatedReservations
]);