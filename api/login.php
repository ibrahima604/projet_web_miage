<?php
session_start();
header('Content-Type: application/json; charset=UTF-8');

// Charger les utilisateurs depuis le JSON
$users = json_decode(file_get_contents('../data/Users.json'), true);

// Récupérer les données POST
$email = trim($_POST['email'] ?? '');
$password = trim($_POST['password'] ?? '');

// Vérification basique
if (empty($email) || empty($password)) {
    echo json_encode([
        'success' => false,
        'message' => 'Email et mot de passe requis'
    ]);
    exit;
}

$loggedUser = null;

foreach ($users as $u) {
    if ($u['email'] === $email) {
        // Si le mot de passe est hashé (commence par $2y$)
        if (isset($u['password']) && str_starts_with($u['password'], '$2y$')) {
            if (password_verify($password, $u['password'])) {
                $loggedUser = $u;
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Mot de passe incorrect pour l\'utilisateur'
                ]);
                exit;
            }
        } else {
            // Mot de passe en clair (admin)
            if ($u['password'] === $password) {
                $loggedUser = $u;
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Mot de passe incorrect pour l\'admin'
                ]);
                exit;
            }
        }
        break;
    }
}

// Si utilisateur trouvé et mot de passe correct
if ($loggedUser) {
    $_SESSION['user'] = [
        'email' => $loggedUser['email'],
        'fullname' => $loggedUser['name'] ?? $loggedUser['fullname'] ?? '',
        'role' => $loggedUser['role']
    ];

    echo json_encode([
        'success' => true,
        'role' => $loggedUser['role']
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Email non trouvé'
    ]);
}