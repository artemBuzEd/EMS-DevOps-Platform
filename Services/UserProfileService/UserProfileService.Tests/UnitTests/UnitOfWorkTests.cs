using DAL.Entities;
using DAL.EntityConfig;
using DAL.Repositories;
using DAL.UoW;
using FluentAssertions;
using UserProfileService.Tests.Helpers;
using Xunit;

namespace UserProfileService.Tests.UnitTests;

public class UnitOfWorkTests : IDisposable
{
    private readonly UserProfileDbContext context;

    public UnitOfWorkTests()
    {
        context = DbContextFactory.Create();
    }
    [Fact]
    public void UnitOfWork_Repositories_ShareSameDbContext_ShouldReturnSameDbContext()
    {
        var uow = new UnitOfWork(context, new UserProfileRepository(context),new UserCommentRepository(context), new UserEventCalendarRepository(context));

        var ctx1 = (uow.UserProfileRepository as GenericRepository<UserProfile>)?._context;
        var ctx2 = (uow.UserCommentRepository as GenericRepository<UserComment>)?._context;
        
        ctx1.Should().BeSameAs(ctx2);
    }
    
    public void Dispose() => context.Dispose();
}