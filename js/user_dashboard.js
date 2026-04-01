// ============================
// Vérification de la session
// ============================
function requireUser(callback) {
    $.ajax({
        url: '../api/check_session.php',
        method: 'GET',
        dataType: 'json'
    })
        .done(function (response) {
            if (response.loggedIn && response.user.role === 'user') {
                callback(response.user);
            } else {
                window.location.replace("../pages/login.html");
            }
        })
        .fail(function () {
            window.location.replace("../pages/login.html");
        });
}

// ============================
// Code principal
// ============================
$(document).ready(function () {

    // ============================
    // Déconnexion
    // ============================
    $('#logout').click(function (event) {
        event.preventDefault();
        $.post('../api/logout.php', function (response) {
            if (response.success) {
                window.location.replace("../pages/login.html");
            }
        }, 'json');
    });
    // Afficher le profil utilisateur
    $('#monprofil').click(function (event) {
        event.preventDefault();

        $.ajax({
            url: '../api/profilUser.php',
            method: 'GET',
            dataType: 'json'
        })
            .done(function (response) {
                if (!response.success) {
                    alert("Impossible de charger le profil.");
                    return;
                }

                const user = response.user;
                $('#dashboardContent').html(`
                <div class="container mt-4">
                    <div class="row">
                        <!-- PROFIL -->
                        <div class="col-md-6">
                            <div class="card shadow-lg border-0 rounded-4">
                                <div class="card-body">
                                    <h4 class="mb-4 text-center">
                                        <i class="bi bi-person-circle"></i> Mon Profil
                                    </h4>
                                    <form id="updateProfileForm">
                                        <div id="Message" class="alert d-none alert-dismissible fade show rounded-3 shadow-sm" role="alert"></div>
                                        <div class="mb-3">
                                            <label class="form-label"><i class="bi bi-envelope-fill"></i> Email</label>
                                            <input type="email" class="form-control rounded-3" value="${user.email}" readonly>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label"><i class="bi bi-person-fill"></i> Nom complet</label>
                                            <input type="text" class="form-control rounded-3" value="${user.nom}">
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label"><i class="bi bi-telephone-fill"></i> Téléphone</label>
                                            <input type="text" class="form-control rounded-3" value="${user.tel}">
                                        </div>
                                        <button type="submit" class="btn btn-primary w-100 rounded-3">
                                            <i class="bi bi-save"></i> Mettre à jour
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>

                        <!-- MOT DE PASSE -->
                        <div class="col-md-6">
                            <div class="card shadow-lg border-0 rounded-4">
                                <div class="card-body">
                                    <h4 class="mb-4 text-center">
                                        <i class="bi bi-lock-fill"></i> Modifier mot de passe
                                    </h4>
                                    <form id="updatePasswordForm">
                                        <div class="mb-3">
                                            <label class="form-label"><i class="bi bi-key-fill"></i> Ancien mot de passe</label>
                                            <input type="password" class="form-control rounded-3" required>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label"><i class="bi bi-shield-lock-fill"></i> Nouveau mot de passe</label>
                                            <input type="password" class="form-control rounded-3" required>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label"><i class="bi bi-check-circle-fill"></i> Confirmer mot de passe</label>
                                            <input type="password" class="form-control rounded-3" required>
                                        </div>
                                        <button type="submit" class="btn btn-danger w-100 rounded-3">
                                            <i class="bi bi-arrow-repeat"></i> Changer le mot de passe
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            `);
            })
            .fail(function () {
                alert("Erreur lors du chargement du profil.");
            });
    });
    // Afficher les réservations de l'utilisateur
 $('#mesreservations').click(function (e) {
    e.preventDefault();
    $.ajax({
        url: '../api/reservationsUser.php',
        method: 'GET',
        dataType: 'json'
    })
    .done(function (response) {
        if (response && response.success) {
            let html = `
            <div class="container mt-4">
                <h3 class="mb-4"><i class="bi bi-calendar-check-fill"></i> Mes Réservations</h3>
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th scope="col"><i class="bi bi-door-open"></i> Chambre</th>
                                <th scope="col"><i class="bi bi-tag"></i> Prix</th>
                                <th scope="col"><i class="bi bi-person"></i> Client</th>
                                <th scope="col"><i class="bi bi-calendar-event"></i> Date début</th>
                                <th scope="col"><i class="bi bi-calendar-check"></i> Date fin</th>
                                <th scope="col"><i class="bi bi-info-circle"></i> Statut</th>
                                <th scope="col"><i class="bi bi-gear"></i> Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${response.reservations.map(reservation => `
                                <tr>
                                    <td>${reservation.chambre.type} (ID: ${reservation.chambre.id})</td>
                                    <td>${reservation.prix} €</td>
                                    <td>${reservation.email}</td>
                                    <td>${reservation['date de debut']}</td>
                                    <td>${reservation['date de fin']}</td>
                                    <td>${reservation.status}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary me-2">
                                            <i class="bi bi-eye-fill"></i> Voir facture
                                        </button>
                                        <button class="btn btn-sm btn-primary me-2">
                                            <i class="bi bi-pencil-fill"></i> modifier
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            `;
            $('#dashboardContent').html(html);
            console.log("Chambres :", response.chambres);
        }
        else {
            console.log("Aucune réservation trouvée ou erreur serveur.");
        }
    })
    .fail(function (xhr, status, error) {
        console.error("Erreur AJAX :", status, error);
        alert("Erreur lors du chargement des réservations. Voir la console pour plus de détails.");
    });
});

    // Validation du formulaire de mise à jour du profil

    $(document).on('submit', '#updateProfileForm', function (event) {
        event.preventDefault();

        const nom = $(this).find('input[type="text"]').val();
        const tel = $(this).find('input[type="text"]').val();
        const email = $(this).find('input[type="email"]').val();

        $.ajax({
            url: '../api/update_profile.php',
            method: 'POST',
            data: { nom, tel, email },
            dataType: 'json'
        })
            .done(function (response) {
                const $msg = $('#Message');
                if (response.success) {
                    $msg.removeClass('d-none alert-danger alert-warning').addClass('alert-success')
                        .html(`<i class="bi bi-check-circle-fill me-2"></i>${response.message}`);
                } else {
                    $msg.removeClass('d-none alert-success').addClass('alert-danger')
                        .html(`<i class="bi bi-exclamation-triangle-fill me-2"></i>${response.message}`);
                }

                $msg.hide().fadeIn(300);
                setTimeout(() => $msg.fadeOut(300, function () { $(this).addClass('d-none').html(''); }), 4000);
            })
            .fail(function () {
                alert("Erreur lors de la mise à jour du profil.");
            });
    });

    // ============================
    // Vérifier si l'utilisateur est connecté au chargement de la page
    // ============================
    requireUser(function (user) {
        console.log("Utilisateur connecté :", user);
        $('.navbar-brand').append(' - ' + user.fullname);
    });

});