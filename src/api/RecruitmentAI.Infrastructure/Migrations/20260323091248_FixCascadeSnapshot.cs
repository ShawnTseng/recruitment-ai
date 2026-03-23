using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RecruitmentAI.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixCascadeSnapshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ClientFeedbacks_Candidates_CandidateId",
                table: "ClientFeedbacks");

            migrationBuilder.DropForeignKey(
                name: "FK_ClientFeedbacks_JobDescriptions_JobDescriptionId",
                table: "ClientFeedbacks");

            migrationBuilder.DropForeignKey(
                name: "FK_ClientFeedbacks_Recruiters_RecruiterId",
                table: "ClientFeedbacks");

            migrationBuilder.AddForeignKey(
                name: "FK_ClientFeedbacks_Candidates_CandidateId",
                table: "ClientFeedbacks",
                column: "CandidateId",
                principalTable: "Candidates",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ClientFeedbacks_JobDescriptions_JobDescriptionId",
                table: "ClientFeedbacks",
                column: "JobDescriptionId",
                principalTable: "JobDescriptions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ClientFeedbacks_Recruiters_RecruiterId",
                table: "ClientFeedbacks",
                column: "RecruiterId",
                principalTable: "Recruiters",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ClientFeedbacks_Candidates_CandidateId",
                table: "ClientFeedbacks");

            migrationBuilder.DropForeignKey(
                name: "FK_ClientFeedbacks_JobDescriptions_JobDescriptionId",
                table: "ClientFeedbacks");

            migrationBuilder.DropForeignKey(
                name: "FK_ClientFeedbacks_Recruiters_RecruiterId",
                table: "ClientFeedbacks");

            migrationBuilder.AddForeignKey(
                name: "FK_ClientFeedbacks_Candidates_CandidateId",
                table: "ClientFeedbacks",
                column: "CandidateId",
                principalTable: "Candidates",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ClientFeedbacks_JobDescriptions_JobDescriptionId",
                table: "ClientFeedbacks",
                column: "JobDescriptionId",
                principalTable: "JobDescriptions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ClientFeedbacks_Recruiters_RecruiterId",
                table: "ClientFeedbacks",
                column: "RecruiterId",
                principalTable: "Recruiters",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
