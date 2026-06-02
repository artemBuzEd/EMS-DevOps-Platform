using DAL.EntityConfig;
using DAL.Repositories.Contracts;
using Microsoft.EntityFrameworkCore.Storage;

namespace DAL.UoW;

public class UnitOfWork : IUnitOfWork
{
    private readonly UserProfileDbContext _context;
    private IDbContextTransaction _transaction;
    
    public IUserProfileRepository UserProfileRepository { get; }
    public IUserCommentRepository UserCommentRepository { get; }
    public IUserEventCalendarRepository UserEventCalendarRepository { get; }

    public UnitOfWork(UserProfileDbContext dbContext, 
        IUserProfileRepository userProfiles,
        IUserCommentRepository userComments,
        IUserEventCalendarRepository userEventCalendars)
    {
        _context = dbContext;
        UserProfileRepository = userProfiles;
        UserCommentRepository = userComments;
        UserEventCalendarRepository = userEventCalendars;
    }

    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        _transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
    }

    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default) 
    {
        if (_transaction == null)
        {
            throw new InvalidOperationException("The transaction has not been started. [CommitTransactionAsync()]");
        }

        try
        {
            await _transaction.CommitAsync(cancellationToken);
        }
        finally
        {
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction == null)
            return;

        try
        {
            await _transaction.RollbackAsync(cancellationToken);
        }
        finally
        {
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async Task<int> CompleteAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }
}