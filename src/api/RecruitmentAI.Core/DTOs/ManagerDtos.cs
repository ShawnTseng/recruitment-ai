namespace RecruitmentAI.Core.DTOs;

public record ManagerStatsResponse(
    int TotalJobDescriptions,
    int TotalCandidates,
    int TotalSubmissions,
    int EvaluatedSubmissions,
    int Stage1PassCount,
    int Stage1HoldCount,
    int Stage1RejectCount,
    double Stage1PassRate,
    int Stage2CompletedCount,
    int TotalFeedbacks,
    int HiredCount,
    int RejectedAtClientCount,
    double HireRate,
    double AverageAiScore
);
