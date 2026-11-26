using System.Net;

namespace BLL.Exceptions;

public class ForbiddenException : CustomException
{
    public ForbiddenException(string message)
        : base(message, statusCode: HttpStatusCode.Forbidden)
    {
    }
}
