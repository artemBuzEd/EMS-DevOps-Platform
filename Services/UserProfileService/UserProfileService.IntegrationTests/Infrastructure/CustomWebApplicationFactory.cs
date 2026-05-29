using System.Net.Http.Headers;
using Common.FileStorage;
using DAL.EntityConfig;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.DependencyInjection;

namespace UserProfileService.IntegrationTests.Infrastructure;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _connection;
    private readonly string _testUploadPath;

    public CustomWebApplicationFactory()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();
        _testUploadPath = Path.Combine(Path.GetTempPath(), $"ems-test-uploads-{Guid.NewGuid()}");
        Directory.CreateDirectory(_testUploadPath);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.UseSetting("FileStorage:BasePath", _testUploadPath);
        builder.UseSetting("FileStorage:BaseUrl", "/uploads");

        builder.ConfigureServices(services =>
        {
            var dbDescriptors = services
                .Where(d => d.ServiceType == typeof(DbContextOptions<UserProfileDbContext>))
                .ToList();
            foreach (var d in dbDescriptors)
                services.Remove(d);

            services.AddDbContext<UserProfileDbContext>(options =>
                options.UseSqlite(_connection));
            
            var cacheDescriptors = services
                .Where(d => d.ServiceType == typeof(IDistributedCache))
                .ToList();
            foreach (var d in cacheDescriptors)
                services.Remove(d);

            services.AddDistributedMemoryCache();

            services.AddAuthentication(defaultScheme: TestAuthHandler.SchemeName)
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                    TestAuthHandler.SchemeName, _ => { });

            var fileStorageDescriptors = services
                .Where(d => d.ServiceType == typeof(IFileStorage))
                .ToList();
            foreach (var d in fileStorageDescriptors)
                services.Remove(d);

            services.AddSingleton<IFileStorage>(new LocalFileStorage(_testUploadPath, "/uploads"));
        });
    }

    protected override void ConfigureClient(HttpClient client)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(TestAuthHandler.SchemeName);
    }
    
    public void InitializeDb()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<UserProfileDbContext>();
        db.Database.EnsureCreated(); // Runs once on the shared open connection
    }
    
    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing)
        {
            _connection.Dispose();
            if (Directory.Exists(_testUploadPath))
                Directory.Delete(_testUploadPath, true);
        }
    }
}