package app.asih.wear

import android.content.Context
import android.view.MotionEvent
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.core.view.drawToBitmap
import com.github.takahirom.roborazzi.captureRoboImage
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import org.robolectric.Shadows.shadowOf
import java.io.File

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w227dp-h227dp-small-notlong-round-watch-xhdpi-keyshidden-nonav")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ScreenshotsTest {
    @Test fun noticeHomeAndSettingsEnglish() {
        prepare(false)
        val scenario = ActivityScenario.launch(MainActivity::class.java)
        assertEquals("NOTICE", MainActivity.testInstance!!.testCurrentScreen)
        capture(scenario, "01-notice-en.png")
        repeat(10) { swipe(scenario, 380f, 90f) }
        tap(scenario, 225f, 420f)
        assertEquals("HOME", MainActivity.testInstance!!.testCurrentScreen)
        capture(scenario, "02-home-en.png")
        tap(scenario, 225f, 405f)
        assertEquals("SETTINGS", MainActivity.testInstance!!.testCurrentScreen)
        capture(scenario, "03-settings-en.png")
        MainActivity.testInstance!!.finish()
        MainActivity.testDisableLazyLists = false
    }
}

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "es-rUS-w227dp-h227dp-small-notlong-round-watch-xhdpi-keyshidden-nonav")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class SpanishScreenshotsTest {
    @Test fun noticeAndHomeSpanish() {
        prepare(false)
        val scenario = ActivityScenario.launch(MainActivity::class.java)
        assertEquals("NOTICE", MainActivity.testInstance!!.testCurrentScreen)
        capture(scenario, "04-notice-es.png")
        repeat(10) { swipe(scenario, 380f, 90f) }
        tap(scenario, 225f, 420f)
        assertEquals("HOME", MainActivity.testInstance!!.testCurrentScreen)
        capture(scenario, "05-home-es.png")
        MainActivity.testInstance!!.finish()
        MainActivity.testDisableLazyLists = false
    }
}

internal fun prepare(acknowledged: Boolean, serverUrl: String? = null) {
    MainActivity.testDisableLazyLists = true
    val context = ApplicationProvider.getApplicationContext<Context>()
    context.getSharedPreferences("asih", Context.MODE_PRIVATE).edit().clear()
        .putBoolean("notice_ack", acknowledged).apply {
            if (serverUrl != null) putString("server_url", serverUrl)
        }.commit()
}

internal fun idle() { shadowOf(android.os.Looper.getMainLooper()).idleFor(16, java.util.concurrent.TimeUnit.MILLISECONDS) }
internal fun capture(scenario: ActivityScenario<MainActivity>, name: String) {
    val view = MainActivity.testInstance!!.window.decorView
    view.drawToBitmap().captureRoboImage(File("../screenshots", name).absolutePath)
}
internal fun tap(scenario: ActivityScenario<MainActivity>, x: Float, y: Float) = touch(scenario, x, y, x, y)
internal fun swipe(scenario: ActivityScenario<MainActivity>, fromY: Float, toY: Float) = touch(scenario, 225f, fromY, 225f, toY)
private fun touch(scenario: ActivityScenario<MainActivity>, x0: Float, y0: Float, x1: Float, y1: Float) {
    val view = MainActivity.testInstance!!.window.decorView
    val now = android.os.SystemClock.uptimeMillis()
    view.dispatchTouchEvent(MotionEvent.obtain(now, now, MotionEvent.ACTION_DOWN, x0, y0, 0))
    view.dispatchTouchEvent(MotionEvent.obtain(now, now + 200, MotionEvent.ACTION_MOVE, x1, y1, 0))
    view.dispatchTouchEvent(MotionEvent.obtain(now, now + 250, MotionEvent.ACTION_UP, x1, y1, 0))
    idle()
}
