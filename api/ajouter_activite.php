<?php
header('Content-Type: application/json');
session_start();

//Vérification de session
if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'user') {
    ob_clean();
    echo json_encode(['success' => false, 'message' => 'Non autorisé.']);
    exit;
}

// ── Paramètres POST
$activite_id    = isset($_POST['activite_id'])    ? trim($_POST['activite_id'])    : null;
$reservation_id = isset($_POST['reservation_id']) ? trim($_POST['reservation_id']) : null;

if (!$activite_id || !$reservation_id) {
    ob_clean();
    echo json_encode(['success' => false, 'message' => 'Paramètres manquants.']);
    exit;
}

//  Chemins 
$reservationsFile = __DIR__ . '/../data/reservations.json';
$activitesFile    = __DIR__ . '/../data/activites.json';

// ── Lecture réservations 
if (!file_exists($reservationsFile)) {
    ob_clean();
    echo json_encode(['success' => false, 'message' => 'Fichier réservations introuvable.']);
    exit;
}

$reservations = json_decode(file_get_contents($reservationsFile), true);
if (!is_array($reservations)) {
    ob_clean();
    echo json_encode(['success' => false, 'message' => 'Données réservations invalides.']);
    exit;
}

// ── Lecture activités — supporte {"activites":[...]} ET [...] directement ────
if (!file_exists($activitesFile)) {
    ob_clean();
    echo json_encode(['success' => false, 'message' => 'Fichier activités introuvable.']);
    exit;
}

$activitesRaw = json_decode(file_get_contents($activitesFile), true);

// Si le JSON est { "activites": [...] }, on extrait le tableau
if (isset($activitesRaw['activites']) && is_array($activitesRaw['activites'])) {
    $activites = $activitesRaw['activites'];
} elseif (is_array($activitesRaw)) {
    $activites = $activitesRaw;
} else {
    ob_clean();
    echo json_encode(['success' => false, 'message' => 'Données activités invalides.']);
    exit;
}

// ── Vérification que l'activité existe (clé "id" confirmée dans votre JSON) ──
$activiteExiste = count(array_filter($activites, fn($a) => (string)($a['id'] ?? '') === (string)$activite_id)) > 0;
if (!$activiteExiste) {
    ob_clean();
    echo json_encode(['success' => false, 'message' => 'Activité introuvable (id=' . $activite_id . ').']);
    exit;
}

// ── Recherche de la réservation 
$userEmail = $_SESSION['user']['email'];
$found     = false;

foreach ($reservations as &$reservation) {
    if ((string)($reservation['id'] ?? '') !== (string)$reservation_id) {
        continue;
    }

    // Vérifier que la réservation appartient à l'utilisateur connecté
    if (($reservation['email'] ?? '') !== $userEmail) {
        ob_clean();
        echo json_encode(['success' => false, 'message' => 'Accès non autorisé à cette réservation.']);
        exit;
    }

    // Vérifier le statut
    if (!in_array($reservation['status'] ?? '', ['confirmée', 'confirmee'])) {
        ob_clean();
        echo json_encode(['success' => false, 'message' => 'Réservation non confirmée.']);
        exit;
    }

    // Initialiser le tableau activites si absent
    if (!isset($reservation['activites']) || !is_array($reservation['activites'])) {
        $reservation['activites'] = [];
    }

    // Vérifier doublon
    foreach ($reservation['activites'] as $act) {
        if ((string)($act['id_activite'] ?? '') === (string)$activite_id) {
            ob_clean();
            echo json_encode(['success' => false, 'message' => 'Cette activité est déjà ajoutée à cette réservation.']);
            exit;
        }
    }

    // ── Ajout avec statut "en attente" 
    $reservation['activites'][] = [
        'id_activite' => (int)$activite_id,
        'statut'      => 'en attente'
    ];

    $found = true;
    break;
}
unset($reservation);

if (!$found) {
    ob_clean();
    echo json_encode(['success' => false, 'message' => 'Réservation introuvable.']);
    exit;
}

// ── Sauvegarde 
$encoded = json_encode($reservations, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if (file_put_contents($reservationsFile, $encoded) === false) {
    ob_clean();
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la sauvegarde.']);
    exit;
}

ob_clean();
echo json_encode(['success' => true, 'message' => 'Activité ajoutée avec succès, en attente de confirmation.']);