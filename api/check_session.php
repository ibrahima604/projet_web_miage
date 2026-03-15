<?php
session_start();
header('Content-Type: application/json charset=UTF-8');
if (isset($_SESSION['user'])) {
    echo json_encode([
        'loggedIn' => true,
        'user' => $_SESSION['user']
    ]);
} else {
    echo json_encode([
        'loggedIn' => false
    ]);
}