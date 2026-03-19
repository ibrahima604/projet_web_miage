$(document).ready(function () {
    $('#date').on('change', function () {
        let debut = new Date($(this).val());

        // Mettre la date minimale pour date_fin
        $('#date_fin').attr('min', debut.toISOString().split('T')[0]);

        let fin = new Date($('#date_fin').val());

        if (fin < debut) {
            //bloquer la soumission du formulaire et afficher un message d'erreur
            return false;
            $('#message')
                .removeClass()
                .addClass('alert alert-danger')
                .html('La date de fin doit être supérieure ou égale à la date de début.');
            $('#date_fin').val('');
        }
    });
    $('#reservationForm').submit(function (event) {
        event.preventDefault();

        // Récupérer les données du formulaire
        let nom = $('#name').val();
        let phone = $('#phone').val();
        let email = $('#email').val();
        let date = $('#date').val();
        let date_fin = $('#date_fin').val();
        let nbrPersonne = $('#guests').val();
        let demande = $('#requests').val();
        console.log(nom, phone, email, date, date_fin, nbrPersonne, demande);
        //Envoi des données au serveur Ajax et les stocker dans le fichier json Reservations.json
        $.ajax(
            {
                url: '../api/reserver.php',
                type: 'POST',
                dataType: 'json',
                data: {
                    name: nom,
                    phone: phone,
                    email: email,
                    date: date,
                    date_fin: date_fin,
                    nbr_personne: nbrPersonne,
                    demande: demande
                },
                success: function (response) {
                    $('#message')
                        .removeClass()
                        .addClass('alert alert-success')
                        .html('Réservation enregistrée avec succès!');

                },

                error: function (xhr, _status, error) {
                    console.error('Erreur AJAX:', xhr, _status, error);
                    console.log("Réponse serveur:", xhr.responseText);
                    $('#message')
                        .removeClass()
                        .addClass('alert alert-danger')
                        .html('Une erreur est survenue lors de la réservation. Veuillez réessayer.');
                }
            }

        );

    });
});