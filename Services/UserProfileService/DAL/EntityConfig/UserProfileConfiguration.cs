using DAL.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DAL.EntityConfig;

public class UserProfileConfiguration : IEntityTypeConfiguration<UserProfile>
{
    public void Configure(EntityTypeBuilder<UserProfile> builder)
    {
        builder.ToTable("UserProfile");
        builder.HasKey(u => u.user_id);
        builder.Property(u => u.user_id).IsRequired();
        builder.HasIndex(u => u.user_id).IsUnique();
        builder.Property(u => u.first_name).HasMaxLength(50).IsRequired();
        builder.Property(u => u.last_name).HasMaxLength(50).IsRequired();
        builder.Property(u => u.birth_date).HasColumnType("DATE").IsRequired();
        builder.Property(u => u.created_at).HasColumnType("DATE").IsRequired().HasDefaultValueSql("CURRENT_DATE");
        builder.Property(u => u.avatar_url).HasMaxLength(500).IsRequired(false);

        builder.HasMany(c => c.Comments)
            .WithOne(u => u.user)
            .HasForeignKey(u => u.user_id)
            .OnDelete(DeleteBehavior.Restrict);
        
        builder.HasMany(c => c.EventCalendar)
            .WithOne(u => u.user)
            .HasForeignKey(u => u.user_id)
            .OnDelete(DeleteBehavior.Cascade);
    }
}