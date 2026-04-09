function calculateDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
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

/*
 * Calcule le total d'une réservation.
 * Lit r.chambre.prix en priorité (injecté par le PHP).
 * Seules les activités avec statut "confirmée" sont incluses dans le total.
 */
function calculerTotal(r, prestations) {
    const jours = calculateDays(r['date de debut'], r['date de fin']);

    // Cherche le prix dans tous les endroits possibles pour résister aux changements de statut
    const prixChambre = (r.chambre && r.chambre.prix != null)
        ? parseFloat(r.chambre.prix)
        : (r.prix != null ? parseFloat(r.prix) : 0);

    const reduction = r.reduction ?? 0;
    const dejaIds = r.prestations ?? [];

    const sousTotal = jours * prixChambre;

    const totalPrest = dejaIds.reduce((acc, id) => {
        const p = prestations.find(x => x.id === id);
        return acc + (p ? parseFloat(p.prix) : 0);
    }, 0);

    const activitesConfirmees = (r.activites ?? []).filter(act => act.statut === 'confirmée');
    const totalActivites = activitesConfirmees.reduce((acc, act) => {
        const prix = act.detail?.prix != null ? parseFloat(act.detail.prix) : 0;
        return acc + prix;
    }, 0);

    const baseHT = sousTotal + totalPrest + totalActivites;
    const remise = baseHT * (reduction / 100);

    return { jours, sousTotal, totalPrest, totalActivites, baseHT, remise, total: baseHT - remise, reduction, prixChambre };
}

$(document).ready(function () {

    $('#logout').on('click', function (e) {
        e.preventDefault();
        $.post('../api/logout.php', function (r) {
            if (r.success) window.location.replace('../pages/login.html');
        }, 'json');
    });
    // Charger le profil par défaut
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
                </div>`);
            })
            .fail(function () { showToast('danger', 'Erreur lors du chargement du profil.'); });
    });

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
                window._reservationsData = response.reservations;
                window._prestationsData = response.prestations ?? [];
                renderReservations(window._reservationsData, window._prestationsData);
            })
            .fail(function () {
                showToast('danger', 'Erreur lors du chargement des réservations.');
            });
    }

    function renderReservations(reservations, prestations) {

        const getStatusBadge = (status) => {
            const map = {
                'en attente': ['warning', 'text-dark', 'bi-clock-history'],
                'confirmée': ['success', '', 'bi-check-circle-fill'],
                'annulée': ['danger', '', 'bi-x-circle-fill'],
                'terminée': ['secondary', '', 'bi-archive-fill'],
            };
            const [bg, txt, icon] = map[status] ?? ['secondary', '', 'bi-question-circle'];
            return `<span class="badge text-bg-${bg} ${txt} d-inline-flex align-items-center gap-1 px-2 py-1">
                        <i class="bi ${icon}" style="font-size:11px"></i>${status}
                    </span>`;
        };

        const getActiviteStatutBadge = (statut) => {
            const map = {
                'en attente': ['warning', 'text-dark', 'bi-clock-history'],
                'confirmée': ['success', '', 'bi-check-circle-fill'],
                'annulée': ['danger', '', 'bi-x-circle-fill'],
            };
            const [bg, txt, icon] = map[statut] ?? ['secondary', '', 'bi-question-circle'];
            return `<span class="badge text-bg-${bg} ${txt} d-inline-flex align-items-center gap-1" style="font-size:10px">
                        <i class="bi ${icon}"></i>${statut}
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
                    ? `<span class="badge text-bg-light border text-dark me-1 mb-1" title="${p.description ?? ''}">
                           <i class="bi bi-tag-fill text-primary me-1" style="font-size:10px"></i>${p.libelle}
                           <span class="text-muted ms-1" style="font-size:10px">${p.prix} €</span>
                       </span>`
                    : '';
            }).join('');
        };

        const buildActivitesBadges = (activites = []) => {
            if (!activites.length) return '<span class="text-muted fst-italic small">Aucune</span>';
            return activites.map(act => {
                const d = act.detail ?? {};
                const nom = d.nom ?? `Activité #${act.id_activite}`;
                const prix = d.prix != null ? `${d.prix} €` : '';
                const image = d.image ?? '';
                const desc = d.description ?? '';
                return `
                    <div class="d-flex align-items-center gap-2 mb-1">
                        ${image
                        ? `<img src="${image}" alt="${nom}" style="width:28px;height:28px;object-fit:cover;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'">`
                        : `<span style="width:28px;height:28px;background:#dbe8f4;border-radius:6px;display:inline-block;flex-shrink:0;"></span>`
                    }
                        <div style="min-width:0">
                            <span class="badge text-bg-light border text-dark d-inline-flex align-items-center gap-1"
                                  title="${desc}" style="font-size:10px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                                <i class="bi bi-stars text-warning" style="font-size:9px;flex-shrink:0;"></i>
                                <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${nom}</span>
                                ${prix ? `<span class="text-muted ms-1" style="font-size:9px;flex-shrink:0;">${prix}</span>` : ''}
                            </span>
                            <div class="mt-1">${getActiviteStatutBadge(act.statut)}</div>
                        </div>
                    </div>`;
            }).join('');
        };

        const modifiable = s => ['en attente', 'confirmée'].includes(s);

        const rows = reservations.map(r => {
            const { jours, total, reduction } = calculerTotal(r, prestations);
            const dejaIds = r.prestations ?? [];
            const peutModifier = modifiable(r.status);
            const plusDispo = prestations.filter(p => !dejaIds.includes(p.id)).length > 0;

            let colPrest = '';
            if (peutModifier && plusDispo) {
                colPrest = `
                    <div class="mb-1 prestations-badges" id="badges-${r.id}">${buildPrestBadges(dejaIds)}</div>
                    <select class="form-select form-select-sm add-prestation-user mt-1" data-id="${r.id}" id="select-${r.id}">
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
                    <span class="text-success small"><i class="bi bi-check-all me-1"></i>Toutes ajoutées</span>`;
            }

            const colActivites = buildActivitesBadges(r.activites ?? []);

            return `
            <tr data-id="${r.id}">
                <td>
                    <div class="fw-semibold">Chambre #${r.id_chambre}
                        <span class="badge text-bg-light border text-capitalize fw-normal ms-1" style="font-size:11px">${r.chambre?.type ?? ''}</span>
                    </div>
                    <div class="text-muted small">${r.email}</div>
                </td>
                <td>
                    <div class="small"><i class="bi bi-calendar-event text-muted me-1"></i>${r['date de debut']}</div>
                    <div class="small text-muted"><i class="bi bi-arrow-right me-1"></i>${r['date de fin']}</div>
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
                <td style="min-width:180px">${colActivites}</td>
                <td class="text-end fw-semibold total-cell" id="total-${r.id}">
                    ${total.toFixed(2)} €
                    ${reduction > 0 ? `<div class="text-success small">−${reduction}%</div>` : ''}
                </td>
                <td class="text-center">${getStatusBadge(r.status)}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary btn-view-invoice d-inline-flex align-items-center gap-1" data-id="${r.id}">
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
                            <th>Activités</th>
                            <th class="text-end">Total TTC</th>
                            <th class="text-center">Statut</th>
                            <th class="text-center">Facture</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>

            <div class="modal fade" id="factureModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg rounded-4">
                        <div class="modal-body p-0" id="factureBody"></div>
                    </div>
                </div>
            </div>
        `);
    }

    $(document).off('change', '.add-prestation-user')
        .on('change', '.add-prestation-user', function () {
            const $select = $(this);
            const reservationId = $select.data('id');
            const prestationId = parseInt($select.val(), 10);
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
                        const prestations = window._prestationsData;
                        const reservation = window._reservationsData.find(r => r.id === reservationId);
                        if (reservation) {
                            if (!reservation.prestations) reservation.prestations = [];
                            reservation.prestations.push(prestationId);

                            const { total, reduction } = calculerTotal(reservation, prestations);
                            $(`#total-${reservationId}`).html(
                                `${total.toFixed(2)} €` +
                                (reduction > 0 ? `<div class="text-success small">−${reduction}%</div>` : '')
                            );

                            const buildBadge = (id) => {
                                const p = prestations.find(x => x.id === id);
                                return p
                                    ? `<span class="badge text-bg-light border text-dark me-1 mb-1" title="${p.description ?? ''}">
                                           <i class="bi bi-tag-fill text-primary me-1" style="font-size:10px"></i>${p.libelle}
                                           <span class="text-muted ms-1" style="font-size:10px">${p.prix} €</span>
                                       </span>`
                                    : '';
                            };
                            $(`#badges-${reservationId}`).html(reservation.prestations.map(buildBadge).join(''));
                            $select.find(`option[value="${prestationId}"]`).remove();

                            const restantes = prestations.filter(p => !reservation.prestations.includes(p.id));
                            if (restantes.length === 0) {
                                $select.replaceWith(`<span class="text-success small"><i class="bi bi-check-all me-1"></i>Toutes ajoutées</span>`);
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
                    $('#factureBody').html(`<div class="alert alert-danger m-4">Facture introuvable.</div>`);
                    return;
                }

                const f = response.reservation;

                /*
                 * FUSION AVEC LES DONNÉES LOCALES
                 * Les données locales contiennent chambre.prix enrichi par le PHP.
                 * On fusionne en prioritisant les données locales pour que la facture
                 * reste correcte même si le statut passe à "terminée".
                 */
                const localRes = (window._reservationsData ?? []).find(r => r.id === f.id);
                if (localRes) {
                    if (localRes.chambre) f.chambre = localRes.chambre;
                    if (localRes.prix) f.prix = localRes.prix;
                    if (localRes.activites) f.activites = localRes.activites;
                    f.prestations = localRes.prestations ?? [];
                    f.prestations_detail = f.prestations.map(id =>
                        (window._prestationsData ?? []).find(p => p.id === id) ?? null
                    ).filter(Boolean);
                }

                /*
                 * Si chambre.prix est toujours absent (réservation très ancienne),
                 * on tente de récupérer le prix depuis la réponse de l'API facture directement.
                 */
                if (!f.chambre?.prix && !f.prix && response.reservation?.chambre?.prix) {
                    f.chambre = response.reservation.chambre;
                    f.prix = response.reservation.chambre.prix;
                }

                const { jours, sousTotal, baseHT, remise, total: totalTTC, reduction, prixChambre } =
                    calculerTotal(f, window._prestationsData ?? []);

                const chambreType = f.chambre?.type ?? '';
                const dateFacture = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
                const numFacture = 'BL-' + String(f.id).slice(-6).toUpperCase();

                const prestDetails = f.prestations_detail ?? [];
                const prestRows = prestDetails.length
                    ? prestDetails.map(p => `
                        <tr>
                            <td><i class="bi bi-check2-circle text-success me-1"></i>${p.libelle}</td>
                            <td class="text-muted small">${p.description ?? ''}</td>
                            <td class="text-end fw-semibold">${parseFloat(p.prix).toFixed(2)} €</td>
                        </tr>`).join('')
                    : `<tr><td colspan="3" class="text-muted fst-italic small">Aucune prestation</td></tr>`;

                const activitesConfirmees = (f.activites ?? []).filter(act => act.statut === 'confirmée');
                const activiteRows = activitesConfirmees.map(act => {
                    const d = act.detail ?? {};
                    const nom = d.nom ?? `Activité #${act.id_activite}`;
                    const prix = d.prix != null ? parseFloat(d.prix) : 0;
                    return `
                        <tr>
                            <td><i class="bi bi-stars text-warning me-1"></i>${nom}</td>
                            <td class="text-muted small">${d.description ?? ''}</td>
                            <td class="text-end fw-semibold">${prix.toFixed(2)} €</td>
                        </tr>`;
                }).join('');

                const hasEnAttente = (f.activites ?? []).some(a => a.statut === 'en attente');

                const factureHTML = `
                <div class="p-4 p-md-5" id="factureContenu">
                    <div class="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
                        <div>
                            <h4 class="fw-bold text-primary mb-0"><i class="bi bi-water me-2"></i>Blue Lagoon</h4>
                            <div class="text-muted small mt-1">Hôtel & Resort · contact@bluelagoon.fr</div>
                        </div>
                        <div class="text-end">
                            <div class="fs-5 fw-bold text-dark">${numFacture}</div>
                            <div class="text-muted small">Émise le ${dateFacture}</div>
                            <span class="badge text-bg-success mt-1">Confirmée</span>
                        </div>
                    </div>
                    <hr class="mb-4">
                    <div class="row g-3 mb-4">
                        <div class="col-md-6">
                            <div class="bg-light rounded-3 p-3">
                                <div class="text-muted small mb-2 text-uppercase fw-semibold" style="letter-spacing:.05em">Client</div>
                                <div class="fw-semibold">${f.nom}</div>
                                <div class="small text-muted">${f.email}</div>
                                <div class="small text-muted"><i class="bi bi-telephone me-1"></i>${f.tel}</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="bg-light rounded-3 p-3">
                                <div class="text-muted small mb-2 text-uppercase fw-semibold" style="letter-spacing:.05em">Séjour</div>
                                <div class="fw-semibold">
                                    Chambre #${f.id_chambre}
                                    <span class="badge text-bg-primary ms-1 fw-normal text-capitalize">${chambreType}</span>
                                </div>
                                <div class="small text-muted mt-1">
                                    <i class="bi bi-calendar-event me-1"></i>${f['date de debut']}
                                    <i class="bi bi-arrow-right mx-1"></i>${f['date de fin']}
                                </div>
                                <div class="small text-muted">
                                    <i class="bi bi-moon-stars me-1"></i>${jours} nuit(s) &nbsp;·&nbsp;
                                    <i class="bi bi-people me-1"></i>${f.nbr_personne} pers.
                                </div>
                            </div>
                        </div>
                    </div>
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
                                <td><i class="bi bi-house-door text-primary me-1"></i>Hébergement — ${chambreType || 'chambre #' + f.id_chambre}</td>
                                <td class="text-muted small">${jours}n × ${prixChambre.toFixed(2)} €</td>
                                <td class="text-end fw-semibold">${sousTotal.toFixed(2)} €</td>
                            </tr>
                            ${prestRows}
                            ${activiteRows}
                        </tbody>
                    </table>
                    <hr>
                    <div class="d-flex flex-column align-items-end gap-1 mb-3">
                        <div class="d-flex justify-content-between" style="min-width:260px">
                            <span class="text-muted">Sous-total HT</span>
                            <span>${baseHT.toFixed(2)} €</span>
                        </div>
                        ${reduction > 0 ? `
                        <div class="d-flex justify-content-between text-success" style="min-width:260px">
                            <span>Réduction (−${reduction}%)</span>
                            <span>−${remise.toFixed(2)} €</span>
                        </div>` : ''}
                        <div class="d-flex justify-content-between fw-bold fs-5 border-top pt-2 mt-1" style="min-width:260px">
                            <span>Total TTC</span>
                            <span class="text-primary">${totalTTC.toFixed(2)} €</span>
                        </div>
                    </div>
                    ${hasEnAttente ? `
                    <div class="alert alert-warning border small mb-4">
                        <i class="bi bi-clock-history me-1"></i>
                        <strong>Activité(s) en attente</strong> — non incluses dans ce total. Elles seront ajoutées après confirmation par l'hôtel.
                    </div>` : ''}
                    ${f.demande ? `
                    <div class="alert alert-light border small mb-4">
                        <i class="bi bi-chat-left-text me-1 text-muted"></i>
                        <strong>Demande spéciale :</strong> ${f.demande}
                    </div>` : ''}
                    <div class="d-flex justify-content-end gap-2 no-print">
                        <button class="btn btn-outline-secondary btn-sm" data-bs-dismiss="modal">
                            <i class="bi bi-x-lg me-1"></i>Fermer
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="window.print()">
                            <i class="bi bi-printer-fill me-1"></i>Imprimer
                        </button>
                    </div>
                </div>`;

                $('#factureBody').html(factureHTML);

                /*
                 * Téléchargement PDF via html2canvas + jsPDF
                 * On capture le contenu HTML de la facture et on génère un PDF propre.
                 */
                $('#btnTelechargerPDF').off('click').on('click', function () {
                    const factureElement = document.getElementById('factureContenu');
                    html2canvas(factureElement, { scale: 2 }).then(canvas => {
                        const imgData = canvas.toDataURL('image/png');
                        const pdf = new jsPDF('p', 'mm', 'a4');
                        const imgProps = pdf.getImageProperties(imgData);
                        const pdfWidth = pdf.internal.pageSize.getWidth() - 20; // marges de 10mm de chaque côté
                        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                        pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);
                        pdf.save(`facture_${numFacture}.pdf`);
                    }).catch(() => {
                        showToast('danger', 'Erreur lors de la génération du PDF.');
                    });
                });

            })
            .fail(function () {
                $('#factureBody').html(`
                <div class="alert alert-danger m-4">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Erreur réseau lors du chargement de la facture.
                </div>`);
            });
    });

    $(document).on('submit', '#updateProfileForm', function (e) {
        e.preventDefault();
        const nom = $(this).find('[name="nom"]').val();
        const tel = $(this).find('[name="tel"]').val();
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

    $('#mesactivites').on('click', function (e) {
        e.preventDefault();
        $.ajax({ url: '../api/activites.php', method: 'GET', dataType: 'json' })
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
                            <img src="${a.image}" alt="${a.nom}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none'">
                        </div>
                        <div class="card-body d-flex flex-column gap-1 p-3">
                            <h5 class="card-title fw-semibold mb-0" style="font-size:14px;">${a.nom}</h5>
                            <p class="card-text text-muted flex-grow-1" style="font-size:12px;line-height:1.55;">${a.description}</p>
                            <div class="d-flex align-items-center justify-content-between mt-2 pt-2 border-top">
                                <small class="text-muted"><i class="bi bi-people me-1"></i>${a.nb_personnes} pers. max</small>
                                <button class="btn btn-sm btn-primary rounded-3 d-flex align-items-center gap-1 btn-add-activite"
                                        data-id="${a.id}" data-nom="${a.nom.replace(/'/g, "\\'")}"
                                        style="font-size:12px;background:#0d3b5e;border:none;padding:6px 14px;">
                                    <i class="bi bi-plus-lg"></i> Ajouter
                                </button>
                            </div>
                        </div>
                    </div>
                </div>`).join('');

                $('#dashboardContent').html(`
                <div class="d-flex align-items-center justify-content-between mb-4">
                    <h5 class="fw-semibold mb-0"><i class="bi bi-stars me-2 text-primary"></i>Mes activités</h5>
                    <span class="badge rounded-pill text-bg-secondary">${activites.length} activité(s)</span>
                </div>
                <div class="row g-4">${cards}</div>`);
            })
            .fail(function () {
                $('#dashboardContent').html(`
                <div class="text-center py-5 text-danger">
                    <i class="bi bi-exclamation-circle fs-1 d-block mb-2"></i>
                    Erreur lors du chargement des activités.
                </div>`);
            });
    });

    window.ouvrirModalActivite = function (actId, actNom) {
        $('#modalActiviteNom').text(actNom);
        $('#modalActiviteId').val(actId);

        $.ajax({ url: '../api/reservationsUser.php', method: 'GET', dataType: 'json' })
            .done(function (res) {
                if (!res.success || !res.reservations) {
                    $('#selectReservation').html('<option value="">Aucune réservation confirmée</option>');
                    return;
                }
                const confirmees = res.reservations.filter(r => r.status === 'confirmée' || r.status === 'confirmee');
                let options = `<option value="">— Choisir une réservation —</option>`;
                confirmees.forEach(r => {
                    options += `<option value="${r.id}">#${r.id} - Chambre ${r.id_chambre} (${r['date de debut']} → ${r['date de fin']})</option>`;
                });
                $('#selectReservation').html(options);
                $('#nbPersonnes').closest('.mb-3').hide();
                new bootstrap.Modal(document.getElementById('modalActivite')).show();
            })
            .fail(function () {
                $('#selectReservation').html('<option value="">Erreur de chargement</option>');
                showToast('danger', 'Impossible de charger vos réservations.');
            });
    };

    $(document).on('click', '.btn-add-activite', function () {
        ouvrirModalActivite($(this).data('id'), $(this).data('nom'));
    });

    $(document).on('click', '#btnAjouterActivite', function () {
        const activiteId = $('#modalActiviteId').val();
        const reservationId = $('#selectReservation').val();

        if (!reservationId) {
            showToast('warning', 'Veuillez choisir une réservation.');
            return;
        }

        $.ajax({
            url: '../api/ajouter_activite.php',
            method: 'POST',
            dataType: 'json',
            data: { activite_id: activiteId, reservation_id: reservationId }
        })
            .done(function (response) {
                if (response.success) {
                    showToast('success', 'Activité ajoutée avec succès !');
                    bootstrap.Modal.getInstance(document.getElementById('modalActivite')).hide();
                    chargerReservations();
                } else {
                    showToast('danger', response.message || "Erreur lors de l'ajout.");
                }
            })
            .fail(function (xhr) {
                showToast('danger', 'Erreur réseau : ' + xhr.status);
            });
    });
});

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