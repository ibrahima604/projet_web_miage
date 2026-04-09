<?php
session_start();
header('Content-Type: application/json; charset=UTF-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Vérifier que l'utilisateur est connecté
if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'user') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}

// Fichiers JSON
$file_res = __DIR__ . '/../data/Reservations.json';
$file_ch  = __DIR__ . '/../data/Chambres.json';
$file_pr  = __DIR__ . '/../data/Prestations.json';
$file_ac  = __DIR__ . '/../data/Activites.json';

// Vérifier que les fichiers existent
foreach (['reservations' => $file_res, 'chambres' => $file_ch, 'prestations' => $file_pr, 'activites' => $file_ac] as $name => $path) {
    if (!file_exists($path)) {
        http_response_code(500);
        echo json_encode(['error' => "$name introuvable"]);
        exit;
    }
}

// Lire et décoder JSON
$reservations   = json_decode(file_get_contents($file_res), true);
$chambresData   = json_decode(file_get_contents($file_ch),  true);
$prestationsRaw = json_decode(file_get_contents($file_pr),  true);
$activitesRaw   = json_decode(file_get_contents($file_ac),  true);

if ($reservations === null || $chambresData === null || $prestationsRaw === null || $activitesRaw === null) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur de décodage JSON']);
    exit;
}

// Récupérer les listes
$listeChambres  = $chambresData['chambres']      ?? $chambresData;
$listePrest     = $prestationsRaw['prestations'] ?? $prestationsRaw;
$listeActivites = $activitesRaw['activites']     ?? $activitesRaw;

// 🔥 Filtrer les réservations pour l'utilisateur et par statut
$userReservations = [];
foreach ($reservations as $r) {
    // Vérifier email
    if (($r['email'] ?? '') !== $_SESSION['user']['email']) {
        continue;
    }

    // Vérifier le statut de la réservation
    $status = strtolower($r['status'] ?? '');
    if ($status === 'en attente' || $status === 'confirmée' || $status === 'confirmee') {
        $userReservations[] = $r;
    }
}

// Enrichir chaque réservation
foreach ($userReservations as &$r) {

    // 1. Détail de la chambre + prix
    foreach ($listeChambres as $ch) {
        if ((string)$ch['id'] === (string)$r['id_chambre']) {
            $r['chambre'] = $ch;
            $r['prix']    = $ch['prix'];
            break;
        }
    }

    // 2. Détail des prestations
    if (!empty($r['prestations']) && is_array($r['prestations'])) {
        $r['prestations_detail'] = [];
        foreach ($r['prestations'] as $prestId) {
            foreach ($listePrest as $p) {
                if ((string)$p['id'] === (string)$prestId) {
                    $r['prestations_detail'][] = $p;
                    break;
                }
            }
        }
    } else {
        $r['prestations_detail'] = [];
    }

    // 3. Enrichir toutes les activités de la réservation (sans filtrer)
    if (!empty($r['activites']) && is_array($r['activites'])) {
        foreach ($r['activites'] as &$act) {
            foreach ($listeActivites as $a) {
                if ((string)$a['id'] === (string)$act['id_activite']) {
                    $act['detail'] = $a;
                    break;
                }
            }
        }
        unset($act);
    } else {
        $r['activites'] = [];
    }
}
unset($r);

// Retour JSON
echo json_encode([
    'success'      => true,
    'reservations' => array_values($userReservations),
    'prestations'  => $listePrest,
    'activites'    => $listeActivites
]);