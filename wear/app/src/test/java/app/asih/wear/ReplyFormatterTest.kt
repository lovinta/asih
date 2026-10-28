package app.asih.wear

import org.junit.Assert.*
import org.junit.Test

class ReplyFormatterTest {
    // Sample Flow B runFlow JSON using the synthetic mock fixture from src/fixtures/event.ts.
    private val mockB = """{"trace":[{"tool":"find_activities","summary":"find_activities done.","ok":true},{"tool":"plan_showing_up","summary":"plan_showing_up done.","ok":true},{"tool":"draft_invite","summary":"draft_invite done.","ok":true},{"tool":"output_guard","summary":"Rules only (mock mode).","ok":true}],"result":{"kind":"B","event":{"name":"Riverside Morning Walkers — EXAMPLE","date":"Saturday, November 7, 2026","time":"9:00 AM","place":"Riverside Park main gate, Riverton","source":"Example community board listing (synthetic)","bring":["Comfortable walking shoes","A bottle of water","A light jacket"],"startPoint":"Meet at the Riverside Park main gate sign."},"confirm":{"items":[{"id":"date-0","field":"date","value":"Saturday, November 7, 2026","readable":true,"status":"pending"},{"id":"time-0","field":"time","value":"9:00 AM","readable":true,"status":"pending"},{"id":"place-0","field":"place","value":"Riverside Park main gate, Riverton","readable":true,"status":"pending"}]},"activities":{},"plan":{},"invite":{},"ics":null},"history":[]}"""
    private val mockHelp = """{"trace":[],"result":{"kind":"help","matched":"chest pain"},"history":[]}"""
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
    @Test fun formatsUnexpectedAndInvalidResponsesInSpanish() {
        assertEquals("Respuesta inesperada.", formatReply("{\"result\":{\"kind\":\"unknown\"}}", true).line2)
        assertEquals("Respuesta del servidor no válida.", formatReply("not json", true).line2)
    }
}
