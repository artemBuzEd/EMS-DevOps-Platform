FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src
COPY ["Services/EventCatalogService/EventCatalogApi/EventCatalogApi.csproj", "Services/EventCatalogService/EventCatalogApi/"]
COPY ["Common/Common.csproj", "Common/"]
COPY ["ServiceDefaults/ServiceDefaults.csproj", "ServiceDefaults/"]

COPY ["Services/EventCatalogService/Domain/Domain.csproj", "Services/EventCatalogService/Domain/"]
COPY ["Services/EventCatalogService/Application/Application.csproj", "Services/EventCatalogService/Application/"]
COPY ["Services/EventCatalogService/Infrastructure/Infrastructure.csproj", "Services/EventCatalogService/Infrastructure/"]

RUN dotnet restore "Services/EventCatalogService/EventCatalogApi/EventCatalogApi.csproj"

COPY ["Common/", "Common/"]
COPY ["ServiceDefaults/", "ServiceDefaults/"] 
COPY ["Services/EventCatalogService/", "Services/EventCatalogService/"]

WORKDIR "/src/Services/EventCatalogService/EventCatalogApi/"

RUN dotnet build "EventCatalogApi.csproj" -c Release -o /app/build
RUN dotnet publish "EventCatalogApi.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine
WORKDIR /app
RUN mkdir -p /app/uploads/events \
    && chown -R app:app /app/uploads
USER app
EXPOSE 8081
COPY --chown=app:app --from=build /app/publish .
ENTRYPOINT ["dotnet", "EventCatalogApi.dll"]
