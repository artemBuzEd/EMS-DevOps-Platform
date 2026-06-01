FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build


WORKDIR /src
COPY ["Services/UserProfileService/UserProfileServiceAPI/UserProfileServiceAPI.csproj", "Services/UserProfileService/UserProfileServiceAPI/"]
COPY ["Common/Common.csproj", "Common/"]
COPY ["ServiceDefaults/ServiceDefaults.csproj", "ServiceDefaults/"]

COPY ["Services/UserProfileService/BLL/BLL.csproj", "Services/UserProfileService/BLL/"]
COPY ["Services/UserProfileService/DAL/DAL.csproj", "Services/UserProfileService/DAL/"]

RUN dotnet restore "Services/UserProfileService/UserProfileServiceAPI/UserProfileServiceAPI.csproj"

COPY ["Common/", "Common/"]
COPY ["ServiceDefaults/", "ServiceDefaults/"]
COPY ["Services/UserProfileService/", "Services/UserProfileService/"]

WORKDIR "/src/Services/UserProfileService/UserProfileServiceAPI"

RUN dotnet build "UserProfileServiceAPI.csproj" -c Release -o /app/build
RUN dotnet publish "UserProfileServiceAPI.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine
WORKDIR /app
RUN mkdir -p /app/uploads \
    && chown -R app:app /app
USER app
EXPOSE 8080
COPY --chown=app:app --from=build /app/publish .
ENTRYPOINT ["dotnet", "UserProfileServiceAPI.dll"]
 