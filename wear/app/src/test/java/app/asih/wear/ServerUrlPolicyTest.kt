package app.asih.wear

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ServerUrlPolicyTest {
    @Test fun acceptsHttpsAndNormalizesInput() {
        assertEquals(ServerUrlPolicy.Result.Accepted("https://example.org/api"), ServerUrlPolicy.validate("  https://example.org/api///  "))
        assertEquals(ServerUrlPolicy.Result.Accepted("https://example.org"), ServerUrlPolicy.validate("https://example.org/"))
    }

    @Test fun acceptsOnlyNamedHttpDevelopmentHosts() {
        listOf("10.0.2.2", "localhost", "127.0.0.1").forEach { host ->
            assertEquals(ServerUrlPolicy.Result.Accepted("http://$host:3000"), ServerUrlPolicy.validate("http://$host:3000/"))
        }
        assertEquals(ServerUrlPolicy.Result.Rejected(ServerUrlPolicy.Error.HTTPS_REQUIRED), ServerUrlPolicy.validate("http://example.org"))
    }

    @Test fun rejectsMissingSchemeUnsupportedSchemeEmptyHostAndCredentials() {
        listOf("example.org", "ftp://example.org", "https:///path", "https://user:pass@example.org").forEach { value ->
            assertTrue("Expected rejection for $value", ServerUrlPolicy.validate(value) is ServerUrlPolicy.Result.Rejected)
        }
        assertEquals(ServerUrlPolicy.Result.Rejected(ServerUrlPolicy.Error.REQUIRED), ServerUrlPolicy.validate("  "))
        assertEquals(ServerUrlPolicy.Result.Rejected(ServerUrlPolicy.Error.USER_INFO_NOT_ALLOWED), ServerUrlPolicy.validate("https://user@example.org"))
    }
}
