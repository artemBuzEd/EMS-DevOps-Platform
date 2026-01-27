FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src
COPY ["Services/EventManagmentSystem/VenueService/VenueService.csproj", "Services/EventManagmentSystem/VenueService/"]
COPY ["Common/Common.csproj", "Common/"]
COPY ["ServiceDefaults/ServiceDefaults.csproj", "ServiceDefaults/"]

RUN dotnet restore "Services/EventManagmentSystem/VenueService/VenueService.csproj"

COPY ["Common/", "Common/"]
COPY ["ServiceDefaults/", "ServiceDefaults/"] 
COPY ["Services/EventManagmentSystem/VenueService/", "Services/EventManagmentSystem/VenueService/"]

WORKDIR "/src/Services/EventManagmentSystem/VenueService"

RUN dotnet build "VenueService.csproj" -c Release -o /app/build
RUN dotnet publish "VenueService.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine
WORKDIR /app
USER app
EXPOSE 8082
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "VenueService.dll"]