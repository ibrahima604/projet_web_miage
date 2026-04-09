<?php
session_start();
header('Content-Type: application/json');

// Vérifier que l'ID est présent
if (!isset($_POST['id_activite'])) {
    echo json_encode(['success' => false, 'error' => 'ID activité manquant']);
    exit;
}

$file = __DIR__ . '/../data/Reservations.json';

// Vérifier que le fichier existe
if (!file_exists($file)) {
    echo json_encode(['success' => false, 'error' => 'Fichier introuvable']);
    exit;
}

// Lire et décoder le fichier JSON
$reservations = json_decode(file_get_contents($file), true);
if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(['success' => false, 'error' => 'Erreur de décodage JSON']);
    exit;
}

$id = $_POST['id_activite'];

// Mettre à jour le statut des activités
foreach ($reservations as &$r) {
    if (!isset($r['activites'])) continue;

    foreach ($r['activites'] as &$a) {
        if ($a['id_activite'] == $id) {
            $a['statut'] = 'confirmée';
        }
    }
}

// Sauvegarder les modifications
file_put_contents($file, json_encode($reservations, JSON_PRETTY_PRINT));

echo json_encode(['success' => true]);
?>