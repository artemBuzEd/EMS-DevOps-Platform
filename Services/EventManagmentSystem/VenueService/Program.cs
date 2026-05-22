using System.Data;
using System.Data.SqlClient;
using EMS.DAL.ADO.NET.Entities;
using EMS.DAL.ADO.NET.Repositories;
using EMS.DAL.ADO.NET.Repositories.Contracts;
using Npgsql;
using ServiceDefaults;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddScoped<IDbConnection>(s =>
{
    var conn = new NpgsqlConnection(builder.Configuration.GetConnectionString("VenueDb"));
    conn.Open();
    return conn;
});

builder.Services.AddScoped<IDbTransaction>(s =>
{
    var conn = s.GetRequiredService<IDbConnection>();
    return conn.BeginTransaction();
});

// Service Defaults
builder.AddServiceDefaults();

// Keycloak JWT auth
builder.Services.AddKeycloakJwtAuth(builder.Configuration);
builder.Services.AddAuthorizationBuilder();

builder.Services.AddScoped<IVenueRepository, VenueRepository>();
builder.Services.AddScoped<IEventRepository, EventRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUOW, UOW>();


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();