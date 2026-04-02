<?php
session_start();
header('Content-Type: application/json; charset=UTF-8');

if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}

$id_reservation = $_POST['id'] ?? null;
$id_chambre = $_POST['chambre_id'] ?? null;
$status = $_POST['status'] ?? null;

// Fichiers
$reservation_file = __DIR__ . '/../data/Reservations.json';
$chambres_file = __DIR__ . '/../data/chambres.json';
$users_file = __DIR__ . '/../data/Users.json';

// Récupérer les réservations
$reservations = file_exists($reservation_file) ? json_decode(file_get_contents($reservation_file), true) : [];

// Mise à jour de la réservation
$reservationSelectionnee = null;
foreach ($reservations as &$res) {
    if ($res['id'] === $id_reservation) {
        $res['status'] = $status;
        $res['id_chambre'] = intval($id_chambre);
        $reservationSelectionnee = $res;
        break;
    }
}
file_put_contents($reservation_file, json_encode($reservations, JSON_PRETTY_PRINT));

// Récupérer les chambres
$chambresData = file_exists($chambres_file) ? json_decode(file_get_contents($chambres_file), true) : ['chambres'=>[]];
$chambres = $chambresData['chambres'];

// Mise à jour de la chambre
$chambreSelectionnee = null;
foreach ($chambres as &$ch) {
    if ((string)$ch['id'] === (string)$id_chambre) {
        $ch['statut'] = 'reservée';
        $chambreSelectionnee = $ch;
        break;
    }
}
// Réécrire le fichier chambres.json
file_put_contents($chambres_file, json_encode(['chambres'=>$chambres], JSON_PRETTY_PRINT));

// Générer mot de passe aléatoire
$passwordPlain = bin2hex(random_bytes(4)); // 8 caractères hex
$passwordHash = password_hash($passwordPlain, PASSWORD_DEFAULT);

// Ajouter l'utilisateur au fichier users.json si pas déjà présent
$users = file_exists($users_file) ? json_decode(file_get_contents($users_file), true) : [];
$existingUser = false;
foreach ($users as $u) {
    if ($u['email'] === $reservationSelectionnee['email']) {
        $existingUser = true;
        break;
    }
}
if (!$existingUser) {
    $users[] = [
        'nom' => $reservationSelectionnee['nom'],
        'email' => $reservationSelectionnee['email'],
        'role' => 'user',
        'password' => $passwordHash,
        'tel'=>$reservationSelectionnee['tel'],
        
    ];
    file_put_contents($users_file, json_encode($users, JSON_PRETTY_PRINT));
}

// Créer message prêt à envoyer
$messageMail = "Bonjour {$reservationSelectionnee['nom']},\n\n";
$messageMail .= "Votre réservation a été confirmée !\n";
$messageMail .= "Chambre attribuée : {$chambreSelectionnee['type']} - {$chambreSelectionnee['capacite']} personnes - numero:{$chambreSelectionnee['id']}\n";
$messageMail .= "Dates : {$reservationSelectionnee['date de debut']} au {$reservationSelectionnee['date de fin']}\n\n";
$messageMail .= "Vos identifiants pour accéder à votre compte :\n";
$messageMail .= "Email : {$reservationSelectionnee['email']}\n";
$messageMail .= "Mot de passe : $passwordPlain\n\n";
$messageMail .= "Merci et à bientôt !";

// Retour JSON
echo json_encode([
    'success' => true,
    'reservation' => $reservationSelectionnee,
    'chambre' => $chambreSelectionnee,
    'message_mail' => $messageMail
]);