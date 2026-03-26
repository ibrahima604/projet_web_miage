// Fonction pour vérifier la session de l'utilisateur
function requireUser(callback) {
    $.ajax({
        url: '../api/check_session.php',
        method: 'GET',
        dataType: 'json',


    }).done(function (response) {
        if (response.loggedIn && response.user.role == 'user') {
            callback(response.user);
        }
        else {
            window.location.replace("../pages/login.html");
        }
    }).fail(function () {
        window.location.replace("../pages/login.html");
    });
}

// Vérifier la session de l'utilisateur dès que le document est prêt et afficher les informations de l'utilisateur dans la barre de navigation
$(document).ready(function (event) {
    // Gérer la déconnexion de l'utilisateur
    $('#logout').click(function (event) {
        event.preventDefault();
        $.ajax({
            url: '../api/logout.php',
            method: 'POST',
            success: function (response) {
                if (response.success) {
                    window.location.replace("../pages/login.html");
                }
            }
        });
    });
    //le profil de l'utilisateur
    $('#monprofil').click(function (event) {
        event.preventDefault();
        $.ajax({
            url: '../api/profilUser.php',
            method: 'GET',
            dataType: 'json',
        }).done(function (response) {
            if (response.success) {
                alert("Nom : " + response.user.name + "\nEmail : " + response.user.email + "\nTéléphone : " + response.user.tel);
            }
        }).fail(function () {
            alert("Erreur lors du chargement du profil.");
        });
    });
    //les services de l'utilisateur
    $('#messervices').click(function (event) {
        $.ajax({
            url: '../api/servicesUser.php',
            method: 'GET',
            dataType: 'json',
        }).done(function (response) {
            if (response.success) {
                console.log("Services de l'utilisateur :", response.services);
                alert("Vous avez " + response.services.length + " service(s) réservé(s).");
                
            }
        }).fail(function (e) {
            alert("Erreur lors du chargement des services.");
            console.log(e);
        }
        );

    });
    //les réservations de l'utilisateur
    $('#mesreservations').click(function (event) {
        event.preventDefault();
        $.ajax({})
        // Ici tu peux charger les réservations de l'utilisateur ou rediriger vers une page de réservations
        alert("Page de réservations en construction!")
    });
    requireUser(function (user) {
        console.log("User connecté :", user);
        // Ici tu peux éventuellement afficher le nom de l'admin
        $('.navbar-brand').append(' - ' + user.fullname);
    });


})