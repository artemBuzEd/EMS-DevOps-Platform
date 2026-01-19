using System.Diagnostics;
using Application;
using Application.Behaviors;
using Application.Events.Queries.GetUpComingEventsQuery;
using Application.Validations.CreateEventValidations;
using Check.GrpcService;
using Check.Middleware;
using Check.MongoDbDI;
using FluentValidation;
using MediatR;
using MediatR.Pipeline;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using ServiceDefaults;

AppContext.SetSwitch("System.Net.Http.SocketsHttpHandler.Http2UnencryptedSupport", true);

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ServiceDefaults
builder.AddServiceDefaults();


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
    options.InstanceName = "EventCatalog";
});

//gRPC
builder.Services.AddGrpc(options =>
{
    options.EnableDetailedErrors = true;
});

builder.Services.AddServiceDiscovery();
builder.Services.AddHttpClient("EventCatalogService", client =>
    {
        client.BaseAddress = new("http://EventCatalogService");
    })
    .AddServiceDiscovery();

builder.Services.AddMemoryCache();

builder.Services.AddMediatR(config =>
{
    config.RegisterServicesFromAssembly(typeof(GetUpcomingEventsQuery).Assembly);
    config.AddOpenBehavior(typeof(LoggingBehavior<,>));
    config.AddOpenBehavior(typeof(ValidationBehavior<,>));
    config.AddOpenBehavior(typeof(PerformanceBehavior<,>));
    config.AddOpenBehavior(typeof(CachingBehavior<,>));
});
builder.Services.RegisterMapsterConfiguration();

builder.Services.AddValidatorsFromAssembly(typeof(CreateEventCommandValidator).Assembly);

builder.Services.AddMongoDb(builder.Configuration);

builder.Services.AddSingleton<Stopwatch>();
builder.Services.AddScoped(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
builder.Services.AddScoped(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
builder.Services.AddScoped(typeof(IRequestExceptionHandler<,,>), typeof(ExceptionRequestLoggingHandler<,,>));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    await MongoDbDiInjection.InitializeDatabaseAsync(scope.ServiceProvider);
}


app.UseMiddleware<ExceptionMiddleware>();
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGrpcService<EventCatalogGrpcService>();

// CorrelationId
app.UseCorrelationId();

app.UseAuthorization();

app.MapControllers();

app.UseHttpsRedirection();

app.Run();