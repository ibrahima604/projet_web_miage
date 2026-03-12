<?php
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
