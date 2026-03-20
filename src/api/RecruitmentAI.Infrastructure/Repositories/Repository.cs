using Microsoft.EntityFrameworkCore;
using RecruitmentAI.Core.Interfaces;
using RecruitmentAI.Infrastructure.Data;

namespace RecruitmentAI.Infrastructure.Repositories;

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly RecruitmentDbContext _db;

    public Repository(RecruitmentDbContext db) => _db = db;

    public async Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _db.Set<T>().FindAsync([id], ct);

    public async Task<IReadOnlyList<T>> GetAllAsync(CancellationToken ct = default)
        => await _db.Set<T>().ToListAsync(ct);

    public async Task<T> AddAsync(T entity, CancellationToken ct = default)
    {
        await _db.Set<T>().AddAsync(entity, ct);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(T entity, CancellationToken ct = default)
    {
        _db.Set<T>().Update(entity);
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(T entity, CancellationToken ct = default)
    {
        _db.Set<T>().Remove(entity);
        await _db.SaveChangesAsync(ct);
    }
}
