package app.asih.wear

import android.Manifest
import android.app.Application
import android.os.Looper
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertTrue
import org.junit.Assert.assertEquals
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.util.concurrent.TimeUnit

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w227dp-h227dp-small-notlong-round-watch-xhdpi-keyshidden-nonav")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class EndToEndMockServerTest {
    @Test fun voicePathShowsMockReply() {
        val url = System.getenv("ASIH_E2E_URL")
        assumeTrue("ASIH_E2E_URL is not set", !url.isNullOrBlank())
        prepare(true, url)
        val application = ApplicationProvider.getApplicationContext<Application>()
        shadowOf(application).grantPermissions(Manifest.permission.RECORD_AUDIO)
        val scenario = ActivityScenario.launch(MainActivity::class.java)
        val activity = MainActivity.testInstance!!
        activity.testPcmSource = { ByteArray(3200) }
        assertEquals("Tap to talk", activity.testTalkButtonLabel)
        tap(scenario, 225f, 225f)
        assertEquals("Tap to stop", activity.testTalkButtonLabel)
        tap(scenario, 225f, 225f)
        val deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(20)
        var visible: List<String> = emptyList()
        while (System.nanoTime() < deadline && visible.isEmpty()) {
            idle()
            visible = activity.testRenderedText
            if (visible.isEmpty()) Thread.sleep(100)
        }
        assertTrue("Reply did not appear; rendered text was $visible", visible.contains("Appointment help is on your phone."))
        assertTrue(visible.contains("Open Asih and take a photo of the letter."))
        capture(scenario, "06-reply-en.png")
        activity.finish()
        MainActivity.testDisableLazyLists = false
    }
}
