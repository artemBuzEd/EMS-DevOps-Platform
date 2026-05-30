using System.Net.Http.Headers;
using Common.FileStorage;
using Domain.Interfaces;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace EventCatalogApi.IntegrationTests.Infrastructure;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    public string TestUploadPath { get; }
    public InMemoryEventRepository Repository { get; } = new();

    public CustomWebApplicationFactory()
    {
        TestUploadPath = Path.Combine(Path.GetTempPath(), $"ems-eventcatalog-test-{Guid.NewGuid()}");
        Directory.CreateDirectory(TestUploadPath);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.UseSetting("FileStorage:BasePath", TestUploadPath);
        builder.UseSetting("FileStorage:BaseUrl", "/uploads");
        // Mongo creds present but never hit — InMemoryEventRepository swap below
        builder.UseSetting("ConnectionStrings:EventCatalogDb", "mongodb://localhost:27017");
        builder.UseSetting("MongoDb:DatabaseName", "ems-test");
        builder.UseSetting("ConnectionStrings:Redis", "localhost:6379");

        builder.ConfigureServices(services =>
        {
            var repoDescriptors = services.Where(d => d.ServiceType == typeof(IEventRepository)).ToList();
            foreach (var d in repoDescriptors) services.Remove(d);
            services.AddSingleton<IEventRepository>(Repository);

            var fileStorageDescriptors = services.Where(d => d.ServiceType == typeof(IFileStorage)).ToList();
            foreach (var d in fileStorageDescriptors) services.Remove(d);
            services.AddSingleton<IFileStorage>(new LocalFileStorage(TestUploadPath, "/uploads"));

            services.AddAuthentication(defaultScheme: TestAuthHandler.SchemeName)
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(TestAuthHandler.SchemeName, _ => { });
        });
    }

    protected override void ConfigureClient(HttpClient client)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(TestAuthHandler.SchemeName);
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing && Directory.Exists(TestUploadPath))
            Directory.Delete(TestUploadPath, true);
    }
}
