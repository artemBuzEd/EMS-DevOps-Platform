using Microsoft.AspNetCore.Server.Kestrel.Core;
using ServiceDefaults;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

// Keycloak JWT auth
builder.Services.AddKeycloakJwtAuth(builder.Configuration);

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 6 * 1024 * 1024;
    options.ConfigureEndpointDefaults(listenOptions =>
    {
        listenOptions.Protocols = HttpProtocols.Http1AndHttp2;
    });
});

builder.Services.AddAuthorizationBuilder()
    .AddPolicy("authenticated", policy => policy.RequireAuthenticatedUser());

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
