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

    $.get('../api/reservations.php')
    .done(function (response) {

        let reservations = response.reservations || [];
        let prestations  = response.prestations  || [];

        const getStatusBadge = (status) => {
            const map = {
                'en attente': ['warning',   'text-dark', 'bi-clock-history'],
                'confirmée':  ['success',   '',          'bi-check-circle'],
                'annulée':    ['danger',    '',          'bi-x-circle'],
                'terminée':   ['secondary', '',          'bi-archive'],
            };
            const [bg, txt, icon] = map[status] ?? ['secondary', '', 'bi-question-circle'];
            return `<span class="badge text-bg-${bg} ${txt} d-inline-flex align-items-center gap-1">
                        <i class="bi ${icon}"></i>${status}
                    </span>`;
        };

        const prestationOptions = prestations.map(p =>
            `<option value="${p.id}">${p.libelle} (${p.prix}€)</option>`
        ).join('');

        const generateTable = (list) => {
            if (!list.length) {
                return `<div class="text-center text-muted py-5">
                            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                            Aucune réservation dans cette catégorie.
                        </div>`;
            }

            let rows = '';
            list.forEach(r => {
                const status = r.status;

                // Actions selon statut
                let actions = '';
                if (status === 'en attente') {
                    actions = `
                        <button class="btn btn-sm btn-success btn-validate d-inline-flex align-items-center gap-1" data-id="${r.id}">
                            <i class="bi bi-check-lg"></i> Valider
                        </button>
                        <button class="btn btn-sm btn-danger btn-reject d-inline-flex align-items-center gap-1" data-id="${r.id}">
                            <i class="bi bi-x-lg"></i> Refuser
                        </button>`;
                } else if (status === 'confirmée') {
                    actions = `
                        <button class="btn btn-sm btn-outline-primary btn-edit d-inline-flex align-items-center gap-1" data-id="${r.id}">
                            <i class="bi bi-pencil"></i> Modifier
                        </button>`;
                }
                // terminée / annulée → rien

                rows += `
                <tr>
                    <td>
                        <div class="fw-semibold">${r.nom}</div>
                        <div class="text-muted small">#${r.id}</div>
                    </td>
                    <td>
                        <div class="d-flex align-items-center gap-1 small">
                            <i class="bi bi-calendar-event text-muted"></i>
                            <span>${r['date de debut']}</span>
                        </div>
                        <div class="d-flex align-items-center gap-1 small text-muted">
                            <i class="bi bi-arrow-right"></i>
                            <span>${r['date de fin']}</span>
                        </div>
                    </td>
                    <td class="text-center">
                        <span class="badge text-bg-info">
                            <i class="bi bi-people-fill me-1"></i>${r.nbr_personne}
                        </span>
                    </td>
                    <td style="min-width:180px">
                        <select class="form-select form-select-sm add-prestation" data-id="${r.id}">
                            <option value="">+ Ajouter une prestation</option>
                            ${prestationOptions}
                        </select>
                        <div class="mt-1 small text-muted prestations-list" id="prest-${r.id}">
                            ${r.prestations?.length
                                ? r.prestations.map(p => `<span class="badge text-bg-secondary me-1">${p}</span>`).join('')
                                : '<span class="fst-italic">Aucune</span>'}
                        </div>
                    </td>
                    <td class="text-center" style="min-width:110px">
                        <select class="form-select form-select-sm reduction" data-id="${r.id}">
                            <option value="0">0 %</option>
                            <option value="10">−10 %</option>
                            <option value="20">−20 %</option>
                            <option value="50">−50 %</option>
                        </select>
                    </td>
                    <td class="text-center">${getStatusBadge(status)}</td>
                    <td class="text-center" style="min-width:160px">
                        <div class="d-flex gap-1 justify-content-center flex-wrap">${actions}</div>
                    </td>
                </tr>`;
            });

            return `
            <div class="table-responsive">
                <table class="table table-hover align-middle text-start mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Client</th>
                            <th>Séjour</th>
                            <th class="text-center">Pers.</th>
                            <th>Prestations</th>
                            <th class="text-center">Réduction</th>
                            <th class="text-center">Statut</th>
                            <th class="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
        };

        // Tabs de filtrage
        const tabs = [
            { key: 'en attente', label: 'En attente',  icon: 'bi-clock-history',  color: 'warning'   },
            { key: 'confirmée',  label: 'Confirmées',  icon: 'bi-check-circle',   color: 'success'   },
            { key: 'terminée',   label: 'Terminées',   icon: 'bi-archive',        color: 'secondary' },
            { key: 'annulée',    label: 'Annulées',    icon: 'bi-x-circle',       color: 'danger'    },
        ];

        const tabNav = tabs.map(t => {
            const count = reservations.filter(r => r.status === t.key).length;
            return `
            <li class="nav-item">
                <button class="nav-link filter-tab ${t.key === 'en attente' ? 'active' : ''}"
                        data-filter="${t.key}" type="button">
                    <i class="bi ${t.icon} me-1"></i>${t.label}
                    <span class="badge text-bg-${t.color} ms-1">${count}</span>
                </button>
            </li>`;
        }).join('');

        const ui = `
        <div class="card border-0 shadow-sm">
            <div class="card-body p-0">
                <div class="px-4 pt-4 pb-0 border-bottom">
                    <h5 class="mb-3 fw-semibold">
                        <i class="bi bi-calendar2-check me-2 text-primary"></i>Gestion des réservations
                    </h5>
                    <ul class="nav nav-tabs border-0" id="reservationTabs">${tabNav}</ul>
                </div>
                <div class="p-3" id="reservationsTable"></div>
            </div>
        </div>`;

        $('#adminContent').html(ui);
        $('#dashboardHome').addClass('d-none');

        let currentFilter = 'en attente';

        const updateTable = () => {
            const filtered = reservations.filter(r => r.status === currentFilter);
            $('#reservationsTable').html(generateTable(filtered));
        };

        updateTable();

        // Changement d'onglet
        $(document).on('click', '.filter-tab', function () {
            $('.filter-tab').removeClass('active');
            $(this).addClass('active');
            currentFilter = $(this).data('filter');
            updateTable();
        });

        // Ajout de prestation
        $(document).on('change', '.add-prestation', function () {
            const reservationId = $(this).data('id');
            const prestationId  = $(this).val();
            if (!prestationId) return;

            $.ajax({ url: '../api/addPrestation.php', method: 'POST',
                     data: { reservation_id: reservationId, prestation_id: prestationId } })
            .done(function (res) {
                if (res.success) {
                    $('#linkReservations').trigger('click');
                } else {
                    showToast('danger', "Impossible d'ajouter la prestation : " + res.error);
                }
            })
            .fail(function () {
                showToast('danger', "Erreur réseau lors de l'ajout de la prestation.");
            });
        });

        // Mise à jour réduction
        $(document).on('change', '.reduction', function () {
            const reservationId = $(this).data('id');
            const reduction     = $(this).val();

            $.ajax({ url: '../api/updateReduction.php', method: 'POST',
                     data: { reservation_id: reservationId, reduction: reduction } })
            .done(function (res) {
                if (res.success) {
                    $('#linkReservations').trigger('click');
                } else {
                    showToast('danger', "Impossible de mettre à jour la réduction : " + res.error);
                }
            })
            .fail(function () {
                showToast('danger', "Erreur réseau lors de la mise à jour de la réduction.");
            });
        });
    })
    .fail(function () {
        $('#adminContent').html(`
            <div class="alert alert-danger d-flex align-items-center gap-2 mt-3">
                <i class="bi bi-exclamation-triangle-fill fs-5"></i>
                Impossible de charger les réservations. Vérifiez votre connexion.
            </div>`);
    });
});

// Toast utilitaire (Bootstrap 5)
function showToast(type, message) {
    const id = 'toast-' + Date.now();
    const html = `
    <div id="${id}" class="toast align-items-center text-bg-${type} border-0" role="alert" aria-live="assertive">
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    </div>`;

    if (!$('#toastContainer').length) {
        $('body').append('<div id="toastContainer" class="toast-container position-fixed bottom-0 end-0 p-3"></div>');
    }
    $('#toastContainer').append(html);
    const el = document.getElementById(id);
    new bootstrap.Toast(el, { delay: 4000 }).show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
}
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