<?php
session_start();
header('Content-Type: application/json charset=UTF-8');
// Supprime toutes les variables de session avant de détruire la session
$_SESSION = [];
session_destroy();
echo json_encode([
    'success' => true,
    'message' => 'Déconnexion réussie'
]);


