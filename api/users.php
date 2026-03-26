<?php
session_start();
header('Content-Type: application/json');

// Vérifie si l'utilisateur est connecté et a le rôle d'administrateur
if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}

// Vérifie que la requête est de type GET
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $file = __DIR__ . '/../data/Users.json';
    $users = [];
    if (file_exists($file)) {
        $users = json_decode(file_get_contents($file), true);
    }

    // Filtrer uniquement les utilisateurs avec le rôle "user"
    $usersFiltered = array_filter($users, function($u) {
        return isset($u['role']) && $u['role'] === 'user';
    });

    $usersFiltered = array_map(function($u) {
        return [
            'email' => $u['email'],
            'fullname' => $u['name'] ?? $u['fullname'] ?? '',
            'role' => $u['role']
        ];
    }, $usersFiltered);

    echo json_encode(array_values($usersFiltered)); // array_values pour réindexer
}