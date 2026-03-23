IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

CREATE TABLE [Candidates] (
    [Id] uniqueidentifier NOT NULL,
    [Name] nvarchar(max) NOT NULL,
    [Email] nvarchar(max) NOT NULL,
    [ResumeBlobUrl] nvarchar(max) NULL,
    [WorkspaceId] uniqueidentifier NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Candidates] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [PromptVersions] (
    [Id] uniqueidentifier NOT NULL,
    [PluginName] nvarchar(max) NOT NULL,
    [Version] nvarchar(max) NOT NULL,
    [PromptText] nvarchar(max) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_PromptVersions] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [Recruiters] (
    [Id] uniqueidentifier NOT NULL,
    [Name] nvarchar(max) NOT NULL,
    [Email] nvarchar(max) NOT NULL,
    [WorkspaceId] uniqueidentifier NOT NULL,
    [Role] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Recruiters] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [SystemParameters] (
    [Key] nvarchar(450) NOT NULL,
    [Value] nvarchar(max) NOT NULL,
    [UpdatedBy] nvarchar(max) NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_SystemParameters] PRIMARY KEY ([Key])
);
GO

CREATE TABLE [JobDescriptions] (
    [Id] uniqueidentifier NOT NULL,
    [RecruiterId] uniqueidentifier NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    [RawText] nvarchar(max) NOT NULL,
    [BlobUrl] nvarchar(max) NULL,
    [ParsedJson] nvarchar(max) NULL,
    [PromptVersion] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_JobDescriptions] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_JobDescriptions_Recruiters_RecruiterId] FOREIGN KEY ([RecruiterId]) REFERENCES [Recruiters] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [ClientFeedbacks] (
    [Id] uniqueidentifier NOT NULL,
    [CandidateId] uniqueidentifier NOT NULL,
    [JobDescriptionId] uniqueidentifier NOT NULL,
    [RecruiterId] uniqueidentifier NOT NULL,
    [Outcome] nvarchar(max) NOT NULL,
    [Tags] nvarchar(max) NOT NULL,
    [Comments] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_ClientFeedbacks] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ClientFeedbacks_Candidates_CandidateId] FOREIGN KEY ([CandidateId]) REFERENCES [Candidates] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_ClientFeedbacks_JobDescriptions_JobDescriptionId] FOREIGN KEY ([JobDescriptionId]) REFERENCES [JobDescriptions] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_ClientFeedbacks_Recruiters_RecruiterId] FOREIGN KEY ([RecruiterId]) REFERENCES [Recruiters] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [Questionnaires] (
    [Id] uniqueidentifier NOT NULL,
    [JobDescriptionId] uniqueidentifier NOT NULL,
    [TemplateVersion] nvarchar(max) NULL,
    [QuestionsJson] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Questionnaires] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Questionnaires_JobDescriptions_JobDescriptionId] FOREIGN KEY ([JobDescriptionId]) REFERENCES [JobDescriptions] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [CandidateSubmissions] (
    [Id] uniqueidentifier NOT NULL,
    [CandidateId] uniqueidentifier NOT NULL,
    [QuestionnaireId] uniqueidentifier NOT NULL,
    [AnswersJson] nvarchar(max) NOT NULL,
    [Token] nvarchar(450) NULL,
    [TokenExpiresAt] datetime2 NULL,
    [TokenUsed] bit NOT NULL,
    [SubmittedAt] datetime2 NULL,
    CONSTRAINT [PK_CandidateSubmissions] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_CandidateSubmissions_Candidates_CandidateId] FOREIGN KEY ([CandidateId]) REFERENCES [Candidates] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_CandidateSubmissions_Questionnaires_QuestionnaireId] FOREIGN KEY ([QuestionnaireId]) REFERENCES [Questionnaires] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [EvaluationReports] (
    [Id] uniqueidentifier NOT NULL,
    [SubmissionId] uniqueidentifier NOT NULL,
    [Stage] int NOT NULL,
    [AiScore] float NOT NULL,
    [Recommendation] nvarchar(max) NOT NULL,
    [ReportJson] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_EvaluationReports] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_EvaluationReports_CandidateSubmissions_SubmissionId] FOREIGN KEY ([SubmissionId]) REFERENCES [CandidateSubmissions] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [InterviewGuides] (
    [Id] uniqueidentifier NOT NULL,
    [SubmissionId] uniqueidentifier NOT NULL,
    [GuideJson] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_InterviewGuides] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_InterviewGuides_CandidateSubmissions_SubmissionId] FOREIGN KEY ([SubmissionId]) REFERENCES [CandidateSubmissions] ([Id]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_Candidates_WorkspaceId] ON [Candidates] ([WorkspaceId]);
GO

CREATE INDEX [IX_CandidateSubmissions_CandidateId] ON [CandidateSubmissions] ([CandidateId]);
GO

CREATE INDEX [IX_CandidateSubmissions_QuestionnaireId] ON [CandidateSubmissions] ([QuestionnaireId]);
GO

CREATE UNIQUE INDEX [IX_CandidateSubmissions_Token] ON [CandidateSubmissions] ([Token]) WHERE [Token] IS NOT NULL;
GO

CREATE INDEX [IX_ClientFeedbacks_CandidateId] ON [ClientFeedbacks] ([CandidateId]);
GO

CREATE INDEX [IX_ClientFeedbacks_JobDescriptionId] ON [ClientFeedbacks] ([JobDescriptionId]);
GO

CREATE INDEX [IX_ClientFeedbacks_RecruiterId] ON [ClientFeedbacks] ([RecruiterId]);
GO

CREATE INDEX [IX_EvaluationReports_SubmissionId] ON [EvaluationReports] ([SubmissionId]);
GO

CREATE UNIQUE INDEX [IX_InterviewGuides_SubmissionId] ON [InterviewGuides] ([SubmissionId]);
GO

CREATE INDEX [IX_JobDescriptions_RecruiterId] ON [JobDescriptions] ([RecruiterId]);
GO

CREATE INDEX [IX_Questionnaires_JobDescriptionId] ON [Questionnaires] ([JobDescriptionId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260320032943_InitialCreate', N'10.0.5');
GO

DECLARE @var nvarchar(max);
SELECT @var = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Candidates]') AND [c].[name] = N'SkillTags');
IF @var IS NOT NULL EXEC(N'ALTER TABLE [Candidates] DROP CONSTRAINT ' + @var + ';');
GO

CREATE TABLE [AppUsers] (
    [Id] uniqueidentifier NOT NULL,
    [Username] nvarchar(max) NOT NULL,
    [PasswordHash] nvarchar(max) NOT NULL,
    [DisplayName] nvarchar(max) NOT NULL,
    [Role] nvarchar(max) NOT NULL,
    [WorkspaceId] uniqueidentifier NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_AppUsers] PRIMARY KEY ([Id])
);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260323034045_AddAppUser', N'10.0.5');
GO

