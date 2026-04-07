function calculateDays(startDate, endDate) {
    const start = new Date(startDate);
    const end   = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 3600 * 24));
}

function requireUser(callback) {
    $.ajax({ url: '../api/check_session.php', method: 'GET', dataType: 'json' })
    .done(function (response) {
        if (response.loggedIn && response.user.role === 'user') {
            callback(response.user);
        } else {
            window.location.replace('../pages/login.html');
        }
    })
    .fail(function () {
        window.location.replace('../pages/login.html');
    });
}

$(document).ready(function () {

    // Déconnexion
    $('#logout').on('click', function (e) {
        e.preventDefault();
        $.post('../api/logout.php', function (r) {
            if (r.success) window.location.replace('../pages/login.html');
        }, 'json');
    });

    // Profil
    $('#monprofil').on('click', function (e) {
        e.preventDefault();
        $.ajax({ url: '../api/profilUser.php', method: 'GET', dataType: 'json' })
        .done(function (response) {
            if (!response.success) { showToast('danger', 'Impossible de charger le profil.'); return; }
            const u = response.user;
            $('#dashboardContent').html(`
                <div class="row g-4">
                    <div class="col-md-6">
                        <div class="card border-0 shadow-sm rounded-4">
                            <div class="card-body p-4">
                                <h5 class="mb-4 fw-semibold"><i class="bi bi-person-circle me-2 text-primary"></i>Mon Profil</h5>
                                <form id="updateProfileForm">
                                    <div id="Message" class="alert d-none" role="alert"></div>
                                    <div class="mb-3">
                                        <label class="form-label small text-muted"><i class="bi bi-envelope-fill me-1"></i>Email</label>
                                        <input type="email" class="form-control" value="${u.email}" readonly>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label small text-muted"><i class="bi bi-person-fill me-1"></i>Nom complet</label>
                                        <input type="text" class="form-control" name="nom" value="${u.nom}">
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label small text-muted"><i class="bi bi-telephone-fill me-1"></i>Téléphone</label>
                                        <input type="text" class="form-control" name="tel" value="${u.tel}">
                                    </div>
                                    <button type="submit" class="btn btn-primary w-100">
                                        <i class="bi bi-save me-1"></i>Mettre à jour
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card border-0 shadow-sm rounded-4">
                            <div class="card-body p-4">
                                <h5 class="mb-4 fw-semibold"><i class="bi bi-lock-fill me-2 text-danger"></i>Modifier le mot de passe</h5>
                                <form id="updatePasswordForm">
                                    <div class="mb-3">
                                        <label class="form-label small text-muted"><i class="bi bi-key-fill me-1"></i>Ancien mot de passe</label>
                                        <input type="password" class="form-control" name="old_password" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label small text-muted"><i class="bi bi-shield-lock-fill me-1"></i>Nouveau mot de passe</label>
                                        <input type="password" class="form-control" name="new_password" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label small text-muted"><i class="bi bi-check-circle-fill me-1"></i>Confirmer</label>
                                        <input type="password" class="form-control" name="confirm_password" required>
                                    </div>
                                    <button type="submit" class="btn btn-danger w-100">
                                        <i class="bi bi-arrow-repeat me-1"></i>Changer le mot de passe
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            `);
        })
        .fail(function () { showToast('danger', 'Erreur lors du chargement du profil.'); });
    });

    // ── Mes Réservations ──────────────────────────────────────────
    $('#mesreservations').on('click', function (e) {
        e.preventDefault();
        $.ajax({ url: '../api/reservationsUser.php', method: 'GET', dataType: 'json' })
        .done(function (response) {
            if (!response || !response.success) {
                $('#dashboardContent').html(`
                    <div class="text-center py-5 text-muted">
                        <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                        Aucune réservation trouvée.
                    </div>`);
                return;
            }

            const getStatusBadge = (status) => {
                const map = {
                    'en attente': ['warning',   'text-dark', 'bi-clock-history'],
                    'confirmée':  ['success',   '',          'bi-check-circle-fill'],
                    'annulée':    ['danger',    '',          'bi-x-circle-fill'],
                    'terminée':   ['secondary', '',          'bi-archive-fill'],
                };
                const [bg, txt, icon] = map[status] ?? ['secondary', '', 'bi-question-circle'];
                return `<span class="badge text-bg-${bg} ${txt} d-inline-flex align-items-center gap-1 px-2 py-1">
                            <i class="bi ${icon}" style="font-size:11px"></i>${status}
                        </span>`;
            };

            const rows = response.reservations.map(r => {
                const jours = calculateDays(r['date de debut'], r['date de fin']);
                const prixChambre = r.prix ?? 0;
                const reduction   = r.reduction ?? 0;
                const sousTotal   = jours * prixChambre;
                const total       = sousTotal * (1 - reduction / 100);

                return `
                <tr>
                    <td>
                        <div class="fw-semibold">Chambre #${r.id_chambre}</div>
                        <div class="text-muted small">${r.email}</div>
                    </td>
                    <td>
                        <div class="small"><i class="bi bi-calendar-event text-muted me-1"></i>${r['date de debut']}</div>
                        <div class="small text-muted"><i class="bi bi-arrow-right me-1"></i>${r['date de fin']}</div>
                    </td>
                    <td class="text-center">
                        <span class="badge text-bg-info">
                            <i class="bi bi-moon-stars-fill me-1" style="font-size:11px"></i>${jours}j
                        </span>
                    </td>
                    <td class="text-center">
                        <span class="badge text-bg-light border text-dark">
                            <i class="bi bi-people-fill me-1" style="font-size:11px"></i>${r.nbr_personne}
                        </span>
                    </td>
                    <td class="text-end fw-semibold">${total.toFixed(2)} €
                        ${reduction > 0 ? `<div class="text-success small">−${reduction}%</div>` : ''}
                    </td>
                    <td class="text-center">${getStatusBadge(r.status)}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary btn-view-invoice d-inline-flex align-items-center gap-1"
                                data-id="${r.id}">
                            <i class="bi bi-receipt" style="font-size:13px"></i> Facture
                        </button>
                    </td>
                </tr>`;
            }).join('');

            $('#dashboardContent').html(`
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <h5 class="fw-semibold mb-0">
                        <i class="bi bi-calendar-check-fill me-2 text-primary"></i>Mes Réservations
                    </h5>
                    <span class="badge text-bg-secondary">${response.reservations.length} séjour(s)</span>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Chambre / Client</th>
                                <th>Séjour</th>
                                <th class="text-center">Durée</th>
                                <th class="text-center">Pers.</th>
                                <th class="text-end">Total</th>
                                <th class="text-center">Statut</th>
                                <th class="text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>

                <!-- Modal Facture -->
                <div class="modal fade" id="factureModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-lg modal-dialog-centered">
                        <div class="modal-content border-0 shadow-lg rounded-4">
                            <div class="modal-body p-0" id="factureBody">
                                <div class="text-center py-5">
                                    <div class="spinner-border text-primary" role="status"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `);
        })
        .fail(function () {
            showToast('danger', 'Erreur lors du chargement des réservations.');
        });
    });

    // ── Voir Facture ─────────────────────────────────────────────
    $(document).on('click', '.btn-view-invoice', function () {
        const reservationId = $(this).data('id');
        const modal = new bootstrap.Modal(document.getElementById('factureModal'));

        $('#factureBody').html(`
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-2 text-muted small">Chargement de la facture…</p>
            </div>`);
        modal.show();

        $.ajax({ url: '../api/facture.php', method: 'GET', data: { id: reservationId }, dataType: 'json' })
        .done(function (response) {
            if (!response.success) {
                $('#factureBody').html(`<div class="alert alert-danger m-4">Facture introuvable.</div>`);
                return;
            }

            const f  = response.reservation;
            const ch = f.chambre ?? {};
            const jours      = calculateDays(f['date de debut'], f['date de fin']);
            const prixNuit   = ch.prix ?? f.prix ?? 0;
            const reduction  = f.reduction ?? 0;
            const sousTotal  = jours * prixNuit;
            const prestationsDetail = f.prestations_detail ?? [];
            const totalPrest = prestationsDetail.reduce((acc, p) => acc + p.prix, 0);
            const baseHT     = sousTotal + totalPrest;
            const remise     = baseHT * (reduction / 100);
            const totalTTC   = baseHT - remise;
            const dateFacture = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
            const numFacture  = 'BL-' + String(f.id).slice(-6).toUpperCase();

            const prestRows = prestationsDetail.length
                ? prestationsDetail.map(p => `
                    <tr>
                        <td><i class="bi bi-check2-circle text-success me-1"></i>${p.libelle}</td>
                        <td class="text-muted small">${p.description ?? ''}</td>
                        <td class="text-end fw-semibold">${p.prix.toFixed(2)} €</td>
                    </tr>`).join('')
                : `<tr><td colspan="3" class="text-muted fst-italic">Aucune prestation</td></tr>`;

            $('#factureBody').html(`
                <div class="p-4 p-md-5">

                    <!-- En-tête -->
                    <div class="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
                        <div>
                            <h4 class="fw-bold text-primary mb-0">
                                <i class="bi bi-water me-2"></i>Blue Lagoon
                            </h4>
                            <div class="text-muted small mt-1">Hôtel & Resort · contact@bluelagoon.fr</div>
                        </div>
                        <div class="text-end">
                            <div class="fs-5 fw-bold text-dark">${numFacture}</div>
                            <div class="text-muted small">Émise le ${dateFacture}</div>
                            <span class="badge text-bg-success mt-1">Confirmée</span>
                        </div>
                    </div>

                    <hr class="mb-4">

                    <!-- Infos client / chambre -->
                    <div class="row g-3 mb-4">
                        <div class="col-md-6">
                            <div class="bg-light rounded-3 p-3">
                                <div class="text-muted small mb-1 text-uppercase fw-semibold" style="letter-spacing:.05em">Client</div>
                                <div class="fw-semibold">${f.nom}</div>
                                <div class="small text-muted">${f.email}</div>
                                <div class="small text-muted"><i class="bi bi-telephone me-1"></i>${f.tel}</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="bg-light rounded-3 p-3">
                                <div class="text-muted small mb-1 text-uppercase fw-semibold" style="letter-spacing:.05em">Séjour</div>
                                <div class="fw-semibold">Chambre #${f.id_chambre}
                                    <span class="badge text-bg-primary ms-1 fw-normal text-capitalize">${ch.type ?? ''}</span>
                                </div>
                                <div class="small text-muted mt-1">
                                    <i class="bi bi-calendar-event me-1"></i>${f['date de debut']}
                                    <i class="bi bi-arrow-right mx-1"></i>${f['date de fin']}
                                </div>
                                <div class="small text-muted">
                                    <i class="bi bi-moon-stars me-1"></i>${jours} nuit(s)
                                    &nbsp;·&nbsp;
                                    <i class="bi bi-people me-1"></i>${f.nbr_personne} pers.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Détail des lignes -->
                    <table class="table table-borderless mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Description</th>
                                <th></th>
                                <th class="text-end">Montant</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <i class="bi bi-house-door text-primary me-1"></i>
                                    Hébergement — chambre ${ch.type ?? '#' + f.id_chambre}
                                </td>
                                <td class="text-muted small">${jours}n × ${prixNuit.toFixed(2)} €</td>
                                <td class="text-end fw-semibold">${sousTotal.toFixed(2)} €</td>
                            </tr>
                            ${prestRows}
                        </tbody>
                    </table>

                    <hr>

                    <!-- Totaux -->
                    <div class="d-flex flex-column align-items-end gap-1">
                        <div class="d-flex justify-content-between" style="min-width:240px">
                            <span class="text-muted">Sous-total</span>
                            <span>${baseHT.toFixed(2)} €</span>
                        </div>
                        ${reduction > 0 ? `
                        <div class="d-flex justify-content-between text-success" style="min-width:240px">
                            <span>Réduction (−${reduction}%)</span>
                            <span>−${remise.toFixed(2)} €</span>
                        </div>` : ''}
                        <div class="d-flex justify-content-between fw-bold fs-5 border-top pt-2 mt-1" style="min-width:240px">
                            <span>Total TTC</span>
                            <span class="text-primary">${totalTTC.toFixed(2)} €</span>
                        </div>
                    </div>

                    <!-- Demande spéciale -->
                    ${f.demande ? `
                    <div class="alert alert-light border mt-4 mb-0 small">
                        <i class="bi bi-chat-left-text me-1 text-muted"></i>
                        <strong>Demande spéciale :</strong> ${f.demande}
                    </div>` : ''}

                    <!-- Actions -->
                    <div class="d-flex justify-content-end gap-2 mt-4">
                        <button class="btn btn-outline-secondary btn-sm" data-bs-dismiss="modal">
                            <i class="bi bi-x-lg me-1"></i>Fermer
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="window.print()">
                            <i class="bi bi-printer-fill me-1"></i>Imprimer
                        </button>
                    </div>

                </div>
            `);
        })
        .fail(function () {
            $('#factureBody').html(`
                <div class="alert alert-danger m-4">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Erreur réseau lors du chargement de la facture.
                </div>`);
        });
    });

    // Mise à jour profil
    $(document).on('submit', '#updateProfileForm', function (e) {
        e.preventDefault();
        const nom = $(this).find('[name="nom"]').val();
        const tel = $(this).find('[name="tel"]').val();
        const email = $(this).find('[type="email"]').val();

        $.ajax({ url: '../api/update_profile.php', method: 'POST', data: { nom, tel, email }, dataType: 'json' })
        .done(function (response) {
            const $msg = $('#Message');
            if (response.success) {
                $msg.removeClass('d-none alert-danger').addClass('alert-success')
                    .html(`<i class="bi bi-check-circle-fill me-2"></i>${response.message}`);
            } else {
                $msg.removeClass('d-none alert-success').addClass('alert-danger')
                    .html(`<i class="bi bi-exclamation-triangle-fill me-2"></i>${response.message}`);
            }
            $msg.hide().fadeIn(300);
            setTimeout(() => $msg.fadeOut(300, function () { $(this).addClass('d-none'); }), 4000);
        })
        .fail(function () { showToast('danger', 'Erreur lors de la mise à jour du profil.'); });
    });

    requireUser(function (user) {
        $('.navbar-brand').append(' — ' + user.fullname);
    });
});

// Toast Bootstrap 5
function showToast(type, message) {
    const id = 'toast-' + Date.now();
    if (!$('#toastContainer').length) {
        $('body').append('<div id="toastContainer" class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index:1100"></div>');
    }
    $('#toastContainer').append(`
        <div id="${id}" class="toast align-items-center text-bg-${type} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>`);
    const el = document.getElementById(id);
    new bootstrap.Toast(el, { delay: 4000 }).show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
}