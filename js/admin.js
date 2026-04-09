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
                        <button class="btn btn-sm btn-danger btn-reject d-inline-flex align-items-center gap-1" id='btnRefuser'data-id="${r.id}">
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

        //le bouton refuser
        $(document).on('click', '.btn-reject', function () {
            let index = $(this).data('id');
            if (confirm("Voulez-vous vraiment refuser cette réservation ?")) {
                $.ajax(
                    {
                    url:'../api/supprimeReservation.php',
                    method:'POST',
                    data: { id: index }
                    ,
                    success: function (response) {
                        if (response.success) {
                            showToast('success', 'Réservation refusée');
                            $('#linkReservations').click();
                        } else {
                            showToast('danger', 'Erreur : ' + response.error);
                        }
                    },
                    error: function () {
                        showToast('danger', 'Erreur réseau');
                    }
                                });
                            }
                        });
                    

        // Ajout de prestation
        $(document).on('change', '.add-prestation', function (e) {
            e.preventDefault();
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
        $(document).on('change', '.reduction', function (e) {
            e.preventDefault();
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
$(document).on('click', '#linkActivites', function (e) {
    e.preventDefault();

    // Skeleton loader pendant le chargement
    $('#adminContent').html(`
        <div class="d-flex align-items-center justify-content-between mb-4">
            <h4 class="fw-bold mb-0">
                <i class="bi bi-stars me-2 text-primary"></i>Gestion des activités
            </h4>
        </div>
        <div class="row g-4">
            ${[1,2,3].map(() => `
            <div class="col-md-6 col-xl-4">
                <div class="card border-0 shadow-sm rounded-4 overflow-hidden placeholder-glow">
                    <div class="placeholder" style="height:160px;"></div>
                    <div class="card-body">
                        <h5 class="placeholder col-7 rounded mb-2"></h5>
                        <p class="placeholder col-4 rounded mb-4"></p>
                        <div class="placeholder col-12 rounded mb-3" style="height:8px;"></div>
                        <div class="placeholder col-12 rounded" style="height:72px;"></div>
                    </div>
                </div>
            </div>`).join('')}
        </div>

        <!-- Modal Calendrier -->
        <div class="modal fade" id="calendarModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                    <div class="modal-header bg-primary text-white border-0">
                        <h5 class="modal-title fw-semibold" id="calendarModalTitle">
                            <i class="bi bi-calendar3 me-2"></i>Calendrier
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <div id="calendar"></div>
                    </div>
                </div>
            </div>
        </div>
    `);

    $.ajax({ url: '../api/activitesAdmin.php', method: 'GET', dataType: 'json' })
        .done(function (response) {
            if (!response.success || !response.reservations) {
                $('#adminContent').html(`
                    <div class="alert alert-danger rounded-4">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>Données introuvables.
                    </div>`);
                return;
            }

            const reservations = response.reservations;
            let mapActivites   = {};

            reservations.forEach(r => {
                if (!r.activites || !r.activites.length) return;
                r.activites.forEach(a => {
                    const act = a.details ?? a.detail ?? {};
                    if (!mapActivites[a.id_activite]) {
                        mapActivites[a.id_activite] = {
                            participants: [],
                            total:    0,
                            capacite: parseInt(act.nb_personnes) || 1,
                            details:  act
                        };
                    }
                    mapActivites[a.id_activite].participants.push({
                        ...r,
                        statut_activite: a.statut
                    });
                    mapActivites[a.id_activite].total += parseInt(r.nbr_personne) || 0;
                });
            });

            const entries     = Object.entries(mapActivites);
            const nbTotal     = entries.length;
            const nbComplets  = entries.filter(([, d]) => d.total >= d.capacite).length;
            const nbAttente   = nbTotal - nbComplets;

            if (!nbTotal) {
                $('#adminContent').html(`
                    <div class="text-center py-5 text-muted">
                        <i class="bi bi-calendar-x fs-1 d-block mb-2"></i>
                        Aucune activité enregistrée pour le moment.
                    </div>`);
                return;
            }

            let cardsHTML = '';
            entries.forEach(([id_activite, data]) => {
                const complet   = data.total >= data.capacite;
                const pct       = Math.min(100, Math.round((data.total / data.capacite) * 100));
                const nom       = data.details.nom   ?? `Activité #${id_activite}`;
                const prix      = data.details.prix  != null ? `${data.details.prix} €` : '';
                const image     = data.details.image ?? '';
                const capacite  = data.details.nb_personnes ?? data.capacite;

                const participantRows = data.participants.map(p => {
                    const initials = (p.nom ?? '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
                    return `
                    <div class="d-flex align-items-center gap-2 p-2 rounded-3 bg-light border mb-1">
                        <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                             style="width:32px;height:32px;font-size:11px;">${initials}</div>
                        <div class="flex-grow-1 overflow-hidden">
                            <div class="fw-semibold text-truncate" style="font-size:12px;">${p.nom ?? 'Inconnu'}</div>
                            <div class="text-muted" style="font-size:10px;">
                                <i class="bi bi-calendar2-range me-1"></i>${p['date de debut'] ?? ''} → ${p['date de fin'] ?? ''}
                            </div>
                        </div>
                        <span class="badge text-bg-primary rounded-pill" style="font-size:10px;">${p.nbr_personne} pers.</span>
                    </div>`;
                }).join('');

                cardsHTML += `
                <div class="col-md-6 col-xl-4">
                    <div class="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">

                        <!-- Image -->
                        <div class="position-relative" style="height:160px;background:#dbeafe;overflow:hidden;">
                            ${image
                                ? `<img src="${image}" alt="${nom}"
                                        class="w-100 h-100 object-fit-cover d-block"
                                        onerror="this.style.display='none'">`
                                : `<div class="w-100 h-100 d-flex align-items-center justify-content-center">
                                       <i class="bi bi-stars text-primary opacity-25" style="font-size:56px;"></i>
                                   </div>`
                            }
                            <div class="position-absolute top-0 end-0 m-2">
                                <span class="badge rounded-pill ${complet ? 'text-bg-success' : 'text-bg-warning text-dark'}">
                                    <i class="bi bi-${complet ? 'check-circle-fill' : 'clock-history'} me-1"></i>
                                    ${complet ? 'Complet' : 'En attente'}
                                </span>
                            </div>
                        </div>

                        <div class="card-body d-flex flex-column p-3">

                            <!-- Nom + meta -->
                            <h6 class="fw-bold mb-0 text-truncate" title="${nom}">${nom}</h6>
                            <div class="text-muted mb-3" style="font-size:12px;">
                                ${prix ? `<i class="bi bi-tag-fill me-1 text-primary"></i>${prix}/pers &nbsp;·&nbsp;` : ''}
                                <i class="bi bi-people-fill me-1 text-primary"></i>Capacité : ${capacite}
                            </div>

                            <!-- Barre de progression -->
                            <div class="mb-3">
                                <div class="d-flex justify-content-between mb-1" style="font-size:12px;">
                                    <span class="text-muted">Participants</span>
                                    <strong>${data.total} / ${data.capacite}</strong>
                                </div>
                                <div class="progress rounded-pill" style="height:8px;">
                                    <div class="progress-bar ${complet ? 'bg-success' : 'bg-warning'} rounded-pill"
                                         role="progressbar"
                                         style="width:${pct}%;transition:width .8s ease;"
                                         aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
                                    </div>
                                </div>
                            </div>

                            <!-- Liste participants -->
                            <div class="flex-grow-1 overflow-auto mb-3" style="max-height:140px;">
                                ${participantRows || `<p class="text-muted text-center small py-2">Aucun participant</p>`}
                            </div>

                            <!-- Actions -->
                            <div class="d-flex gap-2 pt-2 border-top">
                                <button class="btn btn-outline-primary btn-sm flex-fill voir"
                                        data-id="${id_activite}"
                                        data-nom="${nom}"
                                        data-bs-toggle="modal"
                                        data-bs-target="#calendarModal">
                                    <i class="bi bi-calendar3 me-1"></i>Calendrier
                                </button>
                                <button class="btn btn-sm flex-fill valider
                                               ${complet ? 'btn-success' : 'btn-secondary'}"
                                        data-id="${id_activite}"
                                        ${!complet ? 'disabled title="Capacité non atteinte"' : ''}>
                                    <i class="bi bi-check-lg me-1"></i>${complet ? 'Valider' : 'Incomplet'}
                                </button>
                            </div>

                        </div>
                    </div>
                </div>`;
            });

            $('#adminContent').html(`
                <!-- En-tête + stats -->
                <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                    <div>
                        <h4 class="fw-bold mb-0">
                            <i class="bi bi-stars me-2 text-primary"></i>Gestion des activités
                        </h4>
                        <div class="text-muted small mt-1">${nbTotal} activité${nbTotal > 1 ? 's' : ''} enregistrée${nbTotal > 1 ? 's' : ''}</div>
                    </div>
                    <div class="d-flex gap-2 flex-wrap">
                        <span class="badge text-bg-primary rounded-pill px-3 py-2">
                            <i class="bi bi-grid me-1"></i>${nbTotal} total
                        </span>
                        <span class="badge text-bg-success rounded-pill px-3 py-2">
                            <i class="bi bi-check-circle me-1"></i>${nbComplets} complet${nbComplets > 1 ? 's' : ''}
                        </span>
                        <span class="badge text-bg-warning text-dark rounded-pill px-3 py-2">
                            <i class="bi bi-clock-history me-1"></i>${nbAttente} en attente
                        </span>
                    </div>
                </div>

                <!-- Cards -->
                <div class="row g-4">${cardsHTML}</div>

                <!-- Modal Calendrier -->
                <div class="modal fade" id="calendarModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-lg modal-dialog-centered">
                        <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div class="modal-header bg-primary text-white border-0">
                                <h5 class="modal-title fw-semibold" id="calendarModalTitle">
                                    <i class="bi bi-calendar3 me-2"></i>Calendrier
                                </h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body p-4">
                                <div id="calendar"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `);

            // Clic calendrier
            $(document).off('click', '.voir').on('click', '.voir', function () {
                const id_activite = $(this).data('id');
                const nom         = $(this).data('nom');
                const data        = mapActivites[id_activite];

                $('#calendarModalTitle').html(`<i class="bi bi-calendar3 me-2"></i>${nom}`);

                const events = data.participants.map(p => ({
                    title:           `${p.nom} (${p.nbr_personne} pers.)`,
                    start:           p['date de debut'],
                    end:             p['date de fin'],
                    backgroundColor: '#0d6efd',
                    borderColor:     '#0a58ca'
                }));

                setTimeout(() => {
                    const el = document.getElementById('calendar');
                    if (!el) return;
                    el.innerHTML = '';
                    new FullCalendar.Calendar(el, {
                        initialView: 'dayGridMonth',
                        locale:      'fr',
                        height:      420,
                        events:      events,
                        headerToolbar: {
                            left:   'prev,next today',
                            center: 'title',
                            right:  'dayGridMonth,timeGridWeek'
                        },
                        eventDidMount: info => {
                            info.el.setAttribute('title', info.event.title);
                        }
                    }).render();
                }, 250);
            });

            // Clic valider
            $(document).off('click', '.valider').on('click', '.valider', function () {
                const id_activite = $(this).data('id');
                const data        = mapActivites[id_activite];
                const nom         = data.details.nom ?? `Activité #${id_activite}`;
                const btn         = $(this);

                if (!confirm(`Valider "${nom}" pour ${data.total} participant(s) ?`)) return;

                btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Validation…');

                $.ajax({
                    url: '../api/validerActivite.php',
                    method: 'POST',
                    data: {
                        id_activite:  id_activite,
                        participants: data.participants.map(p => p.id)
                    },
                    dataType: 'json'
                })
                    .done(function () {
                        btn.removeClass('btn-success').addClass('btn-outline-success')
                           .html('<i class="bi bi-check-circle-fill me-1"></i>Validé !');
                        setTimeout(() => $('#linkActivites').trigger('click'), 1200);
                    })
                    .fail(function (xhr) {
                        const error = xhr.responseJSON?.error || 'Erreur inconnue';
                        btn.prop('disabled', false).html('<i class="bi bi-check-lg me-1"></i>Valider');
                        alert(`Échec : ${error}`);
                    });
            });
        })
        .fail(function (xhr) {
            const error = xhr.responseJSON?.error || 'Erreur de chargement';
            $('#adminContent').html(`
                <div class="alert alert-danger rounded-4">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>${error}
                </div>`);
        });
});

});