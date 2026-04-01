using System.Linq.Expressions;
using DAL.EntityConfig;
using DAL.Repositories.Contracts;
using Microsoft.EntityFrameworkCore;
using System.Runtime.CompilerServices;
[assembly: InternalsVisibleTo("UserProfileService.Tests")]

namespace DAL.Repositories;

public class GenericRepository<TEntity> : IGenericRepository<TEntity> where TEntity : class
{
    internal readonly UserProfileDbContext _context;
    protected readonly DbSet<TEntity> _table;
    
    public GenericRepository(UserProfileDbContext userProfileDbContext)
    {
        _context = userProfileDbContext;
        _table = _context.Set<TEntity>();
    }
    
    public virtual async Task<IEnumerable<TEntity>> GetAllAsync()
    {
        return await _table.AsNoTracking().ToListAsync();
    }

    public virtual async Task<TEntity> GetByIdAsync(int id)
    {
        return await _table.FindAsync(id);
    }

    public virtual async Task<TEntity> AddAsync(TEntity entity)
    {
        if (entity == null)
        {
            throw new ArgumentNullException(nameof(entity) + "Can't be null. [UserProfileGenericRepository.AddAsync()]");
        }
        var entityToAdd = await _table.AddAsync(entity);
        return entityToAdd.Entity;
    }

    public virtual async Task UpdateAsync(TEntity entity)
    {
        if (entity == null)
        {
            throw new ArgumentNullException(nameof(entity) + "Can't be null. [UserProfileGenericRepository.UpdateAsync()]");
        }
        await Task.Run(() => _table.Update(entity));
    }

    public virtual async Task DeleteByIdAsync(int id)
    {
        var entity = await GetByIdAsync(id);
        if (entity != null)
        {
            await Task.Run(() => _table.Remove(entity));
        }
    }

    public virtual async Task DeleteAsync(TEntity entity)
    {
        if (entity == null)
        {
            throw new ArgumentNullException(nameof(entity) + "Can't be null. [UserProfileGenericRepository.DeleteAsync()]");
        }
        await Task.Run(() => _table.Remove(entity));
    }

    public virtual async Task<TEntity> CreateAsync(TEntity entity)
    {
        await _table.AddAsync(entity);
        return entity;
    }

    public IQueryable<TEntity> FindAll()
    {
        return _context.Set<TEntity>().AsNoTracking();
    }

    public virtual async Task<IEnumerable<TEntity>> FindByCondition(Expression<Func<TEntity, bool>> predicate)
    { 
        return await _context.Set<TEntity>().Where(predicate).AsNoTracking().ToListAsync(); 
    }
}