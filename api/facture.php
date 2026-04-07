<?php
session_start();
header('Content-Type: application/json; charset=UTF-8');

if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'user') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}

$file     = __DIR__ . '/../data/Reservations.json';
$file_ch  = __DIR__ . '/../data/Chambres.json';
$file_pr  = __DIR__ . '/../data/Prestations.json';

$reservations = file_exists($file)    ? json_decode(file_get_contents($file),    true) : [];
$chambresData = file_exists($file_ch) ? json_decode(file_get_contents($file_ch), true) : [];
$prestations  = file_exists($file_pr) ? json_decode(file_get_contents($file_pr), true) : [];

$id_reservation = trim($_GET['id'] ?? '');
$reservationSelectionnee = null;

foreach ($reservations as $r) {
    if ((string)$r['id'] === $id_reservation) {
        $reservationSelectionnee = $r;
        break;
    }
}

if (!$reservationSelectionnee) {
    echo json_encode(['success' => false, 'error' => 'Réservation non trouvée']);
    exit;
}

// Chambre
$listeChambres = $chambresData['chambres'] ?? $chambresData;
foreach ($listeChambres as $chambre) {
    if ($chambre['id'] == $reservationSelectionnee['id_chambre']) {
        $reservationSelectionnee['chambre'] = $chambre;
        break;
    }
}

// Prestations détaillées
$idsPrestations = $reservationSelectionnee['prestations'] ?? [];
$detailPrestations = [];
foreach ($prestations as $p) {
    if (in_array($p['id'], $idsPrestations)) {
        $detailPrestations[] = $p;
    }
}
$reservationSelectionnee['prestations_detail'] = $detailPrestations;

echo json_encode(['success' => true, 'reservation' => $reservationSelectionnee]);