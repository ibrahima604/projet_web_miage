// Gestion de la soumission du formulaire de connexion
$(document).ready(function () {
    function loadPage(page) {

        $.get(page, function (data) {

            $("body").html(data);

        });

    }
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

                    
                    if (response.role == "admin") {
                        //loadPage("admin.html");
                        $('#message').html('Connexion réussie pour l\'administrateur!').css('color', 'green');
                    // Rediriger vers la page d'accueil ou tableau de bord
                    }
                    else {
                        //loadPage("user.html");
                        $('#message').html('Connexion réussie pour l\'utilisateur!').css('color', 'green');
                    }
                }
                else {
                    $('#message').html('Email ou mot de passe incorrect.').css('color', 'red');
                }

            },
            error: function (error) {
                console.log('Error:', error);
            }
        });
    });
});
