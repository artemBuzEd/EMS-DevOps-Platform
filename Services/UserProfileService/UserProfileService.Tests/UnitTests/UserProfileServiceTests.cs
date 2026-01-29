using Xunit;
using Moq;
using BLL.Services;
using DAL.UoW;
using DAL.Repositories.Contracts;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using BLL.DTOs.Responce;
using System.Threading.Tasks;
using System.Collections.Generic;
using DAL.Entities;
using System.Linq;

namespace UserProfileService.Tests.UnitTests
{
    public class UserProfileServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IDistributedCache> _mockCache;
        private readonly Mock<ILogger<BLL.Services.UserProfileService>> _mockLogger;
        private readonly Mock<IUserProfileRepository> _mockUserProfileRepository;
        private readonly BLL.Services.UserProfileService _service;

        public UserProfileServiceTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockCache = new Mock<IDistributedCache>();
            _mockLogger = new Mock<ILogger<BLL.Services.UserProfileService>>();
            _mockUserProfileRepository = new Mock<IUserProfileRepository>();
            
            _mockUnitOfWork.Setup(u => u.UserProfileRepository).Returns(_mockUserProfileRepository.Object);

            _service = new BLL.Services.UserProfileService(_mockUnitOfWork.Object, _mockCache.Object, _mockLogger.Object);
        }

        [Fact]
        public async Task GetAllUsersAsync_ReturnsAllUsers()
        {
            var users = new List<UserProfile>
            {
                new UserProfile { user_id = "1", first_name = "John", last_name = "Doe" },
                new UserProfile { user_id = "2", first_name = "Jane", last_name = "Doe" }
            };
            
            _mockUserProfileRepository.Setup(r => r.GetAllAsync()).ReturnsAsync(users);
            
            var result = await _service.GetAllUsersAsync();
            
            Assert.NotNull(result);
            Assert.Equal(2, result.Count());
            
            var firstUser = result.First();
            Assert.Equal("John", firstUser.first_name);
            Assert.Equal("Doe", firstUser.last_name);
        }
    }
}
