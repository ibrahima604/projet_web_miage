<?php
session_start();
header('Content-Type: application/json');
// Vérifie si l'utilisateur est connecté et a le rôle d'administrateur sinon refuse l'accès
if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}

// Permet de gérer les utilisateurs
// Vérifie que la requête est de type GET
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $file = __DIR__ . '/../data/Users.json';
    $users = [];
    if (file_exists($file)) {
        $users = json_decode(file_get_contents($file), true);
    }
   $usersFiltered = array_map(function($u){
    return [
        'email' => $u['email'],
        'fullname' => $u['name'],
        'role' => $u['role']
    ];
}, $users);

echo json_encode($usersFiltered);
}
