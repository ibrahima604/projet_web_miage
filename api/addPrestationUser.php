<?php
session_start();
header('Content-Type: application/json; charset=UTF-8');

if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'user') {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Accès refusé']);
    exit;
}

$reservation_id = trim($_POST['reservation_id'] ?? '');
$prestation_id  = (int)($_POST['prestation_id']  ?? 0);

if (!$reservation_id || !$prestation_id) {
    echo json_encode(['success' => false, 'error' => 'Paramètres manquants']);
    exit;
}

$file_res = __DIR__ . '/../data/Reservations.json';
$file_pr  = __DIR__ . '/../data/Prestations.json';

if (!file_exists($file_res) || !file_exists($file_pr)) {
    echo json_encode(['success' => false, 'error' => 'Fichier introuvable']);
    exit;
}

$reservations = json_decode(file_get_contents($file_res), true);
$prestations  = json_decode(file_get_contents($file_pr),  true);

// Vérifier que la prestation existe
$prestationValide = array_filter($prestations, fn($p) => $p['id'] === $prestation_id);
if (empty($prestationValide)) {
    echo json_encode(['success' => false, 'error' => 'Prestation invalide']);
    exit;
}

// Trouver la réservation et vérifier qu'elle appartient à l'utilisateur
$found = false;
foreach ($reservations as &$r) {
    if ((string)$r['id'] === $reservation_id) {
        // Sécurité : l'utilisateur ne peut modifier que ses propres réservations
        if ($r['email'] !== $_SESSION['user']['email']) {
            echo json_encode(['success' => false, 'error' => 'Accès interdit']);
            exit;
        }
        // Éviter les doublons
        if (!isset($r['prestations'])) $r['prestations'] = [];
        if (in_array($prestation_id, $r['prestations'])) {
            echo json_encode(['success' => false, 'error' => 'Prestation déjà ajoutée']);
            exit;
        }
        // Vérifier que la réservation est modifiable
        if (!in_array($r['status'], ['en attente', 'confirmée'])) {
            echo json_encode(['success' => false, 'error' => 'Réservation non modifiable']);
            exit;
        }
        $r['prestations'][] = $prestation_id;
        $found = true;
        break;
    }
}

if (!$found) {
    echo json_encode(['success' => false, 'error' => 'Réservation introuvable']);
    exit;
}

// Sauvegarder
if (file_put_contents($file_res, json_encode($reservations, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)) === false) {
    echo json_encode(['success' => false, 'error' => 'Erreur lors de la sauvegarde']);
    exit;
}

echo json_encode(['success' => true, 'message' => 'Prestation ajoutée avec succès']);