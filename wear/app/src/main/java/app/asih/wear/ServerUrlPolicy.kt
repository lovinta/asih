package app.asih.wear

import java.net.URI
import java.util.Locale

object ServerUrlPolicy {
    enum class Error { REQUIRED, INVALID_URL, HTTPS_REQUIRED, USER_INFO_NOT_ALLOWED }

    sealed interface Result {
        data class Accepted(val normalizedUrl: String) : Result
        data class Rejected(val error: Error) : Result
    }

    fun validate(rawUrl: String): Result {
        val trimmed = rawUrl.trim()
        if (trimmed.isEmpty()) return Result.Rejected(Error.REQUIRED)
        val uri = try { URI(trimmed) } catch (_: Exception) { return Result.Rejected(Error.INVALID_URL) }
        val scheme = uri.scheme?.lowercase(Locale.ROOT)
        val host = uri.host?.lowercase(Locale.ROOT)
        if (host.isNullOrBlank()) return Result.Rejected(Error.INVALID_URL)
        if (uri.rawUserInfo != null) return Result.Rejected(Error.USER_INFO_NOT_ALLOWED)
        // The app appends /api/... to this base URL, so a query or fragment would break every request.
        if (uri.rawQuery != null || uri.rawFragment != null) return Result.Rejected(Error.INVALID_URL)
        if (scheme == "https") return Result.Accepted(trimmed.trimEnd('/'))
        if (scheme == "http" && host in DEV_HOSTS) return Result.Accepted(trimmed.trimEnd('/'))
        return Result.Rejected(Error.HTTPS_REQUIRED)
    }

    private val DEV_HOSTS = setOf("10.0.2.2", "localhost", "127.0.0.1")
}
