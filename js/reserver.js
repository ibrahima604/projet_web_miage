$(document).ready(function(){
    $('#reservationForm').submit(function(event){
        event.preventDefault();
        // Récupérer les données du formulaire
        let nom= $('#name').val();
        let phone= $('#phone').val();
        let email= $('#email').val();
        let date= $('#date').val();
        let nbrPersonnes= $('#guests').val();
        let demande= $('#requests').val();
        //Envoi des données au serveur Ajax et les stocker dans le fichier json Reservations.json
        $.ajax(
            {
                url:'../api/reserver.php',
                type:'POST',
                data:{
                    name:nom,
                    phone:phone,
                    email:email,
                    date:date,
                    nbr_personne:nbrPersonnes,
                    demande:demande
                },
                success:function(response){
                    $('#message')
                    .removeClass()
                    .addClass('alert alert-success')
                    .html('Réservation enregistrée avec succès!');

                },

                error:function(xhr, _status, error){
                    $('#message')
                    .removeClass()
                    .addClass('alert alert-danger')
                    .html('Une erreur est survenue lors de la réservation. Veuillez réessayer.');
                }
                }

        );
       
    });
});