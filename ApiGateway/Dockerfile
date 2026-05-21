FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

COPY ["ApiGateway/ApiGateway.csproj", "ApiGateway/"]
COPY ["Common/Common.csproj", "Common/"]
COPY ["ServiceDefaults/ServiceDefaults.csproj", "ServiceDefaults/"]

RUN dotnet restore "ApiGateway/ApiGateway.csproj"

COPY ["ApiGateway/", "ApiGateway/"]
COPY ["Common/", "Common/"]
COPY ["ServiceDefaults/", "ServiceDefaults/"]

WORKDIR "/src/ApiGateway/"

RUN dotnet build "ApiGateway.csproj" -c Release -o /app/build
RUN dotnet publish "ApiGateway.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine
WORKDIR /app
USER app
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "ApiGateway.dll"]
