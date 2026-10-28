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
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], qualifiers = "w227dp-h227dp-small-notlong-round-watch-xhdpi-keyshidden-nonav")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ScreenshotsTest {
    @Test fun noticeHomeAndSettingsEnglish() {
        prepare(false)
        val scenario = ActivityScenario.launch(MainActivity::class.java)
        assertEquals("NOTICE", MainActivity.testInstance!!.testCurrentScreen)
        capture(scenario, "01-notice-en.png", "01-notice-en-round.png")
        MainActivity.testInstance!!.testNavigateScreen!!("HOME")
        idle()
        assertEquals("HOME", MainActivity.testInstance!!.testCurrentScreen)
        assertRoundHomeLayout()
        capture(scenario, "02-home-en.png", "02-home-en-round.png")
        MainActivity.testInstance!!.testNavigateScreen!!("SETTINGS")
        idle()
        assertEquals("SETTINGS", MainActivity.testInstance!!.testCurrentScreen)
        capture(scenario, "03-settings-en.png", "03-settings-en-round.png")
        MainActivity.testInstance!!.finish()
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
        capture(scenario, "04-notice-es.png", "04-notice-es-round.png")
        MainActivity.testInstance!!.testNavigateScreen!!("HOME")
        idle()
        assertEquals("HOME", MainActivity.testInstance!!.testCurrentScreen)
        assertRoundHomeLayout()
        capture(scenario, "05-home-es.png", "05-home-es-round.png")
        MainActivity.testInstance!!.finish()
    }
}

internal fun prepare(acknowledged: Boolean, serverUrl: String? = null) {
    val context = ApplicationProvider.getApplicationContext<Context>()
    context.getSharedPreferences("asih", Context.MODE_PRIVATE).edit().clear()
        .putBoolean("notice_ack", acknowledged).apply {
            if (serverUrl != null) putString("server_url", serverUrl)
        }.commit()
}

internal fun idle() { shadowOf(android.os.Looper.getMainLooper()).idleFor(16, java.util.concurrent.TimeUnit.MILLISECONDS) }
internal fun capture(scenario: ActivityScenario<MainActivity>, name: String, roundName: String? = null) {
    val view = MainActivity.testInstance!!.window.decorView
    val bitmap = view.drawToBitmap()
    bitmap.captureRoboImage(File("../screenshots", name).absolutePath)
    if (roundName != null) {
        val masked = Bitmap.createBitmap(bitmap.width, bitmap.height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(masked)
        canvas.drawColor(android.graphics.Color.BLACK)
        val circle = Path().apply { addCircle(bitmap.width / 2f, bitmap.height / 2f, minOf(bitmap.width, bitmap.height) / 2f, Path.Direction.CW) }
        canvas.save()
        canvas.clipPath(circle)
        canvas.drawBitmap(bitmap, 0f, 0f, Paint(Paint.ANTI_ALIAS_FLAG))
        canvas.restore()
        masked.compress(Bitmap.CompressFormat.PNG, 100, File("../screenshots", roundName).outputStream())
    }
}
private fun assertRoundHomeLayout() {
    val activity = MainActivity.testInstance!!
    val title = activity.testTitleBounds ?: error("Title bounds were not recorded")
    val intro = activity.testIntroBounds ?: error("Intro bounds were not recorded")
    val density = activity.resources.displayMetrics.density
    val safeInset = activity.resources.configuration.screenWidthDp * density * 0.1464f
    val clockAreaBottom = 32f * density
    org.junit.Assert.assertTrue("Title overlaps TimeText clock area: title=$title clockBottom=$clockAreaBottom", title.top >= clockAreaBottom)
    org.junit.Assert.assertTrue("Home text exceeds round safe area: intro=$intro inset=$safeInset", intro.left >= safeInset && intro.right <= activity.window.decorView.width - safeInset)
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
