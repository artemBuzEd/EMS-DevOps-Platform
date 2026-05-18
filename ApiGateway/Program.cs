using ServiceDefaults;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

// Keycloak JWT auth
builder.Services.AddKeycloakJwtAuth(builder.Configuration);

builder.Services.AddAuthorizationBuilder()
    .AddPolicy("authenticated", policy => policy.RequireAuthenticatedUser())
    .AddPolicy("organizer", policy => policy.RequireRole("organizer", "admin"));

//Swagger
builder.Services.AddSwaggerGen();
builder.Services.AddEndpointsApiExplorer();


builder.Services.AddServiceDiscovery();
//YARP
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"))
    .AddServiceDiscoveryDestinationResolver();


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
//Service Defaults methods
app.MapDefaultEndpoints();
app.UseCorrelationId();

app.UseAuthentication();
app.UseAuthorization();

app.MapReverseProxy();


app.Run();
