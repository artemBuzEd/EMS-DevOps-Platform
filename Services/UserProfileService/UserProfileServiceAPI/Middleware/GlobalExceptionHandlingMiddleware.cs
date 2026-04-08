using System.Net;
using System.Text.Json;
using BLL.Exceptions;
using FluentValidation;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace WebApplication1.Middleware;

public class GlobalExceptionHandlingMiddleware : IMiddleware
{
    private readonly ILogger<GlobalExceptionHandlingMiddleware> _logger;

    public GlobalExceptionHandlingMiddleware(ILogger<GlobalExceptionHandlingMiddleware> logger)
    {
        _logger = logger;
    }
    
    //Todo make specific http status code (Fixed, needed review)
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.Message);
            
            if (context.Response.HasStarted)
            {
                throw;
            }
            
            HttpStatusCode statusCode;
            string title;
            string detail;
            
            (statusCode, title, detail) = ex switch
            {
                NotFoundException => (HttpStatusCode.NotFound, "Not Found", ex.Message),
                ValidationException => (HttpStatusCode.BadRequest, "Bad Request", ex.Message),
                _ => (HttpStatusCode.InternalServerError, "Internal Server Error", ex.Message)
            };
            
            context.Response.Clear();
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)statusCode;
    
            ProblemDetails problem = new()
            {
                Status = (int)statusCode,
                Type = "Error",
                Title = title,
                Detail = detail
            };
            
            var json = JsonSerializer.Serialize(problem);
            
            await context.Response.WriteAsync(json);
        }
    }
}