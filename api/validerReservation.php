<?php
session_start();
header('Content-Type: application/json; charset=UTF-8');

//Vérification admin
if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}
$id_reservation = $_POST['id'] ?? null;
$id_chambre = $_POST['chambre_id'] ?? null;
$status = $_POST['status'] ?? null;

if (!$id_reservation || !$id_chambre || !$status) {
    echo json_encode(['success' => false, 'error' => 'Données manquantes']);
    exit;
}
$reservation_file = __DIR__ . '/../data/Reservations.json';
$chambres_file = __DIR__ . '/../data/chambres.json';
$users_file = __DIR__ . '/../data/Users.json';
//reservations
$reservations = file_exists($reservation_file)
    ? json_decode(file_get_contents($reservation_file), true)
    : [];

$reservationSelectionnee = null;

foreach ($reservations as &$res) {
    if ((string)$res['id'] === (string)$id_reservation) {
        $res['status'] = $status;
        $res['id_chambre'] = intval($id_chambre);
        $reservationSelectionnee = $res;
        break;
    }
}

if (!$reservationSelectionnee) {
    echo json_encode(['success' => false, 'error' => 'Réservation introuvable']);
    exit;
}
// Sauvegarde
file_put_contents($reservation_file, json_encode($reservations, JSON_PRETTY_PRINT));
$chambresData = file_exists($chambres_file)
    ? json_decode(file_get_contents($chambres_file), true)
    : ['chambres' => []];

$chambres = $chambresData['chambres'];

$chambreSelectionnee = null;

foreach ($chambres as &$ch) {
    if ((string)$ch['id'] === (string)$id_chambre) {
        $ch['statut'] = 'reservée';
        $chambreSelectionnee = $ch;
        break;
    }
}

if (!$chambreSelectionnee) {
    echo json_encode(['success' => false, 'error' => 'Chambre introuvable']);
    exit;
}

// Sauvegarde chambres
file_put_contents($chambres_file, json_encode(['chambres' => $chambres], JSON_PRETTY_PRINT));

$users = file_exists($users_file)
    ? json_decode(file_get_contents($users_file), true)
    : [];

$existingUser = null;

foreach ($users as $u) {
    if ($u['email'] === $reservationSelectionnee['email']) {
        $existingUser = $u;
        break;
    }
}

//utilisateur existe déjà
if ($existingUser) {

    $messageMail = "Bonjour {$reservationSelectionnee['nom']},\n\n";
    $messageMail .= "Votre réservation a été confirmée !\n";
    $messageMail .= "Chambre attribuée : {$chambreSelectionnee['type']} - {$chambreSelectionnee['capacite']} personnes - numero: {$chambreSelectionnee['id']}\n";
    $messageMail .= "Dates : {$reservationSelectionnee['date de debut']} au {$reservationSelectionnee['date de fin']}\n\n";
    $messageMail .= "Vous avez déjà un compte, vous pouvez vous connecter directement.\n\n";
    $messageMail .= "Merci et à bientôt !";

} 
// Nouvel utilisateur
else {

    $passwordPlain = bin2hex(random_bytes(4));
    $passwordHash = password_hash($passwordPlain, PASSWORD_DEFAULT);

    $users[] = [
        'nom' => $reservationSelectionnee['nom'],
        'email' => $reservationSelectionnee['email'],
        'role' => 'user',
        'password' => $passwordHash,
        'tel' => $reservationSelectionnee['tel']
    ];

    file_put_contents($users_file, json_encode($users, JSON_PRETTY_PRINT));

    $messageMail = "Bonjour {$reservationSelectionnee['nom']},\n\n";
    $messageMail .= "Votre réservation a été confirmée !\n";
    $messageMail .= "Chambre attribuée : {$chambreSelectionnee['type']} - {$chambreSelectionnee['capacite']} personnes - numero: {$chambreSelectionnee['id']}\n";
    $messageMail .= "Dates : {$reservationSelectionnee['date de debut']} au {$reservationSelectionnee['date de fin']}\n\n";
    $messageMail .= "Vos identifiants :\n";
    $messageMail .= "Email : {$reservationSelectionnee['email']}\n";
    $messageMail .= "Mot de passe : $passwordPlain\n\n";
    $messageMail .= "Merci et à bientôt !";
}

//reponse API
echo json_encode([
    'success' => true,
    'reservation' => $reservationSelectionnee,
    'chambre' => $chambreSelectionnee,
    'message_mail' => $messageMail
]);