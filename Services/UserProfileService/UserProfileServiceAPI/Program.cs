using BLL.DTOs.Request.UserComment;
using BLL.DTOs.Request.UserEventCalendar;
using BLL.DTOs.Request.UserProfile;
using BLL.DTOs.Validation.CreateValidation;
using BLL.DTOs.Validation.UpdateValidation;
using BLL.Services;
using BLL.Services.Contracts;
using Common.FileStorage;
using DAL.BogusSeed;
using DAL.BogusSeed.Fakers;
using DAL.EntityConfig;
using DAL.Repositories;
using DAL.Repositories.Contracts;
using DAL.UoW;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using ServiceDefaults;
using WebApplication1.GrpcService;
using WebApplication1.Middleware;

AppContext.SetSwitch("System.Net.Http.SocketsHttpHandler.Http2UnencryptedSupport", true);

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
if (builder.Environment.EnvironmentName == "Testing") 
{
    builder.Services.AddDbContext<UserProfileDbContext>(options =>
        options.UseSqlite("DataSource=:memory:"));
}
else 
{ 
    builder.Services.AddDbContext<UserProfileDbContext>(options => 
    {
        string connectionString = builder.Configuration.GetConnectionString("UserProfileDb");
        options.UseNpgsql(connectionString);
    });
}

// ServiceDefaults
builder.AddServiceDefaults();

// Keycloak JWT auth
builder.Services.AddKeycloakJwtAuth(builder.Configuration);

builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.ConfigureEndpointDefaults(listenOptions =>
    {
        listenOptions.Protocols = HttpProtocols.Http1AndHttp2;
    });
});

// Redis
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "UserProfile";
});
builder.Services.AddScoped<ILogger<UserProfileService>, Logger<UserProfileService>>();
//gRPC
builder.Services.AddGrpc(options =>
{
    options.EnableDetailedErrors = true;
});

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddProblemDetails();
builder.Services.AddTransient<GlobalExceptionHandlingMiddleware>();
//Repositories
builder.Services.AddScoped<IUserCommentRepository, UserCommentRepository>();
builder.Services.AddScoped<IUserProfileRepository, UserProfileRepository>();
builder.Services.AddScoped<IUserEventCalendarRepository, UserEventCalendarRepository>();
//UnitOfWork
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
//Services
builder.Services.AddScoped<IUserCommentService, UserCommentService>();
builder.Services.AddScoped<IUserProfileService, UserProfileService>();
builder.Services.AddScoped<IUserEventCalendarService, UserEventCalendarService>();
//Validation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();

//Create Validators
builder.Services.AddScoped<IValidator<UserCommentCreateRequestDTO>, UserCommentCreateValidation>();
builder.Services.AddScoped<IValidator<UserProfileCreateRequestDTO>, UserProfileCreateValidation>();
builder.Services.AddScoped<IValidator<UserEventCalendarCreateRequestDTO>, UserEventCalendarCreateValidation>();
//Update Validators
builder.Services.AddScoped<IValidator<UserCommentUpdateRequestDTO>, UserCommentUpdateValidation>();
builder.Services.AddScoped<IValidator<UserProfileUpdateRequestDTO>, UserProfileUpdateValidation>();

builder.Services.AddHttpContextAccessor();

// File Storage
builder.Services.AddLocalFileStorage(builder.Configuration);

var app = builder.Build();
if (!app.Environment.IsEnvironment("Testing"))
{
    using (var serviceScope = app.Services.CreateScope())
    {
        var services = serviceScope.ServiceProvider;
        try
        {
            var context = services.GetRequiredService<UserProfileDbContext>();
            var created = context.Database.EnsureCreated();
            if (!created)
            {
                Console.WriteLine("ERROR: Could not create database");
            }
            else
            {
                Console.WriteLine("Successfully created Database");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("ERROR: Could not create database: " + ex.Message);
        }
    }

    using (var serviceScope = app.Services.CreateScope())
    {
        var services = serviceScope.ServiceProvider;
        try
        {
            await DataSeeder.SeedAsync(services);
        }
        catch (Exception ex)
        {
            Console.WriteLine("ERROR: Could not seed: " + ex.Message);
        }
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
//CorrelationId
app.UseCorrelationId();

// Serve uploaded files as static files
var uploadPath = builder.Configuration["FileStorage:BasePath"] ?? "/app/uploads";
if (!app.Environment.IsEnvironment("Testing"))
{
    Directory.CreateDirectory(uploadPath);
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(uploadPath),
        RequestPath = "/uploads"
    });
}

//gRPC
app.MapGrpcService<UserProfileGrpcService>();

//app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<UserProfileAutoProvisionMiddleware>();

app.MapControllers();

app.UseMiddleware<GlobalExceptionHandlingMiddleware>();

app.Run();

public partial class Program { }