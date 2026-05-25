using BLL.DTOs.Request.UserProfile;
using BLL.DTOs.Responce;
using BLL.Exceptions;
using BLL.Services.Contracts;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using WebApplication1.Controllers;
using WebApplication1.Middleware;
using Xunit;

namespace UserProfileService.Tests.UnitTests;

public class UserProfileControllerTests
{
    private readonly Mock<IUserProfileService> _userProfileServiceMock;
    private readonly UserProfileController _controller;

    public UserProfileControllerTests()
    {
        _userProfileServiceMock = new Mock<IUserProfileService>();
        _controller = new UserProfileController(_userProfileServiceMock.Object);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
    }

    [Fact]
    public async Task GetAllUsers_ShouldReturnOkWithAllUsers()
    {
        var users = new List<UserProfileResponceDTO>
        {
            new() { user_id = "1" },
            new() { user_id = "2" }
        };
        
        _userProfileServiceMock.Setup(s => s.GetAllUsersAsync()).ReturnsAsync(users);
        
        var result = await _controller.GetAllUsers();
        
        result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeEquivalentTo(users);
    }

    [Fact]
    public async Task UpdateUser_ValidDto_ReturnsNoContentResult()
    {
        var dto = new UserProfileUpdateRequestDTO();
        
        _userProfileServiceMock
            .Setup(s => s.UpdateAsync("1", dto, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        
        var result = await _controller.UpdateUser("1", dto, CancellationToken.None);
        
        result.Should().BeOfType<NoContentResult>();
    }
    
    [Fact]
    public async Task DeleteUser_ValidId_ReturnsNoContent()
    {
        _userProfileServiceMock
            .Setup(s => s.DeleteAsync("1", It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        
        var result = await _controller.DeleteUser("1", CancellationToken.None);
        
        result.Should().BeOfType<NoContentResult>();

        _userProfileServiceMock.Verify(
            s => s.DeleteAsync("1", It.IsAny<CancellationToken>()), Times.Once);
    }
    
    [Fact]
    public async Task GetUserByUserId_WhenServiceThrows_ExceptionPropagates()
    {
        _userProfileServiceMock
            .Setup(s => s.GetUserByIdAsync("999"))
            .ThrowsAsync(new NotFoundException("User 999"));
        
        Func<Task> act = () => _controller.GetUserByUserId("999");
        
        await act.Should().ThrowAsync<NotFoundException>();
    }
    
    [Fact]
    public async Task Middleware_WhenNotFoundException_Returns404()
    {
        var logger = new Mock<ILogger<GlobalExceptionHandlingMiddleware>>();

        var middleware = new GlobalExceptionHandlingMiddleware(logger.Object);

        var context = new DefaultHttpContext();

        RequestDelegate next = _ =>
            throw new NotFoundException("User 1");

        await middleware.InvokeAsync(context, next);

        context.Response.StatusCode.Should().Be(404);
    }
}