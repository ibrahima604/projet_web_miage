$(document).ready(function () {
    // Fonction pour charger une page dans le corps de la page actuelle
    function loadPage(page) {

        $.get(page, function (data) {

            $("body").html(data);

        });

    }
    // Gestion de la soumission du formulaire de connexion
    $('#loginForm').submit(function (event) {
        event.preventDefault();
        // Récupérer les données du formulaire
        let email = $('#email').val();
        let password = $('#password').val();
        //Appel ajax pour vérifier les informations de connexion
        $.ajax({
            url: '../api/login.php',
            method: 'POST',
            data:
            {
                email: email,
                password: password
            },
            dataType: 'json',
            success: function (response) {
                if (response.success) {

                    // Afficher un message de succès et rediriger en fonction du rôle de l'utilisateur
                    if (response.role == "admin") {
                        $('#message')
                            .removeClass()
                            .addClass('alert alert-success mt-3 text-center')
                            .html('Connexion réussie pour l\'administrateur!').css('color', 'green')
                            .show();
                        loadPage("../admin.html");
                        // Rediriger vers la page d'accueil ou tableau de bord
                    }
                    else {
                        //loadPage("user.html");
                        $('#message')
                            .removeClass()
                            .addClass('alert alert-success mt-3 text-center')
                            .html('Connexion réussie pour l\'utilisateur!').css('color', 'green')
                            .show();
                    }
                }
                // Afficher un message d'erreur si les informations de connexion sont incorrectes
                else {
                    $('#message')
                        .removeClass()
                        .addClass('alert alert-danger mt-3 text-center')
                        .html('Email ou mot de passe incorrect.').css('color', 'red')
                        .show();
                }

            },
            // Afficher une erreur en cas de problème avec la requête AJAX
            error: function (error) {
                console.log('Error:', error);
            }
        });
    });
});
