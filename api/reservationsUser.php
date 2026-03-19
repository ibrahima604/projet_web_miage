<?php
session_start();
header('Content-Type: application/json charset=UTF-8');
if (isset($_SESSION['user'])) {
    $data=file_get_contents('../data/User_reservations.json');
    $reservations=json_decode($data, true);
    $userReservations = [];
    foreach($reservations as $reservation){
        if($reservation['email'] === $_SESSION['user']['email']){
            $userReservations[] = $reservation;
        }

    }
    echo json_encode([
        'success' => true,
        'reservations' => $userReservations
    ]);
} else {
    echo json_encode([
        'success' => false
    ]);
}