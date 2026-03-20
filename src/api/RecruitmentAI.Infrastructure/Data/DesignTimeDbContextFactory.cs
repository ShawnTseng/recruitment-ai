using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace RecruitmentAI.Infrastructure.Data;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<RecruitmentDbContext>
{
    public RecruitmentDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<RecruitmentDbContext>();
        optionsBuilder.UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=RecruitmentAI_Design;Trusted_Connection=True;");
        return new RecruitmentDbContext(optionsBuilder.Options);
    }
}
