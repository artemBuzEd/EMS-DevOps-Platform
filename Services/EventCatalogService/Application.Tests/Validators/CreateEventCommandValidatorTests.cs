using Application.Validations.CreateEventValidations;
using FluentValidation.TestHelper;

namespace Application.Tests.Validators;

public class CreateEventCommandValidatorTests
{
    private readonly CreateEventCommandValidator _validator = new();

    [Fact]
    public void Validate_ValidCommand_HasNoErrors()
    {
        var command = TestData.CreateValidCommand();

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void Validate_InvalidTitle_HasValidationError(string title)
    {
        var command = TestData.CreateValidCommand();
        command = command with { Title = title };

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Title);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    public void Validate_InvalidCapacity_HasValidationError(int capacity)
    {
        var command = TestData.CreateValidCommand();
        command = command with { Capacity = capacity };

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Capacity);
    }
}