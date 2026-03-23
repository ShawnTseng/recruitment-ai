using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RecruitmentAI.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddClientsAndClientId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ClientId",
                table: "JobDescriptions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Clients",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    WorkspaceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clients", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_JobDescriptions_ClientId",
                table: "JobDescriptions",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Clients_WorkspaceId",
                table: "Clients",
                column: "WorkspaceId");

            migrationBuilder.AddForeignKey(
                name: "FK_JobDescriptions_Clients_ClientId",
                table: "JobDescriptions",
                column: "ClientId",
                principalTable: "Clients",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobDescriptions_Clients_ClientId",
                table: "JobDescriptions");

            migrationBuilder.DropTable(
                name: "Clients");

            migrationBuilder.DropIndex(
                name: "IX_JobDescriptions_ClientId",
                table: "JobDescriptions");

            migrationBuilder.DropColumn(
                name: "ClientId",
                table: "JobDescriptions");
        }
    }
}
