<?php
//initialiation de la session et configuration de l'en-tête pour la réponse JSON
session_start();
header('Content-Type: application/json charset=UTF-8');
// Récupérer les données du formulaire
$data=json_decode(file_get_contents('../data/Users.json'),true);
$email = $_POST['email'];
$password = $_POST['password'];
// Vérifier les informations d'identification
$user = null;
foreach ($data as $u) {
    if ($u['email'] === $email && $u['password'] === $password) {
        $user = $u;
        break;
    }
}
// Retourner la réponse JSON
if ($user) {
      // Stocker les infos de l'utilisateur dans la session
    $_SESSION['user'] = [
        'email' => $user['email'],
        'fullname' => $user['fullname'] ?? '',
        'role' => $user['role']
    ];
    echo json_encode([
        'success' => true,
        'role' => $user['role']
    ]);

} 
// Si les informations d'identification sont incorrectes, retourner une réponse d'échec
else {

    echo json_encode([
        'success' => false
    ]);

}
