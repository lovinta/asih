package app.asih.wear

import org.json.JSONObject

data class Reply(val line1: String, val line2: String? = null, val needsCall: Boolean = false, val showFullDetails: Boolean = false)

/** Formats the server's runFlow response into the short watch-safe reply. */
fun formatReply(json: String, spanish: Boolean, unexpected: String = if (spanish) "Respuesta inesperada." else "Unexpected response.", invalid: String = if (spanish) "Respuesta del servidor no válida." else "Invalid server response."): Reply {
    return try {
        val root = JSONObject(json)
        if (root.has("error")) return Reply(if (spanish) "Algo salió mal." else "Something went wrong.", root.optString("error").take(100))
        val result = root.optJSONObject("result") ?: root
        when (result.optString("kind")) {
            "help" -> if (spanish) Reply("Esto necesita a una persona ahora.", "Llame al 911. Detalles en su teléfono.", true)
                else Reply("This needs a person now.", "Call 911. Details on your phone.", true)
            "B" -> {
                val event = result.optJSONObject("event")
                if (event == null || event == JSONObject.NULL) Reply(if (spanish) "No encontré un evento." else "I found no event.")
                else Reply(event.optString("name"), listOf(event.optString("date"), event.optString("time")).filter { it.isNotBlank() }.joinToString(", "), showFullDetails = true)
            }
            "A", "C" -> Reply(if (spanish) "Abra Asih en su teléfono para esto." else "Open Asih on your phone for this.")
            else -> Reply(if (spanish) "Algo salió mal." else "Something went wrong.", unexpected)
        }
    } catch (_: Exception) {
        Reply(if (spanish) "Algo salió mal." else "Something went wrong.", invalid)
    }
}
