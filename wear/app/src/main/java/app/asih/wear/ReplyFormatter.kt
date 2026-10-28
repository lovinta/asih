package app.asih.wear

import org.json.JSONObject

data class Reply(val line1: String, val line2: String? = null, val needsCall: Boolean = false, val showFullDetails: Boolean = false)

/** Formats the server's runFlow response into the short watch-safe reply. */
fun formatReply(
    json: String,
    spanish: Boolean,
    unexpected: String = if (spanish) "Respuesta inesperada." else "Unexpected response.",
    invalid: String = if (spanish) "Respuesta del servidor no válida." else "Invalid server response.",
    strings: Map<String, String> = emptyMap(),
): Reply {
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
            "A" -> {
                val items = result.optJSONObject("confirm")?.optJSONArray("items")
                var date = ""
                var time = ""
                if (items != null) for (i in 0 until items.length()) {
                    val item = items.optJSONObject(i) ?: continue
                    if (!item.optBoolean("readable", false)) continue
                    when (item.optString("field")) {
                        "date" -> date = item.optString("value")
                        "time" -> time = item.optString("value")
                    }
                }
                val heard = listOf(date, time).filter { it.isNotBlank() }.joinToString(", ")
                if (heard.isNotBlank()) Reply(
                    strings["appointment_heard"]?.replace("%1\$s", heard) ?: if (spanish) "Escuché una visita el $heard." else "I heard a visit on $heard.",
                    strings["appointment_phone"] ?: if (spanish) "Para revisarla y guardarla, abra Asih en su teléfono." else "To check and save it, open Asih on your phone.",
                ) else Reply(
                    strings["appointment_fallback"] ?: if (spanish) "La ayuda con citas está en su teléfono." else "Appointment help is on your phone.",
                    strings["appointment_photo"] ?: if (spanish) "Abra Asih y tome una foto de la carta." else "Open Asih and take a photo of the letter.",
                )
            }
            "phone_ad" -> Reply(
                strings["phone_ad_line1"] ?: if (spanish) "Reviso anuncios con una foto en su teléfono." else "I check ads from a photo on your phone.",
                strings["phone_ad_line2"] ?: if (spanish) "Abra Asih en su teléfono y comparta el anuncio." else "Open Asih on your phone and share the ad.",
            )
            "unknown" -> Reply(
                strings["unknown_line1"] ?: if (spanish) "Puedo ayudar con citas, grupos y anuncios." else "I can help with visits, groups and ads.",
                strings["unknown_line2"] ?: if (spanish) "Por favor, diga cuál." else "Please say which one.",
            )
            "C" -> Reply(if (spanish) "Abra Asih en su teléfono para esto." else "Open Asih on your phone for this.")
            else -> Reply(if (spanish) "Algo salió mal." else "Something went wrong.", unexpected)
        }
    } catch (_: Exception) {
        Reply(if (spanish) "Algo salió mal." else "Something went wrong.", invalid)
    }
}
