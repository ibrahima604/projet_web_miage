$(document).ready(function () {
    // Vérifier que l'utilisateur est connecté et a le rôle d'administrateur
    function requireAdmin(callback) {
        $.get('../api/check_session.php', function (response) {
            if (response.loggedIn && response.user.role === 'admin') {
                callback(response.user);
            } else {
                window.location.replace("../pages/login.html");
            }
        }, 'json').fail(function () {
            window.location.replace("../pages/login.html");
        });
    }
    // Afficher le nom de l'administrateur dans la barre de navigation
    requireAdmin(function (user) {
        $('.navbar-brand').append(' - ' + user.fullname);
    });

    // Gérer la déconnexion de l'utilisateur
    $('#logout').on('click', function (e) {
        e.preventDefault();

        $.post('../api/logout.php', function (response) {
            if (response.success) {
                window.location.replace("../pages/login.html");
            }
        }, 'json');
    });

    //respndre à l'événement de clic sur le lien "Réservations" pour afficher la liste des réservations
    $('#linkUsers').on('click', function (e) {
        e.preventDefault();

        $.get('../api/users.php', function (users) {

            let html = `
                <h2 class="mb-4 text-center">Liste des utilisateurs</h2>
                <div class="table-responsive">
                <table class="table table-striped table-hover table-bordered align-middle">
                    <thead class="table-dark">
                        <tr>
                            <th>Email</th>
                            <th>Nom complet</th>
                            <th>Rôle</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            users.forEach(function (user, index) {
                html += `
                    <tr>
                        <td>${user.email}</td>
                        <td>${user.fullname || ''}</td>
                        <td>${user.role}</td>
                        <td>
                            <button class="btn btn-sm btn-success me-2 btn-edit" data-index="${index}">
                                <i class="bi bi-pencil-square"></i> Modifier
                            </button>
                            <button class="btn btn-sm btn-danger btn-delete" data-index="${index}">
                                <i class="bi bi-trash"></i> Supprimer
                            </button>
                        </td>
                    </tr>
                `;
            });

            html += `</tbody></table></div>`;

            $('#adminContent').removeClass('d-none').addClass('d-block').html(html);

        }, 'json');

        $('#dashboardHome').addClass('d-none').removeClass('d-block');
    });

    // Actions utilisateurs
    $(document).on('click', '.btn-edit', function () {
        let index = $(this).data('index');
        alert("Modifier utilisateur : " + index);
    });

    $(document).on('click', '.btn-delete', function () {
        let index = $(this).data('index');

        if (confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) {
            alert("Supprimer utilisateur : " + index);
        }
    });

    //récupérer les réservations et les afficher dans un tableau
    $('#linkReservations').on('click', function (e) {
        e.preventDefault();

        $.get('../api/reservations.php', function (response) {

            let reservations = response.reservations || [];

            let html = `
            <div class="d-flex justify-content-between align-items-center mb-4 text-center">
                <h2 class="fw-bold text-center">
                    <i class="bi bi-calendar-check text-primary"></i>
                    Liste des réservations
                </h2>
            </div>

            <div class="table-responsive shadow rounded">
            <table class="table table-hover table-striped table-bordered align-middle">

            <thead class="table-dark text-center">
                <tr>
                    <th><i class="bi bi-person"></i> Nom</th>
                    <th><i class="bi bi-telephone"></i> Téléphone</th>
                    <th><i class="bi bi-envelope"></i> Email</th>
                    <th><i class="bi bi-calendar"></i> Date de début</th>
                    <th><i class="bi bi-calendar"></i> Date de fin</th>
                    <th><i class="bi bi-people"></i> Personnes</th>
                    <th><i class="bi bi-chat-left-text"></i> Demande</th>
                    <th><i class="bi bi-info-circle"></i> Statut</th>
                    <th><i class="bi bi-gear"></i> Actions</th>
                </tr>
            </thead>

            <tbody>
            `;

            reservations.forEach(function (res) {
                let id = res.id;
                let statusBadge = `
                    <span class="badge bg-warning text-dark">En attente</span>
                `;

                if (res.status === "confirmée") {
                    statusBadge = `<span class="badge bg-success">Confirmée</span>`;
                } else if (res.status === "annulée") {
                    statusBadge = `<span class="badge bg-danger">Refusée</span>`;
                }

                html += `
                <tr>
                    <td>${res.nom}</td>
                    <td>${res.tel}</td>
                    <td>${res.email}</td>
                    <td>${res['date de debut']}</td>
                    <td>${res['date de fin']}</td>

                    <td class="text-center">
                        <span class="badge bg-info">${res.nbr_personne}</span>
                    </td>

                    <td>${res.demande || '-'}</td>

                    <td class="text-center">${statusBadge}</td>

                    <td class="text-center">
                        <button class="btn btn-sm btn-success me-2 btn-validate" data-id="${id}">
                            <i class="bi bi-check-circle"></i> Valider
                        </button>

                        <button class="btn btn-sm btn-danger btn-reject" data-id="${id}">
                            <i class="bi bi-x-circle"></i> Refuser
                        </button>
                    </td>
                </tr>
                `;
            });

            html += `</tbody></table></div>`;

            $('#adminContent').removeClass('d-none').addClass('d-block').html(html);

        }, 'json');

        $('#dashboardHome').addClass('d-none').removeClass('d-block');
    });

    // Clic sur valider réservation
    $(document).on('click', '.btn-validate', function () {
        let reservationId = $(this).data('id');
        $('#modalChambre').data('reservation-id', reservationId);

        // Récupérer les chambres libres via AJAX
        $.ajax({
            url: '../api/chambres.php',
            method: 'GET',
            data: { reservation_id: reservationId },
            dataType: 'json'
        })
            .done(function (response) {
                let chambres = response.chambres || [];
                let options = '<option value="">Sélectionner</option>';

                chambres.forEach(function (ch) {
                    options += `<option value="${ch.id}">Chambre ${ch.type} - ${ch.capacite} personnes (${ch.prix} €)</option>`;
                });

                $('#selectChambre').html(options);

                // Utiliser Bootstrap 5 pour afficher le modal
                let modal = new bootstrap.Modal(document.getElementById('modalChambre'));
                modal.show();
            })
            .fail(function (xhr, status, error) {
                console.error("Erreur lors de la récupération des chambres :", error);
                alert("Impossible de récupérer les chambres disponibles.");
            });
    });

    $('#confirmChambre').click(function () {
        let reservationId = $('#modalChambre').data('reservation-id');
        let chambreId = $('#selectChambre').val();

        if (!chambreId) {
            alert("Veuillez choisir une chambre");
            return;
        }

        $.ajax({
            url: '../api/validerReservation.php',
            method: 'POST',
            data: {
                id: reservationId,
                status: 'confirmée',
                chambre_id: chambreId
            },
            dataType: 'json'
        })
            .done(function (response) {
                // Fermer le modal de sélection de chambre
                let modalChambre = bootstrap.Modal.getInstance(document.getElementById('modalChambre'));
                modalChambre.hide();

                // Rafraîchir le tableau des réservations
                $('#linkReservations').click();

                // Remplir le textarea avec le message
                $('#messageClient').val(response.message_mail);

                // Afficher le modal du message
                let modalMessage = new bootstrap.Modal(document.getElementById('modalMessageClient'));
                modalMessage.show();
            })
            .fail(function (xhr, status, error) {
                console.error("Erreur lors de la validation :", error);
                alert("Impossible de confirmer la réservation.");
            });
    });

    // Copier dans le presse-papier
    $('#copyMessage').click(function () {
        let message = document.getElementById('messageClient');
        message.select();
        message.setSelectionRange(0, 99999); // pour mobile
        document.execCommand('copy');

        // Feedback pour l'admin
        $(this).text('Copié !').prop('disabled', true);
        setTimeout(() => {
            $('#copyMessage').text('Copier dans le presse-papier').prop('disabled', false);
        }, 2000);
    });
    //Réfuser une réservation
    $(document).on('click', '.btn-reject', function () {

        let index = $(this).data('id');

        $.post('../api/updateReservationStatus.php', {
            index: index,
            status: 'annulée'
        }, function () {
            alert("Réservation refusée");
            $('#linkReservations').click();
        });
    });

});