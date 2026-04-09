<?php
session_start();
header('Content-Type: application/json; charset=UTF-8');


if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}


$file_ac = __DIR__ . '/../data/Activites.json';
$file_res = __DIR__ . '/../data/Reservations.json';


if (!file_exists($file_res)) {
    http_response_code(500);
    echo json_encode(['error' => 'Réservations introuvables']);
    exit;
}

if (!file_exists($file_ac)) {
    http_response_code(500);
    echo json_encode(['error' => 'Activités introuvables']);
    exit;
}
// Charger les données
$reservations = json_decode(file_get_contents($file_res), true);
$activitesRaw = json_decode(file_get_contents($file_ac), true);

if ($reservations === null || $activitesRaw === null) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur de décodage JSON']);
    exit;
}

// Liste activités
$listeActivites = $activitesRaw['activites'] ?? $activitesRaw;

//Enrichir les réservations avec les détails des activités
$reservationsEnrichies = [];

foreach ($reservations as $r) {

    $reservationCopy = $r;
    $reservationCopy['activites'] = [];

    if (isset($r['activites']) && is_array($r['activites'])) {

        foreach ($r['activites'] as $a) {

            foreach ($listeActivites as $act) {

                if ((string)$act['id'] === (string)$a['id_activite']) {

                    $reservationCopy['activites'][] = [
                        'id_activite' => $a['id_activite'],
                        'statut' => $a['statut'],
                        'details' => $act
                    ];

                    break;
                }
            }
        }
    }

    $reservationsEnrichies[] = $reservationCopy;
}

//reponse
echo json_encode([
    'success' => true,
    'reservations' => $reservationsEnrichies
]);