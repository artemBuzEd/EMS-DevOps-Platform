using System;
using Aggregator.Services;
using EventCatalogApi.Protos;
using ServiceDefaults;
using Grpc;
using Grpc.Net.Client;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Http.Resilience;
using Polly;
using Polly.CircuitBreaker;
using UserProfileApi.Protos;

AppContext.SetSwitch("System.Net.Http.SocketsHttpHandler.Http2UnencryptedSupport", true);

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.AddServiceDefaults();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// builder.Services.AddSingleton(sp =>
// {
//     var channel = GrpcChannel.ForAddress("https://localhost:7159", new GrpcChannelOptions
//     {
//         HttpHandler = new HttpClientHandler
//         {
//             ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
//         }
//     });
//     return new EventCatalog.EventCatalogClient(channel);
// });
//
// builder.Services.AddSingleton(sp =>
// {
//     var channel = GrpcChannel.ForAddress("https://localhost:7146", new GrpcChannelOptions
//     {
//         HttpHandler = new HttpClientHandler
//         {
//             ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
//         }
//     });
//     return new UserProfile.UserProfileClient(channel);
// });

//Grpc Clients
builder.Services.AddGrpcClient<UserProfile.UserProfileClient>(o =>
    o.Address = new Uri("https://localhost:7146")).AddStandardResilienceHandler(options =>
{
    options.Retry = new HttpRetryStrategyOptions
    {
        MaxRetryAttempts = 3,
        Delay = TimeSpan.FromSeconds(1),
        BackoffType = DelayBackoffType.Exponential,
        UseJitter = true
    };

    options.CircuitBreaker = new HttpCircuitBreakerStrategyOptions
    {
        FailureRatio = 0.7,
        MinimumThroughput = 100,
        BreakDuration = TimeSpan.FromSeconds(10),
        SamplingDuration = TimeSpan.FromSeconds(120)
    };
    options.TotalRequestTimeout = new HttpTimeoutStrategyOptions
    {
        Timeout = TimeSpan.FromSeconds(30)
    };
    
});
builder.Services.AddGrpcClient<EventCatalog.EventCatalogClient>(o => 
    o.Address = new Uri("https://localhost:7159")).AddStandardResilienceHandler(options =>
{
    options.Retry = new HttpRetryStrategyOptions
    {
        MaxRetryAttempts = 3,
        Delay = TimeSpan.FromSeconds(1),
        BackoffType = DelayBackoffType.Exponential,
        UseJitter = true
    };
});

builder.Services.AddScoped<AggregatorGrpcService>();

builder.Services.AddHttpClient("EventCatalogService", client =>
{
    client.BaseAddress = new Uri("http://EventCatalogService");
});

builder.Services.AddHttpClient("UserProfileService", client =>
{
    client.BaseAddress = new Uri("http://UserProfileService");
});

builder.Services.AddHttpClient("VenueService", client =>
{
    client.BaseAddress = new Uri("http://VenueService");
});

var app = builder.Build();

app.MapDefaultEndpoints();
app.UseCorrelationId();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

//app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();