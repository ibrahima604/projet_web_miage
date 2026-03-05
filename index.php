<!DOCTYPE html>
<html lang="fr" data-bs-theme="light">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="src/images/logo_web.png" type="image/png">
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet"
        integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">


    <title>Blue Lagoon Évasion - Votre agence de voyage</title>
</head>

<body>
    <header>
        <nav class="navbar navbar-expand-lg navbar-dark fixed-top custom-navbar bg-dark shadow p-3 mb-5 rounded text-light">
            <div class="container-fluid">
                <a class="navbar-brand fw-bold d-flex align-items-center" href="#">
                    <img src="src/images/logo_web.png" width="60" height="60" class="d-inline-block align-text-top me-2 bg-white rounded-circle" alt="Logo">
                    Blue Lagoon Évasion</a>

                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent">
                    <span class="navbar-toggler-icon"></span>
                </button>

                <div class="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
                        <li class="nav-item">
                            <a class="nav-link active" href="/index.php">

                                Accueil</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#">À propos</a>
                        </li>
                        <li class="nav-item">
                            <button id="contactButton" class="btn btn-outline-light ms-2 px-3 " onclick="FormulaireContact()">Contact</button>

                        </li>
                        <li>
                            <button class="btn btn-outline-light ms-2 px-3">Espace Client</button>
                        </li>

                    </ul>
                    <button id="themeToggle" class="btn btn-outline-secondary ms-3" type="button">
                        🌙
                    </button>

                </div>
            </div>
        </nav>
    </header>
    <!-- Contenu principal de la page d'accueil -->
    <main class="container mt-5 pt-5">
        <div class="jumbotron text-center">
            <h1 class="display-4">Bienvenue sur Blue Lagoon Évasion</h1>
            <p class="lead">Votre agence de voyage pour des aventures inoubliables</p>
            <hr class="my-4">
            <p>Découvrez nos offres exclusives et réservez votre prochaine escapade dès aujourd'hui !</p>
            <a class="btn btn-primary btn-lg" href="#" role="button">Explorer les offres</a>
        </div>
        <!-- Section des activités proposées par l'agence de voyage -->
        <section class="mt-5">
            <h2 class="text-center">Nos Activités</h2>
            <div class="row mt-4">
                <div class="col-md-4">
                    <div class="card">
                        <img src="src/images/service1.jpg" class="card-img-top" alt="Service 1">
                        <div class="card-body">
                            <h5 class="card-title">Voyages en groupe</h5>
                            <p class="card-text">Découvrez nos voyages organisés pour des aventures inoubliables.</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <img src="src/images/service2.jpg" class="card-img-top" alt="Service 2">
                        <div class="card-body">
                            <h5 class="card-title">Séjours privés</h5>
                            <p class="card-text">Profitez de séjours privés dans des endroits magnifiques.</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <img src="src/images/service3.jpg" class="card-img-top" alt="Service 3">
                        <div class="card-body">
                            <h5 class="card-title">Activités nautiques</h5>
                            <p class="card-text">Participez à nos activités nautiques et découvrez la mer.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <div id="carouselExampleDark" class="carousel carousel-dark slide">
            <div class="carousel-indicators">
                <button type="button" data-bs-target="#carouselExampleDark" data-bs-slide-to="0" class="active" aria-current="true" aria-label="Slide 1"></button>
                <button type="button" data-bs-target="#carouselExampleDark" data-bs-slide-to="1" aria-label="Slide 2"></button>
                <button type="button" data-bs-target="#carouselExampleDark" data-bs-slide-to="2" aria-label="Slide 3"></button>
            </div>
            <div class="carousel-inner">
                <div class="carousel-item active" data-bs-interval="10000">
                    <img src="src/images/photo1.jpg" class="d-block w-100" alt="...">
                    <div class="carousel-caption d-none d-md-block">
                        <h5>First slide label</h5>
                        <p>Some representative placeholder content for the first slide.</p>
                    </div>
                </div>
                <div class="carousel-item" data-bs-interval="2000">
                    <img src="src/images/photo2.jpg" class="d-block w-100" alt="...">
                    <div class="carousel-caption d-none d-md-block">
                        <h5>Second slide label</h5>
                        <p>Some representative placeholder content for the second slide.</p>
                    </div>
                </div>
                <div class="carousel-item">
                    <img src="src/images/photo3.jpg" class="d-block w-100" alt="...">
                    <div class="carousel-caption d-none d-md-block">
                        <h5>Third slide label</h5>
                        <p>Some representative placeholder content for the third slide.</p>
                    </div>
                </div>
            </div>
            <button class="carousel-control-prev" type="button" data-bs-target="#carouselExampleDark" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Previous</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#carouselExampleDark" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Next</span>
            </button>
        </div>
        <!--formulaires de contact-->
        <section id="contactSection" class="mt-5 d-none">
            <h2 class="text-center">Contactez-nous</h2>
            <form class="mt-4">
                <div class="mb-3">
                    <label for="name" class="form-label">Nom</label>
                    <input type="text" class="form-control" id="name" placeholder="Votre nom">
                </div>
                <div class="mb-3">
                    <label for="email" class="form-label">Email</label>
                    <input type="email" class="form-control" id="email" placeholder="Votre email">
                </div>
                <div class="mb-3">
                    <label for="message" class="form-label">Message</label>
                    <textarea class="form-control" id="message" rows="4" placeholder="Votre message"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Envoyer</button>
            </form>
        </section>


    </main>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI"
        crossorigin="anonymous"></script>
    <script>
        // Fonction pour afficher/masquer le formulaire de contact
        function FormulaireContact() {
            console.log("FormulaireContact appelé");
            $('#contactSection').toggleClass('d-none');
            // Optionnel : scroll jusqu'au formulaire
            $('html, body').animate({
                scrollTop: $('#contactSection').offset().top
            }, 500);
        }
        // Script pour le toggle du thème pour le mode sombre et clair
        $(document).ready(function() {
            $('#themeToggle').click(function() {
                var currentTheme = $('html').attr('data-bs-theme');
                var newTheme = currentTheme === 'light' ? 'dark' : 'light';
                $('html').attr('data-bs-theme', newTheme);
                $('#themeToggle').text(newTheme === 'light' ? '🌙' : '☀️');
            });
        });
    </script>
</body>

</html>