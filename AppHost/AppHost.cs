var builder = DistributedApplication.CreateBuilder(args);

var userPostgresPassword = builder.AddParameter("PostgresPassword", secret: true);
var keycloakAdminPassword = builder.AddParameter("KeycloakAdminPassword", secret: true);

//DBs
var mongo = builder.AddMongoDB("mongo")
    .WithDataVolume()
    .AddDatabase("EventCatalogDb");

var postgres = builder.AddPostgres("postgres", password: userPostgresPassword)
    .WithDataVolume("postgres-volume")
    .WithPgAdmin();

var venueDb = postgres.AddDatabase("VenueDb");
var userProfileDb = postgres.AddDatabase("UserProfileDb");
var keycloakDb = postgres.AddDatabase("KeycloakDb");

var redis = builder.AddRedis("Redis")
    .WithDataVolume();

// Keycloak IdP — LOCAL-ONLY: start-dev mode
var keycloak = builder.AddContainer("keycloak", "quay.io/keycloak/keycloak", "26.0")
    .WithHttpEndpoint(port: 8180, targetPort: 8080, name: "http")
    .WithEnvironment("KC_DB", "postgres")
    .WithEnvironment("KC_DB_URL", $"jdbc:postgresql://postgres:5432/KeycloakDb")
    .WithEnvironment("KC_DB_USERNAME", "postgres")
    .WithEnvironment("KC_DB_PASSWORD", userPostgresPassword)
    .WithEnvironment("KC_BOOTSTRAP_ADMIN_USERNAME", "admin")
    .WithEnvironment("KC_BOOTSTRAP_ADMIN_PASSWORD", keycloakAdminPassword)
    .WithEnvironment("KC_HEALTH_ENABLED", "true")
    // LOCAL-ONLY: disable theme caching so edits to ../keycloak/themes show up
    // on the next page load without restarting the container.
    .WithEnvironment("KC_SPI_THEME_CACHE_THEMES", "false")
    .WithEnvironment("KC_SPI_THEME_STATIC_MAX_AGE", "-1")
    .WithBindMount("../keycloak/realm-ems.json", "/opt/keycloak/data/import/realm-ems.json")
    .WithBindMount("../keycloak/themes", "/opt/keycloak/themes")
    .WithArgs("start-dev", "--import-realm")
    .WaitFor(postgres);

var keycloakAuthority = "http://localhost:8180/realms/ems";

//Services
var eventCatalog = builder.AddProject<Projects.EventCatalogApi>("EventCatalogService")
    //.WithReplicas(3)
    .WithReference(mongo)
    .WithReference(redis)
    .WithEnvironment("Keycloak__Authority", keycloakAuthority)
    .WithEnvironment("Keycloak__Audience", "ems-api")
    .WithEnvironment("Keycloak__RequireHttpsMetadata", "false")
    .WaitFor(mongo)
    .WaitFor(redis);

var userProfile = builder.AddProject<Projects.UserProfileServiceAPI>("UserProfileService")
    //.WithReplicas(3)
    .WithReference(redis)
    .WithReference(userProfileDb)
    .WithEnvironment("Keycloak__Authority", keycloakAuthority)
    .WithEnvironment("Keycloak__Audience", "ems-api")
    .WithEnvironment("Keycloak__RequireHttpsMetadata", "false")
    .WaitFor(postgres)
    .WaitFor(redis);

var venue = builder.AddProject<Projects.VenueService>("VenueService")
    //.WithReplicas(3)
    .WithReference(redis)
    .WithReference(venueDb)
    .WithEnvironment("Keycloak__Authority", keycloakAuthority)
    .WithEnvironment("Keycloak__Audience", "ems-api")
    .WithEnvironment("Keycloak__RequireHttpsMetadata", "false")
    .WaitFor(postgres)
    .WaitFor(redis);

//Aggregator
var aggregator = builder.AddProject<Projects.Aggregator>("Aggregator")
    .WithReference(redis)
    .WithReference(venue)
    .WithReference(eventCatalog)
    .WithReference(userProfile)
    .WithEnvironment("Keycloak__Authority", keycloakAuthority)
    .WithEnvironment("Keycloak__Audience", "ems-api")
    .WithEnvironment("Keycloak__RequireHttpsMetadata", "false")
    .WaitFor(venue)
    .WaitFor(userProfile)
    .WaitFor(eventCatalog)
    .WaitFor(redis);

//Api Gateway
var gateway = builder.AddProject<Projects.ApiGateway>("ApiGateway")
    .WithHttpEndpoint(port: 5000, name: "gateway") //htpp issue
    .WithReference(eventCatalog)
    .WithReference(venue)
    .WithReference(userProfile)
    .WithReference(aggregator)
    .WithEnvironment("Keycloak__Authority", keycloakAuthority)
    .WithEnvironment("Keycloak__Audience", "ems-api")
    .WithEnvironment("Keycloak__RequireHttpsMetadata", "false")
    .WaitFor(eventCatalog)
    .WaitFor(venue)
    .WaitFor(userProfile)
    .WaitFor(aggregator);


builder.Build().Run();
