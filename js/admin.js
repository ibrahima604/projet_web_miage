if (typeof jQuery != 'undefined') {  
    // jQuery is loaded => print the version
    console.log(jQuery.fn.jquery);
}

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
$('#linkReservations').on('click', function(e) {
    e.preventDefault();

    $.get('../api/reservations.php', function(response) {
        let reservations = response.reservations || [];

        // Génère le badge de statut
        const getStatusBadge = (status) => {
            const badges = {
                'en attente': 'bg-warning text-dark',
                'confirmée': 'bg-success',
                'annulée': 'bg-danger',
                'terminée': 'bg-secondary'
            };
            const texts = {
                'en attente': 'En attente',
                'confirmée': 'Confirmée',
                'annulée': 'Refusée',
                'terminée': 'Terminée'
            };
            return `<span class="badge ${badges[status] || 'bg-secondary'}">${texts[status] || 'Inconnu'}</span>`;
        };

        // Génère le tableau HTML
        const generateTable = (resList, showActions) => {
            if (resList.length === 0) {
                return '<p class="text-center text-muted my-3">Aucune réservation</p>';
            }

            let html = `
                <div class="table-responsive shadow rounded mb-4">
                    <table class="table table-hover table-striped table-bordered align-middle">
                        <thead class="table-dark text-center">
                            <tr>
                                <th>Nom</th>
                                <th>Téléphone</th>
                                <th>Email</th>
                                <th>Date début</th>
                                <th>Date fin</th>
                                <th>Personnes</th>
                                <th>Demande</th>
                                <th>Statut</th>
                                ${showActions ? '<th>Actions</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
            `;

            resList.forEach(r => {
                html += `
                    <tr>
                        <td>${r.nom || '-'}</td>
                        <td>${r.tel || '-'}</td>
                        <td>${r.email || '-'}</td>
                        <td>${r['date de debut'] || '-'}</td>
                        <td>${r['date de fin'] || '-'}</td>
                        <td class="text-center"><span class="badge bg-info">${r.nbr_personne || '0'}</span></td>
                        <td>${r.demande || '-'}</td>
                        <td class="text-center">${getStatusBadge(r.status)}</td>
                `;
                if (showActions) {
                    html += `
                        <td class="text-center">
                            <button class="btn btn-sm btn-success me-2 btn-validate" data-id="${r.id}">Valider</button>
                            <button class="btn btn-sm btn-danger btn-reject" data-id="${r.id}">Refuser</button>
                        </td>
                    `;
                }
                html += `</tr>`;
            });

            html += `</tbody></table></div>`;
            return html;
        };

        // Filtre les réservations "en attente" par défaut
        let enAttente = reservations.filter(r => r.status === 'en attente');

        // HTML final avec le filtre (sans "Toutes")
        let html = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h2 class="fw-bold text-center">
                    <i class="bi bi-calendar-check text-primary"></i> Réservations en attente
                </h2>
                <select class="form-select w-auto" id="filterStatus">
                    <option value="confirmée">Confirmées</option>
                    <option value="annulée">Annulées</option>
                    <option value="terminée">Terminées</option>
                </select>
            </div>
            <div id="reservationsTable">${generateTable(enAttente, true)}</div>
        `;

        $('#adminContent').removeClass('d-none').addClass('d-block').html(html);
        $('#dashboardHome').addClass('d-none').removeClass('d-block');

        // Gestion du filtre
        $('#filterStatus').on('change', function() {
            const filter = $(this).val();
            const filtered = reservations.filter(r => r.status === filter);
            // Met à jour le tableau avec les réservations filtrées
            $('#reservationsTable').html(generateTable(filtered, false)); 
        });

    }, 'json');
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