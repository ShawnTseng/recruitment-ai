using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RecruitmentAI.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCandidateSkillTags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SkillTags",
                table: "Candidates",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "[]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SkillTags",
                table: "Candidates");
        }
    }
}
