$(document).ready(function () {
    function requireAdmin(Callback) {
        $.ajax({
            url: '../api/check_session.php',
            method: 'GET',
            dataType: 'json',
            success: function (response) {
                if (response.loggedIn && response.user.role === 'admin') {
                    Callback(response.user);
                } else {
                    // Redirige si pas admin ou pas connecté
                    window.location.replace("../pages/login.html");
                }
            },
            error: function () {
                window.location.replace("../pages/login.html");
            }
        });
    }

    // Vérifie la session dès que la page se charge
    requireAdmin(function (user) {
        console.log("Admin connecté :", user);
        // Ici tu peux éventuellement afficher le nom de l'admin
        $('.navbar-brand').append(' - ' + user.fullname);
    });

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

    $('#linkUsers').click(function (event) {
        event.preventDefault();
        $.ajax({
            url: '../api/users.php',
            method: 'GET',
            dataType: 'json',
            success: function (users) {
                let html = `
            <h2 class="mb-4">Liste des utilisateurs</h2>
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
                            <button class="btn btn-sm btn-success me-2" onclick="editUser(${index})">
                                <i class="bi bi-pencil-square"></i> Modifier
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteUser(${index})">
                                <i class="bi bi-trash"></i> Supprimer
                            </button>
                        </td>
                    </tr>
                `;
                });

                html += `
                    </tbody>
                </table>
            </div>
            `;

                $('#adminContent')
                    .removeClass('d-none')
                    .addClass('d-block')
                    .html(html);
            },
            error: function (xhr) {
                if (xhr.status === 403) {
                    alert("Accès refusé : vous devez être connecté en admin");
                    window.location.replace("../pages/login.html");
                } else {
                    console.error("Erreur lors de la récupération des utilisateurs :", xhr);
                }
            }
        });

        $('#dashboardHome').addClass('d-none').removeClass('d-block');
    });

    // Fonctions pour les actions (à compléter)
    function editUser(index) {
        alert("Modifier l'utilisateur à l'index : " + index);
        // Ici tu peux ouvrir un modal ou un formulaire pour éditer l'utilisateur
    }

    function deleteUser(index) {
        if (confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) {
            alert("Supprimer l'utilisateur à l'index : " + index);
            // Ici tu feras un appel AJAX vers l'API pour supprimer l'utilisateur
        }
    }
    // Fonctions pour les actions des utilisateurs (modifier/supprimer)
    function editUser(index) {
        alert("Modifier l'utilisateur à l'index : " + index);
        // Ici tu peux ouvrir un modal ou un formulaire pour éditer l'utilisateur
    }

    function deleteUser(index) {
        if (confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) {
            alert("Supprimer l'utilisateur à l'index : " + index);
            // Ici tu feras un appel AJAX vers l'API pour supprimer l'utilisateur
        }
    }

    $('#linkReservations').click(function (event) {
        // Empêche le comportement par défaut du lien
        event.preventDefault();
        // Appel AJAX pour récupérer les réservations et les afficher dans un tableau
        $.ajax({
            url: '../api/reservations.php',
            method: 'GET',
            dataType: 'json',

            success: function (reservations) {
                // Construire le HTML du tableau des réservations
                let html = `
            <div class="d-flex justify-content-between align-items-center mb-4">
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
                        <th><i class="bi bi-calendar"></i> Date</th>
                        <th><i class="bi bi-people"></i> Personnes</th>
                        <th><i class="bi bi-chat-left-text"></i> Demande</th>
                        <th><i class="bi bi-info-circle"></i> Statut</th>
                        <th><i class="bi bi-gear"></i> Actions</th>
                    </tr>
                </thead>

                <tbody>
            `;

                reservations.forEach(function (res, index) {

                    let statusBadge = '';

                    if (res.status === "confirmée") {

                        statusBadge = `<span class="badge bg-success">Confirmée</span>`;

                    } else if (res.status === "annulée") {

                        statusBadge = `<span class="badge bg-danger">Refusée</span>`;

                    } else {

                        statusBadge = `<span class="badge bg-warning text-dark">En attente</span>`;
                    }
                    console.log("Réservation :", res,"index :", index);

                    html += `
                <tr>
                    <td>${res.nom}</td>
                    <td>${res.tel}</td>
                    <td>${res.email}</td>
                    <td>${res.date}</td>

                    <td class="text-center">
                        <span class="badge bg-info">${res.nbr_personne}</span>
                    </td>

                    <td>${res.demande|| '-'}</td>

                    <td class="text-center">
                        ${statusBadge}
                    </td>

                    <td class="text-center">

                        <button class="btn btn-sm btn-success me-2"
                            onclick="validateReservation(${index})">

                            <i class="bi bi-check-circle"></i>
                            Valider

                        </button>

                        <button class="btn btn-sm btn-danger"
                            onclick="rejectReservation(${index})">

                            <i class="bi bi-x-circle"></i>
                            Refuser

                        </button>

                    </td>

                </tr>
                `;
                });

                html += `
                </tbody>
                </table>
                </div>
            `;

                $('#adminContent')
                    .removeClass('d-none')
                    .addClass('d-block')
                    .html(html);

            },

            error: function (xhr) {

                if (xhr.status === 403) {

                    alert("Accès refusé : vous devez être connecté en admin");
                    window.location.replace("../pages/login.html");

                } else {

                    console.error("Erreur lors de la récupération des réservations :", xhr);

                }

            }

        });

        $('#dashboardHome').addClass('d-none').removeClass('d-block');

    });


// Fonctions pour valider une réservation
    function validateReservation(index) {

        $.ajax({

            url: '../api/updateReservationStatus.php',
            method: 'POST',

            data: {
                index: index,
                status: 'confirmée'
            },

            success: function () {

                alert("Réservation confirmée");

                $('#linkReservations').click();

            }

        });

    }


// Fonction pour refuser une réservation
    function rejectReservation(index) {

        $.ajax({

            url: '../api/updateReservationStatus.php',
            method: 'POST',

            data: {
                index: index,
                status: 'annulée'
            },

            success: function () {

                alert("Réservation refusée ");

                $('#linkReservations').click();

            }

        });

    }
})