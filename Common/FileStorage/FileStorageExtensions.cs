using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Common.FileStorage;

public static class FileStorageExtensions
{
    public static IServiceCollection AddLocalFileStorage(this IServiceCollection services, IConfiguration configuration)
    {
        var basePath = configuration["FileStorage:BasePath"] ?? "/app/uploads";
        var baseUrl = configuration["FileStorage:BaseUrl"] ?? "/uploads";

        services.AddSingleton<IFileStorage>(new LocalFileStorage(basePath, baseUrl));
        return services;
    }
}
