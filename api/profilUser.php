<?php
session_start();
header('Content-Type: application/json charset=UTF-8');
if(isset($_SESSION['user'])){
    $data=file_get_contents('../data/Users.json');
    $users=json_decode($data, true);
    $currentUser = null;
    foreach($users as $user){
        if($user['email'] === $_SESSION['user']['email']){
            $currentUser = $user;
            break;
        }
    };

    echo json_encode([
        'success' => true,
        'user' => $currentUser
    ]);
} else {
    echo json_encode([
        'success' => false
    ]);
}
