FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

COPY ["Aggregator/Aggregator.csproj", "Aggregator/"]

COPY ["Common/Common.csproj", "Common/"]
COPY ["ServiceDefaults/ServiceDefaults.csproj", "ServiceDefaults/"]

RUN dotnet restore "Aggregator/Aggregator.csproj"

COPY ["Aggregator/", "Aggregator/"]
COPY ["Common/", "Common/"]
COPY ["ServiceDefaults/", "ServiceDefaults"]

WORKDIR "/src/Aggregator/"

RUN dotnet build "Aggregator.csproj" -c Release -o /app/build
RUN dotnet publish "Aggregator.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine
WORKDIR /app
USER app
EXPOSE 8083
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Aggregator.dll"]


