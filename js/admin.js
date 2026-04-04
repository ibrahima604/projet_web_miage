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
        <div class="card shadow-sm border-0">
            <div class="card-body">

                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h4 class="mb-0">👥 Liste des utilisateurs</h4>
                    <input type="text" id="searchUser" class="form-control w-25" placeholder="Rechercher...">
                </div>

                <div class="table-responsive">
                    <table class="table align-middle table-hover">
                        <thead class="table-light">
                            <tr class="text-center">
                                <th>Email</th>
                                <th>Nom</th>
                                <th>Rôle</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        users.forEach(function (user, index) {

            let roleBadge = user.role === 'admin'
                ? `<span class="badge bg-danger">Admin</span>`
                : `<span class="badge bg-primary">Client</span>`;

            html += `
                <tr class="text-center">
                    <td class="fw-semibold">${user.email}</td>
                    <td>${user.nom || '<span class="text-muted">Non renseigné</span>'}</td>
                    <td>${roleBadge}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-2 btn-edit" data-index="${index}">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-delete" data-index="${index}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
        `;

        $('#adminContent')
            .removeClass('d-none')
            .addClass('d-block')
            .html(html);

        $('#dashboardHome').addClass('d-none');

        // Fonction de recherche en temps réel
        $('#searchUser').on('keyup', function () {
            let value = $(this).val().toLowerCase();

            $('tbody tr').filter(function () {
                $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
            });
        });

        
        $('.btn-delete').click(function () {
            let index = $(this).data('index');
            let user = users[index];

            if (confirm("Supprimer " + user.email + " ?")) {
                console.log("Delete user:", user);
            }
        });

       
        $('.btn-edit').click(function () {
            let index = $(this).data('index');
            let user = users[index];

            alert("Modifier : " + user.email);
            
        });

    }, 'json');
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
// reservations
$('#linkReservations').on('click', function (e) {
    e.preventDefault();

    $.get('../api/reservations.php', function (response) {

        let reservations = response.reservations || [];
        let prestations = response.prestations || [];

        // statut
        const getStatusBadge = (status) => {
            const styles = {
                'en attente': 'bg-warning text-dark',
                'confirmée': 'bg-success',
                'annulée': 'bg-danger',
                'terminée': 'bg-secondary'
            };
            return `<span class="badge ${styles[status] || 'bg-secondary'}">${status}</span>`;
        };

        // Dropdown prestations
        const prestationOptions = prestations.map(p =>
            `<option value="${p.id}">${p.libelle} (${p.prix}€)</option>`
        ).join('');

        // fonction pour generer la table
        const generateTable = (list, showActions) => {

            let html = `
            <div class="table-responsive">
                <table class="table table-hover align-middle text-center">
                    <thead class="table-light">
                        <tr>
                            <th>Client</th>
                            <th>Séjour</th>
                            <th>Pers</th>
                            <th>Prestations</th>
                            <th>Réduction</th>
                            <th>Statut</th>
                            ${showActions ? '<th>Actions</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
            `;

            list.forEach(r => {

                html += `
                <tr>
                    <td>${r.nom}</td>

                    <td>
                        <strong>${r['date de debut']}</strong><br>
                        <small>${r['date de fin']}</small>
                    </td>

                    <td><span class="badge bg-info">${r.nbr_personne}</span></td>

                    <!-- PRESTATIONS -->
                    <td>
                        <select class="form-select form-select-sm add-prestation" data-id="${r.id}">
                            <option value="">+ Ajouter</option>
                            ${prestationOptions}
                        </select>

                        <div class="mt-1 small text-muted prestations-list" id="prest-${r.id}">
                            ${r.prestations ? r.prestations.join(', ') : ''}
                        </div>
                    </td>

                    <!-- REDUCTION -->
                    <td>
                        <select class="form-select form-select-sm reduction" data-id="${r.id}">
                            <option value="0">0%</option>
                            <option value="10">-10%</option>
                            <option value="20">-20%</option>
                            <option value="50">-50%</option>
                        </select>
                    </td>

                    <td>${getStatusBadge(r.status)}</td>
                `;

                if (showActions) {
                    html += `
                    <td>
                        <button class="btn btn-sm btn-outline-success btn-validate" data-id="${r.id}">
                            ✔
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-reject" data-id="${r.id}">
                            ✖
                        </button>
                    </td>
                    `;
                }

                html += `</tr>`;
            });

            html += `</tbody></table></div>`;
            return html;
        };

        // UI
        let html = `
        <div class="card shadow-sm border-0">
            <div class="card-body">
                <h4 class="mb-4">Gestion des réservations</h4>
                <div id="reservationsTable"></div>
            </div>
        </div>
        `;

        $('#adminContent').html(html);
        $('#dashboardHome').addClass('d-none');

        let currentFilter = 'en attente';

        const updateTable = () => {
            let filtered = reservations.filter(r => r.status === currentFilter);
            $('#reservationsTable').html(generateTable(filtered, true));
        };

        updateTable();

        // ajout de prestation a la demande du client
       // ajout de prestation à la demande du client
$(document).on('change', '.add-prestation', function () {
    let reservationId = $(this).data('id');
    let prestationId = $(this).val();

    if (!prestationId) return;

    $.ajax({
        url: '../api/addPrestation.php',
        method: 'POST',
        data: {
            reservation_id: reservationId,
            prestation_id: prestationId
        },
        success: function (response) {
            if (response.success) {
                // rafraîchir la liste des prestations dans la table
                $('#linkReservations').click();
            } else {
                console.error("Erreur API addPrestation:", response.error);
                alert("Impossible d'ajouter la prestation : " + response.error);
            }
        },
        error: function (xhr, status, error) {
            console.error("Erreur lors de l'ajout de la prestation :", error);
            alert("Impossible d'ajouter la prestation.");
        }
    });
});

// mise à jour de la réduction
$(document).on('change', '.reduction', function () {
    let reservationId = $(this).data('id');
    let reduction = $(this).val();

    $.ajax({
        url: '../api/updateReduction.php',
        method: 'POST',
        data: {
            reservation_id: reservationId,
            reduction: reduction
        },
        success: function (response) {
            if (response.success) {
                // rafraîchir la table
                $('#linkReservations').click();
            } else {
                console.error("Erreur API updateReduction:", response.error);
                alert("Impossible de mettre à jour la réduction : " + response.error);
            }
        },
        error: function (xhr, status, error) {
            console.error("Erreur lors de la mise à jour de la réduction :", error);
            alert("Impossible de mettre à jour la réduction.");
        }
    });
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