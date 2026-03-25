using Microsoft.AspNetCore.Mvc;
using Microsoft.SemanticKernel;
using RecruitmentAI.Core.DTOs;
using RecruitmentAI.Core.Entities;
using RecruitmentAI.Core.Interfaces;
using RecruitmentAI.Plugins;

namespace RecruitmentAI.Api.Controllers;

[ApiController]
[Route("api/questionnaires")]
public class QuestionnairesController : ControllerBase
{
    private readonly IQuestionnaireRepository _questionnaireRepo;
    private readonly IJobDescriptionRepository _jdRepo;
    private readonly Kernel _kernel;

    public QuestionnairesController(
        IQuestionnaireRepository questionnaireRepo,
        IJobDescriptionRepository jdRepo,
        Kernel kernel)
    {
        _questionnaireRepo = questionnaireRepo;
        _jdRepo = jdRepo;
        _kernel = kernel;
    }

    [HttpGet]
    public async Task<IActionResult> GetByJd([FromQuery] Guid jobDescriptionId, CancellationToken ct)
    {
        var questionnaires = await _questionnaireRepo.GetByJobDescriptionAsync(jobDescriptionId, ct);
        var response = questionnaires.Select(q => new QuestionnaireResponse(
            q.Id, q.JobDescriptionId, q.TemplateVersion, q.QuestionsJson, q.CreatedAt));
        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var q = await _questionnaireRepo.GetByIdAsync(id, ct);
        if (q is null) return NotFound();
        return Ok(new QuestionnaireResponse(q.Id, q.JobDescriptionId, q.TemplateVersion, q.QuestionsJson, q.CreatedAt));
    }

    [HttpPost("generate")]
    public async Task<IActionResult> Generate([FromBody] GenerateQuestionnaireRequest request, CancellationToken ct)
    {
        var jd = await _jdRepo.GetByIdAsync(request.JobDescriptionId, ct);
        if (jd is null) return NotFound(new { message = "Job description not found." });

        if (string.IsNullOrWhiteSpace(jd.ParsedJson))
            return BadRequest(new { message = "JD has not been parsed yet. Call /api/job-descriptions/{id}/parse first." });

        var plugin = new QaGeneratorPlugin();
        var questionsJson = await plugin.GenerateQuestionsAsync(_kernel, jd.ParsedJson, request.ResumeText);

        var questionnaire = new Questionnaire
        {
            Id = Guid.NewGuid(),
            JobDescriptionId = jd.Id,
            TemplateVersion = "1.0",
            QuestionsJson = questionsJson,
        };

        await _questionnaireRepo.AddAsync(questionnaire, ct);

        return CreatedAtAction(nameof(GetById), new { id = questionnaire.Id },
            new QuestionnaireResponse(questionnaire.Id, questionnaire.JobDescriptionId, questionnaire.TemplateVersion, questionnaire.QuestionsJson, questionnaire.CreatedAt));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] QuestionnaireResponse update, CancellationToken ct)
    {
        var q = await _questionnaireRepo.GetByIdAsync(id, ct);
        if (q is null) return NotFound();

        q.QuestionsJson = update.QuestionsJson;
        await _questionnaireRepo.UpdateAsync(q, ct);

        return Ok(new QuestionnaireResponse(q.Id, q.JobDescriptionId, q.TemplateVersion, q.QuestionsJson, q.CreatedAt));
    }
}
