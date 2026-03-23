-- =====================================================
-- create_schema.sql
-- Creates all tables from InitialCreate + AddCandidateSkillTags migrations
-- Run this when tables are missing but migration history is already populated
-- =====================================================

-- Tables from InitialCreate (20260320032943)

CREATE TABLE [Candidates] (
    [Id] uniqueidentifier NOT NULL,
    [Name] nvarchar(max) NOT NULL,
    [Email] nvarchar(max) NOT NULL,
    [ResumeBlobUrl] nvarchar(max) NULL,
    [WorkspaceId] uniqueidentifier NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Candidates] PRIMARY KEY ([Id])
);

CREATE TABLE [PromptVersions] (
    [Id] uniqueidentifier NOT NULL,
    [PluginName] nvarchar(max) NOT NULL,
    [Version] nvarchar(max) NOT NULL,
    [PromptText] nvarchar(max) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_PromptVersions] PRIMARY KEY ([Id])
);

CREATE TABLE [Recruiters] (
    [Id] uniqueidentifier NOT NULL,
    [Name] nvarchar(max) NOT NULL,
    [Email] nvarchar(max) NOT NULL,
    [WorkspaceId] uniqueidentifier NOT NULL,
    [Role] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Recruiters] PRIMARY KEY ([Id])
);

CREATE TABLE [SystemParameters] (
    [Key] nvarchar(450) NOT NULL,
    [Value] nvarchar(max) NOT NULL,
    [UpdatedBy] nvarchar(max) NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_SystemParameters] PRIMARY KEY ([Key])
);

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
    CONSTRAINT [FK_ClientFeedbacks_JobDescriptions_JobDescriptionId] FOREIGN KEY ([JobDescriptionId]) REFERENCES [JobDescriptions] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_ClientFeedbacks_Recruiters_RecruiterId] FOREIGN KEY ([RecruiterId]) REFERENCES [Recruiters] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [Questionnaires] (
    [Id] uniqueidentifier NOT NULL,
    [JobDescriptionId] uniqueidentifier NOT NULL,
    [TemplateVersion] nvarchar(max) NULL,
    [QuestionsJson] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Questionnaires] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Questionnaires_JobDescriptions_JobDescriptionId] FOREIGN KEY ([JobDescriptionId]) REFERENCES [JobDescriptions] ([Id]) ON DELETE CASCADE
);

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

CREATE TABLE [InterviewGuides] (
    [Id] uniqueidentifier NOT NULL,
    [SubmissionId] uniqueidentifier NOT NULL,
    [GuideJson] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_InterviewGuides] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_InterviewGuides_CandidateSubmissions_SubmissionId] FOREIGN KEY ([SubmissionId]) REFERENCES [CandidateSubmissions] ([Id]) ON DELETE CASCADE
);

-- Indexes from InitialCreate
CREATE INDEX [IX_Candidates_WorkspaceId] ON [Candidates] ([WorkspaceId]);
CREATE INDEX [IX_CandidateSubmissions_CandidateId] ON [CandidateSubmissions] ([CandidateId]);
CREATE INDEX [IX_CandidateSubmissions_QuestionnaireId] ON [CandidateSubmissions] ([QuestionnaireId]);
CREATE UNIQUE INDEX [IX_CandidateSubmissions_Token] ON [CandidateSubmissions] ([Token]) WHERE [Token] IS NOT NULL;
CREATE INDEX [IX_ClientFeedbacks_CandidateId] ON [ClientFeedbacks] ([CandidateId]);
CREATE INDEX [IX_ClientFeedbacks_JobDescriptionId] ON [ClientFeedbacks] ([JobDescriptionId]);
CREATE INDEX [IX_ClientFeedbacks_RecruiterId] ON [ClientFeedbacks] ([RecruiterId]);
CREATE INDEX [IX_EvaluationReports_SubmissionId] ON [EvaluationReports] ([SubmissionId]);
CREATE UNIQUE INDEX [IX_InterviewGuides_SubmissionId] ON [InterviewGuides] ([SubmissionId]);
CREATE INDEX [IX_JobDescriptions_RecruiterId] ON [JobDescriptions] ([RecruiterId]);
CREATE INDEX [IX_Questionnaires_JobDescriptionId] ON [Questionnaires] ([JobDescriptionId]);

-- AddCandidateSkillTags migration (20260323000000): Add SkillTags column to Candidates
ALTER TABLE [Candidates] ADD [SkillTags] nvarchar(max) NOT NULL DEFAULT N'[]';

-- Verify
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME;
