<?php
header('Content-Type: application/json');
// Permet de gérer les réservations
// Vérifie que la requête est de type POST
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
// Vérifie que tous les champs nécessaires sont présents
    if (isset($_POST['name'], $_POST['email'], $_POST['phone'], $_POST['date'], $_POST['demande'], $_POST['nbr_personne'])) {

        $name = $_POST['name'];
        $email = $_POST['email'];
        $phone = $_POST['phone'];
        $date = $_POST['date'];
        $requests = $_POST['demande'];
        $guests = $_POST['nbr_personne'];

        $file = __DIR__ . '/Reservations.json';

        if (!file_exists($file)) {
            file_put_contents($file, json_encode([]));
        }

        $reservations = json_decode(file_get_contents($file), true);

        $reservations[] = [
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'date' => $date,
            'demande' => $requests,
            'guests' => $guests
        ];

        file_put_contents($file, json_encode($reservations, JSON_PRETTY_PRINT));

        echo json_encode([
            'success' => true,
            'message' => 'Réservation réussie'
        ]);

    } else {

        echo json_encode([
            'success' => false,
            'message' => 'Données incomplètes'
        ]);
    }
}