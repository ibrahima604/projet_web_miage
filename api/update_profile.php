<?php
// update_profile.php
session_start();
// Vérifie si l'utilisateur est connecté et a le rôle d'utilisateur
header('Content-Type: application/json');   
if(!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'user') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}
// recuperer les données envoyées si elles sont présentes
if(isset($_POST['nom']) && isset($_POST['tel']) && isset($_POST['email'])){
    $nom=$_POST['nom'];
    $tel=$_POST['tel'];
    $email=$_POST['email'];
    $file = __DIR__ . '/../data/Users.json';
    $users = [];
    // Charger les utilisateurs depuis le JSON
    if (file_exists($file)) {
        $users = json_decode(file_get_contents($file), true);
    }
    // Trouver l'utilisateur connecté et mettre à jour ses informations
    foreach($users as &$user) {
        if($user['email'] === $_SESSION['user']['email']) {
            $user['nom'] = $nom;
            $user['tel'] = $tel;
            $user['email'] = $email;
            // Mettre à jour la session avec les nouvelles informations
            $_SESSION['user']['nom'] = $nom;
            $_SESSION['user']['tel'] = $tel;
            $_SESSION['user']['email'] = $email;
            break;
        }
    }
    // Enregistrer les modifications dans le fichier JSON
    file_put_contents($file, json_encode($users, JSON_PRETTY_PRINT));
    echo json_encode([
        'success' => true,
        'message' => 'Votre profil a été mis à jour avec succès.'
        ]);
    


}
