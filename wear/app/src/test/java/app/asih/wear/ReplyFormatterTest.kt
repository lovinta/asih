package app.asih.wear

import org.junit.Assert.*
import org.junit.Test

class ReplyFormatterTest {
    // Sample Flow B runFlow JSON using the synthetic mock fixture from src/fixtures/event.ts.
    private val mockB = """{"trace":[{"tool":"find_activities","summary":"find_activities done.","ok":true},{"tool":"plan_showing_up","summary":"plan_showing_up done.","ok":true},{"tool":"draft_invite","summary":"draft_invite done.","ok":true},{"tool":"output_guard","summary":"Rules only (mock mode).","ok":true}],"result":{"kind":"B","event":{"name":"Riverside Morning Walkers — EXAMPLE","date":"Saturday, November 7, 2026","time":"9:00 AM","place":"Riverside Park main gate, Riverton","source":"Example community board listing (synthetic)","bring":["Comfortable walking shoes","A bottle of water","A light jacket"],"startPoint":"Meet at the Riverside Park main gate sign."},"confirm":{"items":[{"id":"date-0","field":"date","value":"Saturday, November 7, 2026","readable":true,"status":"pending"},{"id":"time-0","field":"time","value":"9:00 AM","readable":true,"status":"pending"},{"id":"place-0","field":"place","value":"Riverside Park main gate, Riverton","readable":true,"status":"pending"}]},"activities":{},"plan":{},"invite":{},"ics":null},"history":[]}"""
    private val mockHelp = """{"trace":[],"result":{"kind":"help","matched":"chest pain"},"history":[]}"""
    private fun appointment(date: String = "Tuesday, November 10, 2026", time: String = "2:00 PM") = """{"result":{"kind":"A","confirm":{"items":[{"field":"date","value":"$date","readable":true},{"field":"time","value":"$time","readable":true}]}}}"""
    @Test fun formatsMockEvent() {
        val reply = formatReply(mockB, false)
        assertEquals("Riverside Morning Walkers — EXAMPLE", reply.line1)
        assertEquals("Saturday, November 7, 2026, 9:00 AM", reply.line2)
    }
    @Test fun formatsEmergencyWithoutCalling() {
        val reply = formatReply(mockHelp, true)
        assertEquals("Esto necesita a una persona ahora.", reply.line1)
        assertTrue(reply.needsCall)
    }
    @Test fun handlesErrorJson() {
        assertEquals("offline", formatReply("{\"error\":\"offline\"}", false).line2)
    }
    @Test fun formatsAppointmentWithReadableDateAndTimeInBothLanguages() {
        assertEquals("I heard a visit on Tuesday, November 10, 2026, 2:00 PM.", formatReply(appointment(), false).line1)
        assertEquals("To check and save it, open Asih on your phone.", formatReply(appointment(), false).line2)
        assertEquals("Escuché una visita el Tuesday, November 10, 2026, 2:00 PM.", formatReply(appointment(), true).line1)
        assertEquals("Para revisarla y guardarla, abra Asih en su teléfono.", formatReply(appointment(), true).line2)
    }
    @Test fun appointmentWithoutReadableDateOrTimeUsesPhotoPrompt() {
        val json = """{"result":{"kind":"A","confirm":{"items":[{"field":"date","value":"unreadable","readable":false}]}}}"""
        assertEquals("Appointment help is on your phone.", formatReply(json, false).line1)
        assertEquals("Abra Asih y tome una foto de la carta.", formatReply(json, true).line2)
    }
    @Test fun formatsPhoneAdAndUnknownInBothLanguages() {
        assertEquals("I check ads from a photo on your phone.", formatReply("""{"result":{"kind":"phone_ad"}}""", false).line1)
        assertEquals("Abra Asih en su teléfono y comparta el anuncio.", formatReply("""{"result":{"kind":"phone_ad"}}""", true).line2)
        assertEquals("I can help with visits, groups and ads.", formatReply("""{"result":{"kind":"unknown"}}""", false).line1)
        assertEquals("Por favor, diga cuál.", formatReply("""{"result":{"kind":"unknown"}}""", true).line2)
    }
    @Test fun formatsUnexpectedAndInvalidResponsesInSpanish() {
        assertEquals("Por favor, diga cuál.", formatReply("{\"result\":{\"kind\":\"unknown\"}}", true).line2)
        assertEquals("Respuesta del servidor no válida.", formatReply("not json", true).line2)
    }
}
