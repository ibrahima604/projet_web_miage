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

// Calcul du total d'une réservation 
function calculerTotal(r, prestations) {
    const jours       = calculateDays(r['date de debut'], r['date de fin']);
    const prixChambre = r.prix ?? 0;
    const reduction   = r.reduction ?? 0;
    const dejaIds     = r.prestations ?? [];

    const sousTotal   = jours * prixChambre;
    const totalPrest  = dejaIds.reduce((acc, id) => {
        const p = prestations.find(x => x.id === id);
        return acc + (p ? p.prix : 0);
    }, 0);
    const baseHT  = sousTotal + totalPrest;
    const remise  = baseHT * (reduction / 100);
    return { jours, sousTotal, totalPrest, baseHT, remise, total: baseHT - remise, reduction };
}

$(document).ready(function () {

    // ── Déconnexion
    $('#logout').on('click', function (e) {
        e.preventDefault();
        $.post('../api/logout.php', function (r) {
            if (r.success) window.location.replace('../pages/login.html');
        }, 'json');
    });

    // ── Profil 
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
                                <h5 class="mb-4 fw-semibold">
                                    <i class="bi bi-person-circle me-2 text-primary"></i>Mon Profil
                                </h5>
                                <form id="updateProfileForm">
                                    <div id="Message" class="alert d-none" role="alert"></div>
                                    <div class="mb-3">
                                        <label class="form-label small text-muted">
                                            <i class="bi bi-envelope-fill me-1"></i>Email
                                        </label>
                                        <input type="email" class="form-control" value="${u.email}" readonly>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label small text-muted">
                                            <i class="bi bi-person-fill me-1"></i>Nom complet
                                        </label>
                                        <input type="text" class="form-control" name="nom" value="${u.nom}">
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label small text-muted">
                                            <i class="bi bi-telephone-fill me-1"></i>Téléphone
                                        </label>
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
                                <h5 class="mb-4 fw-semibold">
                                    <i class="bi bi-lock-fill me-2 text-danger"></i>Modifier le mot de passe
                                </h5>
                                <form id="updatePasswordForm">
                                    <div class="mb-3">
                                        <label class="form-label small text-muted">
                                            <i class="bi bi-key-fill me-1"></i>Ancien mot de passe
                                        </label>
                                        <input type="password" class="form-control" name="old_password" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label small text-muted">
                                            <i class="bi bi-shield-lock-fill me-1"></i>Nouveau mot de passe
                                        </label>
                                        <input type="password" class="form-control" name="new_password" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label small text-muted">
                                            <i class="bi bi-check-circle-fill me-1"></i>Confirmer
                                        </label>
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

    // ── Mes Réservations ─────────────────────────────────────────
    $('#mesreservations').on('click', chargerReservations);

    function chargerReservations() {
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

            // Stocker en mémoire pour les mises à jour dynamiques
            window._reservationsData = response.reservations;
            window._prestationsData  = response.prestations ?? [];

            renderReservations(window._reservationsData, window._prestationsData);
        })
        .fail(function () {
            showToast('danger', 'Erreur lors du chargement des réservations.');
        });
    }

    function renderReservations(reservations, prestations) {

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

        const buildPrestOptions = (dejaIds = []) =>
            prestations
                .filter(p => !dejaIds.includes(p.id))
                .map(p => `<option value="${p.id}">${p.libelle} (+${p.prix} €)</option>`)
                .join('');

        const buildPrestBadges = (ids = []) => {
            if (!ids.length) return '<span class="text-muted fst-italic small">Aucune</span>';
            return ids.map(id => {
                const p = prestations.find(x => x.id === id);
                return p
                    ? `<span class="badge text-bg-light border text-dark me-1 mb-1"
                              title="${p.description ?? ''}">
                           <i class="bi bi-tag-fill text-primary me-1" style="font-size:10px"></i>${p.libelle}
                           <span class="text-muted ms-1" style="font-size:10px">${p.prix} €</span>
                       </span>`
                    : '';
            }).join('');
        };

        const modifiable = s => ['en attente', 'confirmée'].includes(s);

        const rows = reservations.map(r => {
            const { jours, total, reduction } = calculerTotal(r, prestations);
            const dejaIds      = r.prestations ?? [];
            const peutModifier = modifiable(r.status);
            const plusDispo    = prestations.filter(p => !dejaIds.includes(p.id)).length > 0;

            let colPrest = '';
            if (peutModifier && plusDispo) {
                colPrest = `
                    <div class="mb-1 prestations-badges" id="badges-${r.id}">
                        ${buildPrestBadges(dejaIds)}
                    </div>
                    <select class="form-select form-select-sm add-prestation-user mt-1"
                            data-id="${r.id}" id="select-${r.id}">
                        <option value="">+ Ajouter</option>
                        ${buildPrestOptions(dejaIds)}
                    </select>`;
            } else if (!peutModifier) {
                colPrest = `
                    <div class="mb-1">${buildPrestBadges(dejaIds)}</div>
                    <span class="text-muted small fst-italic">Non modifiable</span>`;
            } else {
                colPrest = `
                    <div class="mb-1">${buildPrestBadges(dejaIds)}</div>
                    <span class="text-success small">
                        <i class="bi bi-check-all me-1"></i>Toutes ajoutées
                    </span>`;
            }

            return `
            <tr data-id="${r.id}">
                <td>
                    <div class="fw-semibold">Chambre #${r.id_chambre}
                        <span class="badge text-bg-light border text-capitalize fw-normal ms-1" style="font-size:11px">
                            ${r.chambre?.type ?? ''}
                        </span>
                    </div>
                    <div class="text-muted small">${r.email}</div>
                </td>
                <td>
                    <div class="small">
                        <i class="bi bi-calendar-event text-muted me-1"></i>${r['date de debut']}
                    </div>
                    <div class="small text-muted">
                        <i class="bi bi-arrow-right me-1"></i>${r['date de fin']}
                    </div>
                </td>
                <td class="text-center">
                    <span class="badge text-bg-info">
                        <i class="bi bi-moon-stars-fill me-1" style="font-size:11px"></i>${jours}n
                    </span>
                </td>
                <td class="text-center">
                    <span class="badge text-bg-light border text-dark">
                        <i class="bi bi-people-fill me-1" style="font-size:11px"></i>${r.nbr_personne}
                    </span>
                </td>
                <td style="min-width:210px">${colPrest}</td>
                <td class="text-end fw-semibold total-cell" id="total-${r.id}">
                    ${total.toFixed(2)} €
                    ${reduction > 0
                        ? `<div class="text-success small">−${reduction}%</div>`
                        : ''}
                </td>
                <td class="text-center">${getStatusBadge(r.status)}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary btn-view-invoice
                                   d-inline-flex align-items-center gap-1" data-id="${r.id}">
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
                <span class="badge text-bg-secondary">${reservations.length} séjour(s)</span>
            </div>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th>Chambre</th>
                            <th>Séjour</th>
                            <th class="text-center">Durée</th>
                            <th class="text-center">Pers.</th>
                            <th>Prestations</th>
                            <th class="text-end">Total TTC</th>
                            <th class="text-center">Statut</th>
                            <th class="text-center">Facture</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>

            <!-- Modal Facture -->
            <div class="modal fade" id="factureModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg rounded-4">
                        <div class="modal-body p-0" id="factureBody"></div>
                    </div>
                </div>
            </div>
        `);
    }

    // ── Ajout prestation (mise à jour du total en temps réel) ────
    $(document).off('change', '.add-prestation-user')
               .on('change',  '.add-prestation-user', function () {
        const $select       = $(this);
        const reservationId = $select.data('id');
        const prestationId  = parseInt($select.val(), 10);
        if (!prestationId) return;

        $select.prop('disabled', true);

        $.ajax({
            url: '../api/addPrestationUser.php',
            method: 'POST',
            dataType: 'json',
            data: { reservation_id: reservationId, prestation_id: prestationId }
        })
        .done(function (res) {
            if (res.success) {
                // ── Mise à jour locale sans rechargement ──────────
                const prestations = window._prestationsData;
                const reservation = window._reservationsData.find(r => r.id === reservationId);

                if (reservation) {
                    if (!reservation.prestations) reservation.prestations = [];
                    reservation.prestations.push(prestationId);

                    // Recalculer et mettre à jour la cellule total
                    const { total, reduction } = calculerTotal(reservation, prestations);
                    $(`#total-${reservationId}`).html(
                        `${total.toFixed(2)} €` +
                        (reduction > 0
                            ? `<div class="text-success small">−${reduction}%</div>`
                            : '')
                    );

                    // Mettre à jour les badges
                    const buildBadge = (id) => {
                        const p = prestations.find(x => x.id === id);
                        return p
                            ? `<span class="badge text-bg-light border text-dark me-1 mb-1"
                                      title="${p.description ?? ''}">
                                   <i class="bi bi-tag-fill text-primary me-1" style="font-size:10px"></i>${p.libelle}
                                   <span class="text-muted ms-1" style="font-size:10px">${p.prix} €</span>
                               </span>`
                            : '';
                    };
                    $(`#badges-${reservationId}`).html(
                        reservation.prestations.map(buildBadge).join('')
                    );

                    // Retirer la prestation du dropdown
                    $select.find(`option[value="${prestationId}"]`).remove();

                    // Si plus de prestations disponibles, supprimer le select
                    const restantes = prestations.filter(p => !reservation.prestations.includes(p.id));
                    if (restantes.length === 0) {
                        $select.replaceWith(
                            `<span class="text-success small">
                                <i class="bi bi-check-all me-1"></i>Toutes ajoutées
                             </span>`
                        );
                    } else {
                        $select.val('').prop('disabled', false);
                    }
                }

                showToast('success', 'Prestation ajoutée, total mis à jour !');
            } else {
                showToast('danger', res.error ?? "Impossible d'ajouter la prestation.");
                $select.val('').prop('disabled', false);
            }
        })
        .fail(function () {
            showToast('danger', "Erreur réseau lors de l'ajout.");
            $select.val('').prop('disabled', false);
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

        $.ajax({
            url: '../api/facture.php',
            method: 'GET',
            data: { id: reservationId },
            dataType: 'json'
        })
        .done(function (response) {
            if (!response.success) {
                $('#factureBody').html(
                    `<div class="alert alert-danger m-4">Facture introuvable.</div>`
                );
                return;
            }

            const f  = response.reservation;
            const ch = f.chambre ?? {};

            // Utiliser les données locales à jour (avec prestations ajoutées en live)
            const localRes = (window._reservationsData ?? []).find(r => r.id === f.id);
            if (localRes) {
                f.prestations         = localRes.prestations ?? [];
                f.prestations_detail  = (f.prestations).map(id => {
                    return (window._prestationsData ?? []).find(p => p.id === id) ?? null;
                }).filter(Boolean);
            }

            const { jours, sousTotal, baseHT, remise, total: totalTTC, reduction } =
                calculerTotal(f, window._prestationsData ?? []);

            const prixNuit   = ch.prix ?? f.prix ?? 0;
            const dateFacture = new Date().toLocaleDateString('fr-FR', {
                day: '2-digit', month: 'long', year: 'numeric'
            });
            const numFacture = 'BL-' + String(f.id).slice(-6).toUpperCase();

            const prestDetails = f.prestations_detail ?? [];
            const prestRows = prestDetails.length
                ? prestDetails.map(p => `
                    <tr>
                        <td>
                            <i class="bi bi-check2-circle text-success me-1"></i>
                            ${p.libelle}
                        </td>
                        <td class="text-muted small">${p.description ?? ''}</td>
                        <td class="text-end fw-semibold">${p.prix.toFixed(2)} €</td>
                    </tr>`).join('')
                : `<tr>
                       <td colspan="3" class="text-muted fst-italic small">Aucune prestation</td>
                   </tr>`;

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

                    <!-- Infos client / séjour -->
                    <div class="row g-3 mb-4">
                        <div class="col-md-6">
                            <div class="bg-light rounded-3 p-3">
                                <div class="text-muted small mb-2 text-uppercase fw-semibold"
                                     style="letter-spacing:.05em">Client</div>
                                <div class="fw-semibold">${f.nom}</div>
                                <div class="small text-muted">${f.email}</div>
                                <div class="small text-muted">
                                    <i class="bi bi-telephone me-1"></i>${f.tel}
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="bg-light rounded-3 p-3">
                                <div class="text-muted small mb-2 text-uppercase fw-semibold"
                                     style="letter-spacing:.05em">Séjour</div>
                                <div class="fw-semibold">
                                    Chambre #${f.id_chambre}
                                    <span class="badge text-bg-primary ms-1 fw-normal text-capitalize">
                                        ${ch.type ?? ''}
                                    </span>
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

                    <!-- Tableau des lignes -->
                    <table class="table table-borderless mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Description</th>
                                <th class="text-muted small">Détail</th>
                                <th class="text-end">Montant</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <i class="bi bi-house-door text-primary me-1"></i>
                                    Hébergement — ${ch.type ?? 'chambre #' + f.id_chambre}
                                </td>
                                <td class="text-muted small">
                                    ${jours}n × ${prixNuit.toFixed(2)} €
                                </td>
                                <td class="text-end fw-semibold">${sousTotal.toFixed(2)} €</td>
                            </tr>
                            ${prestRows}
                        </tbody>
                    </table>

                    <hr>

                    <!-- Totaux -->
                    <div class="d-flex flex-column align-items-end gap-1 mb-3">
                        <div class="d-flex justify-content-between" style="min-width:260px">
                            <span class="text-muted">Sous-total HT</span>
                            <span>${baseHT.toFixed(2)} €</span>
                        </div>
                        ${reduction > 0 ? `
                        <div class="d-flex justify-content-between text-success"
                             style="min-width:260px">
                            <span>Réduction (−${reduction}%)</span>
                            <span>−${remise.toFixed(2)} €</span>
                        </div>` : ''}
                        <div class="d-flex justify-content-between fw-bold fs-5 border-top pt-2 mt-1"
                             style="min-width:260px">
                            <span>Total TTC</span>
                            <span class="text-primary">${totalTTC.toFixed(2)} €</span>
                        </div>
                    </div>

                    <!-- Demande spéciale -->
                    ${f.demande ? `
                    <div class="alert alert-light border small mb-4">
                        <i class="bi bi-chat-left-text me-1 text-muted"></i>
                        <strong>Demande spéciale :</strong> ${f.demande}
                    </div>` : ''}

                    <!-- Boutons -->
                    <div class="d-flex justify-content-end gap-2">
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

    // ── Mise à jour profil ───────────────────────────────────────
    $(document).on('submit', '#updateProfileForm', function (e) {
        e.preventDefault();
        const nom   = $(this).find('[name="nom"]').val();
        const tel   = $(this).find('[name="tel"]').val();
        const email = $(this).find('[type="email"]').val();

        $.ajax({
            url: '../api/update_profile.php',
            method: 'POST',
            data: { nom, tel, email },
            dataType: 'json'
        })
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
            setTimeout(() => $msg.fadeOut(300, () => $(this).addClass('d-none')), 4000);
        })
        .fail(function () {
            showToast('danger', 'Erreur lors de la mise à jour du profil.');
        });
    });

    requireUser(function (user) {
        $('.navbar-brand').append(' — ' + user.fullname);
    });
  // Gestionnaire pour l'onglet "Activités"
// Gestionnaire pour l'onglet "Activités"
$('#mesactivites').on('click', function (e) {
    e.preventDefault();
    $.ajax({
        url: '../api/activites.php',
        method: 'GET',
        dataType: 'json'
    })
    .done(function (response) {
        if (!response.success) {
            $('#dashboardContent').html(`
                <div class="text-center py-5 text-muted">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    Aucune activité trouvée.
                </div>`);
            return;
        }

        const activites = response.activites;

        const cards = activites.map(a => `
            <div class="col-md-4 col-sm-6">
                <div class="card border-0 rounded-4 h-100" style="box-shadow:0 2px 12px rgba(0,0,0,0.07);">
                    <div style="position:relative;height:200px;overflow:hidden;border-radius:16px 16px 0 0;background:#dbe8f4;">
                        <img
                            src="${a.image}"
                            alt="${a.nom}"
                            style="width:100%;height:100%;object-fit:cover;display:block;"
                            onerror="this.style.display='none'"
                        >
                        <span style="position:absolute;top:10px;right:10px;background:rgba(13,59,94,0.85);color:#fff;font-size:12px;font-weight:500;padding:4px 12px;border-radius:20px;">
                            ${a.prix} €/pers.
                        </span>
                    </div>
                    <div class="card-body d-flex flex-column gap-1 p-3">
                        <h5 class="card-title fw-semibold mb-0" style="font-size:14px;">${a.nom}</h5>
                        <p class="card-text text-muted flex-grow-1" style="font-size:12px;line-height:1.55;">${a.description}</p>
                        <div class="d-flex align-items-center justify-content-between mt-2 pt-2 border-top">
                            <small class="text-muted">
                                <i class="bi bi-people me-1"></i>${a.nb_personnes} pers. max
                            </small>
                            <button
                                class="btn btn-sm btn-primary rounded-3 d-flex align-items-center gap-1 btn-add-activite"
                                data-id="${a.id}"
                                data-nom="${a.nom.replace(/'/g, "\\'")}"
                                style="font-size:12px;background:#0d3b5e;border:none;padding:6px 14px;">
                                <i class="bi bi-plus-lg"></i> Ajouter
                            </button>
                        </div>
                    </div>
                </div>
            </div>`).join('');

        $('#dashboardContent').html(`
            <div class="d-flex align-items-center justify-content-between mb-4">
                <h5 class="fw-semibold mb-0">
                    <i class="bi bi-stars me-2 text-primary"></i>Mes activités
                </h5>
                <span class="badge rounded-pill text-bg-secondary">${activites.length} activité(s)</span>
            </div>
            <div class="row g-4">${cards}</div>
        `);
    })
    .fail(function () {
        $('#dashboardContent').html(`
            <div class="text-center py-5 text-danger">
                <i class="bi bi-exclamation-circle fs-1 d-block mb-2"></i>
                Erreur lors du chargement des activités.
            </div>`);
    });
});

// Fonction pour ouvrir la modale d'ajout d'activité
window.ouvrirModalActivite = function(actId, actNom) {
    $('#modalActiviteNom').text(actNom);
    $('#modalActiviteId').val(actId);
    
    // Charger les réservations confirmées du client connecté
    $.ajax({
        url: '../api/reservationsUser.php',
        method: 'GET',
        dataType: 'json'
    })
    .done(function (res) {
        if (!res.success || !res.reservations) {
            $('#selectReservation').html('<option value="">Aucune réservation confirmée</option>');
            return;
        }
        // Filtrer les réservations avec statut "confirmée" ou "confirmee"
        const confirmees = res.reservations.filter(r => r.status === 'confirmée' || r.status === 'confirmee');
        let options = `<option value="">— Choisir une réservation —</option>`;
        confirmees.forEach(r => {
            options += `
                <option value="${r.id}">
                    #${r.id} - Chambre ${r.id_chambre} (${r['date de debut']} → ${r['date de fin']})
                </option>
            `;
        });
        $('#selectReservation').html(options);
        // Cacher le champ nombre de personnes (optionnel)
        $('#nbPersonnes').closest('.mb-3').hide(); // on cache le champ
        new bootstrap.Modal(document.getElementById('modalActivite')).show();
    })
    .fail(function () {
        $('#selectReservation').html('<option value="">Erreur de chargement</option>');
        showToast('danger', 'Impossible de charger vos réservations.');
    });
};

// Délégation pour le clic sur "Ajouter" d'une activité
$(document).on('click', '.btn-add-activite', function () {
    const actId = $(this).data('id');
    const actNom = $(this).data('nom');
    ouvrirModalActivite(actId, actNom);
});

// Gestionnaire pour le bouton "Ajouter" dans la modale
$(document).on('click', '#btnAjouterActivite', function () {
    const activiteId = $('#modalActiviteId').val();
    const reservationId = $('#selectReservation').val();

    if (!reservationId) {
        showToast('warning', 'Veuillez choisir une réservation.');
        return;
    }

    // Appel API pour ajouter l'activité (sans nombre de personnes ni prix)
    $.ajax({
        url: '../api/ajouter_activite.php',
        method: 'POST',
        dataType: 'json',
        data: {
            activite_id: activiteId,
            reservation_id: reservationId
        }
    })
    .done(function (response) {
        if (response.success) {
            showToast('success', 'Activité ajoutée avec succès !');
            bootstrap.Modal.getInstance(document.getElementById('modalActivite')).hide();
            // Optionnel : rafraîchir la liste des activités ou des réservations
        } else {
            showToast('danger', response.message || 'Erreur lors de l\'ajout.');
        }
    })
    .fail(function () {
        showToast('danger', 'Erreur réseau.');
    });
});
});

// ── Toast Bootstrap 5 
function showToast(type, message) {
    const id = 'toast-' + Date.now();
    if (!$('#toastContainer').length) {
        $('body').append(
            '<div id="toastContainer" class="toast-container position-fixed bottom-0 end-0 p-3"' +
            ' style="z-index:1100"></div>'
        );
    }
    $('#toastContainer').append(`
        <div id="${id}" class="toast align-items-center text-bg-${type} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto"
                        data-bs-dismiss="toast"></button>
            </div>
        </div>`);
    const el = document.getElementById(id);
    new bootstrap.Toast(el, { delay: 4000 }).show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
}
