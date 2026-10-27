package app.asih.wear

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.net.Uri
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.wear.compose.material.Button
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Scaffold
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.material.Text
import androidx.wear.compose.material.TimeText
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.File
import java.util.Locale
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import kotlin.concurrent.thread

private enum class Screen { NOTICE, HOME, SETTINGS, REPLY }

class MainActivity : ComponentActivity(), TextToSpeech.OnInitListener {
    private var tts: TextToSpeech? = null
    private var ttsReady = false
    private var langCode = "en"
    private val http = OkHttpClient.Builder().callTimeout(45, TimeUnit.SECONDS).build()
    private val executor = Executors.newSingleThreadExecutor()
    private var recorder: AudioRecord? = null
    @Volatile private var recording = false
    private val pcm = ByteArrayOutputStream()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        tts = TextToSpeech(this, this)
        setContent { MaterialTheme { WearApp() } }
    }

    override fun onInit(status: Int) {
        val locale = if (resources.configuration.locales[0].language == "es") Locale("es", "US") else Locale.US
        langCode = if (locale.language == "es") "es" else "en"
        val available = status == TextToSpeech.SUCCESS && (tts?.isLanguageAvailable(locale) ?: TextToSpeech.LANG_NOT_SUPPORTED) >= TextToSpeech.LANG_AVAILABLE
        ttsReady = available
        if (available) { tts?.language = locale; tts?.setSpeechRate(if (langCode == "es") 1.0f else 0.9f) }
        Log.i("AsihTTS", "available=$available status=$status lang=$langCode")
    }

    private fun say(text: String) { if (ttsReady) tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "asih-reply") }

    @Composable private fun WearApp() {
        val ctx = LocalContext.current
        val prefs = remember { getSharedPreferences("asih", MODE_PRIVATE) }
        var screen by remember { mutableStateOf(if (prefs.getBoolean("notice_ack", false)) Screen.HOME else Screen.NOTICE) }
        var statusText by remember { mutableStateOf("") }
        var transcript by remember { mutableStateOf("") }
        var reply by remember { mutableStateOf<Reply?>(null) }
        var serverUrl by remember { mutableStateOf(prefs.getString("server_url", BuildConfig.SERVER_URL) ?: BuildConfig.SERVER_URL) }
        var draftUrl by remember { mutableStateOf(serverUrl) }
        var isRecording by remember { mutableStateOf(false) }
        val spanish = remember { resources.configuration.locales[0].language == "es" }
        langCode = if (spanish) "es" else "en"
        val permission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            if (granted) beginRecording(serverUrl, langCode, { isRecording = true; statusText = getString(R.string.listening) }, { isRecording = false }, { statusText = it }, { tr, r -> transcript = tr; reply = r; statusText = ""; screen = Screen.REPLY; say(listOfNotNull(r.line1, r.line2).joinToString(". ")) })
            else statusText = getString(R.string.permission_denied)
        }
        val noticeItems = listOf(
            getString(R.string.data_lead), getString(R.string.notice_title), getString(R.string.notice_body),
            if (spanish) getString(R.string.acknowledge) else getString(R.string.acknowledge)
        )
        Scaffold(timeText = { TimeText() }) {
            when (screen) {
                Screen.NOTICE -> ScalingLazyColumn(modifier = Modifier.fillMaxSize().background(Color.Black), horizontalAlignment = Alignment.CenterHorizontally, contentPadding = PaddingValues(12.dp)) {
                    items(noticeItems.size) { i ->
                        if (i == noticeItems.lastIndex) Button(onClick = { prefs.edit().putBoolean("notice_ack", true).apply(); screen = Screen.HOME }) { Text(noticeItems[i], fontSize = 17.sp) }
                        else Text(noticeItems[i], color = Color.White, fontSize = if (i == 2) 17.sp else 19.sp, textAlign = TextAlign.Center, modifier = Modifier.padding(vertical = 8.dp))
                    }
                }
                Screen.HOME -> Column(Modifier.fillMaxSize().background(Color.Black).padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.SpaceEvenly) {
                    Text("Asih", color = Color.White, fontSize = 24.sp)
                    Text(getString(R.string.intro), color = Color.White, fontSize = 15.sp, textAlign = TextAlign.Center)
                    Button(onClick = {
                        if (isRecording) { isRecording = false; stopAndSend(serverUrl, langCode, onStatus = { statusText = it }, onResult = { tr, r -> transcript = tr; reply = r; statusText = ""; screen = Screen.REPLY; say(listOfNotNull(r.line1, r.line2).joinToString(". ")) }) }
                        else if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) { beginRecording(serverUrl, langCode, { isRecording = true; statusText = getString(R.string.listening) }, { isRecording = false }, { statusText = it }, { tr, r -> transcript = tr; reply = r; statusText = ""; screen = Screen.REPLY; say(listOfNotNull(r.line1, r.line2).joinToString(". ")) }) }
                        else permission.launch(Manifest.permission.RECORD_AUDIO)
                    }, modifier = Modifier.size(112.dp).semantics { contentDescription = getString(if (isRecording) R.string.tap_stop else R.string.tap_talk) }) { Text(if (isRecording) getString(R.string.tap_stop) else getString(R.string.tap_talk), textAlign = TextAlign.Center, fontSize = 17.sp) }
                    if (statusText.isNotBlank()) Text(statusText, color = Color.White, fontSize = 16.sp, textAlign = TextAlign.Center)
                    Button(onClick = { draftUrl = serverUrl; screen = Screen.SETTINGS }) { Text(getString(R.string.server), fontSize = 14.sp) }
                }
                Screen.SETTINGS -> Column(Modifier.fillMaxSize().background(Color.Black).verticalScroll(rememberScrollState()).padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(getString(R.string.server_url), color = Color.White, fontSize = 18.sp)
                    Text(getString(R.string.server_url), color = Color.White, fontSize = 13.sp)
                    androidx.compose.foundation.text.BasicTextField(value = draftUrl, onValueChange = { draftUrl = it }, textStyle = androidx.compose.ui.text.TextStyle(color = Color.White, fontSize = 15.sp), modifier = Modifier.fillMaxWidth().background(Color.DarkGray).padding(8.dp))
                    Button(onClick = { serverUrl = draftUrl.trim().trimEnd('/'); prefs.edit().putString("server_url", serverUrl).apply(); screen = Screen.HOME }) { Text(getString(R.string.save)) }
                    Button(onClick = { screen = Screen.HOME }) { Text(getString(R.string.back)) }
                }
                Screen.REPLY -> {
                    val result = reply
                    ScalingLazyColumn(modifier = Modifier.fillMaxSize().background(Color.Black), horizontalAlignment = Alignment.CenterHorizontally, contentPadding = PaddingValues(12.dp)) {
                        if (result != null) {
                            item { Text(result.line1, color = Color.White, fontSize = 20.sp, textAlign = TextAlign.Center) }
                            result.line2?.let { item { Text(it, color = Color.White, fontSize = 18.sp, textAlign = TextAlign.Center) } }
                            if (result.needsCall) {
                                item { Text(if (spanish) getString(R.string.not_medical_es) else getString(R.string.not_medical), color = Color.LightGray, fontSize = 13.sp, textAlign = TextAlign.Center) }
                                item { Button(onClick = { startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:911"))) }) { Text(getString(R.string.call_911)) } }
                            } else if (result.showFullDetails) item { Text(getString(R.string.details_phone), color = Color.LightGray, fontSize = 13.sp, textAlign = TextAlign.Center) }
                            if (transcript.isNotBlank()) item { Text(getString(R.string.you_said, transcript), color = Color.LightGray, fontSize = 13.sp, textAlign = TextAlign.Center) }
                            if (!ttsReady) item { Text(if (spanish) getString(R.string.tts_unavailable_es) else getString(R.string.tts_unavailable), color = Color.LightGray, fontSize = 13.sp, textAlign = TextAlign.Center) }
                            item { Button(onClick = { say(listOfNotNull(result.line1, result.line2).joinToString(". ")) }) { Text(getString(R.string.read_again)) } }
                        }
                        item { Button(onClick = { screen = Screen.HOME }) { Text(getString(R.string.back)) } }
                    }
                }
            }
        }
    }

    private fun beginRecording(url: String, lang: String, onStarted: () -> Unit, onAutoStop: () -> Unit, onStatus: (String) -> Unit, onResult: (String, Reply) -> Unit) {
        if (recording) return
        val rate = 16000
        val minBuffer = AudioRecord.getMinBufferSize(rate, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT).coerceAtLeast(4096)
        try {
            val rec = AudioRecord(MediaRecorder.AudioSource.MIC, rate, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT, minBuffer)
            if (rec.state != AudioRecord.STATE_INITIALIZED) { rec.release(); throw IllegalStateException("Microphone could not start.") }
            recorder = rec; pcm.reset(); recording = true; rec.startRecording(); onStarted()
            thread(name = "AsihAudioRecord") {
                val buffer = ByteArray(minBuffer)
                val start = System.currentTimeMillis()
                try { while (recording && System.currentTimeMillis() - start < 30_000) { val n = rec.read(buffer, 0, buffer.size); if (n > 0) synchronized(pcm) { pcm.write(buffer, 0, n) } } }
                catch (e: Exception) { Log.e("AsihAudio", "recording failed", e) }
                if (recording) runOnUiThread { onAutoStop(); stopAndSend(url, lang, onStatus, onResult) }
            }
        } catch (e: Exception) { Log.e("AsihAudio", "could not initialize recorder", e); onStatus("Microphone could not start.") }
    }

    private fun stopAndSend(url: String, lang: String, onStatus: (String) -> Unit, onResult: (String, Reply) -> Unit) {
        recording = false
        val rec = recorder; recorder = null
        try { rec?.stop() } catch (_: Exception) { }
        rec?.release()
        val bytes = synchronized(pcm) { pcm.toByteArray() }
        onStatus(getString(R.string.sending))
        executor.execute {
            try {
                val wav = makeWav(bytes)
                val transcribeBody = MultipartBody.Builder().setType(MultipartBody.FORM)
                    .addFormDataPart("audio", "voice.wav", wav.toRequestBody("audio/wav".toMediaType()))
                    .addFormDataPart("lang", lang).build()
                val transcribeResponse = http.newCall(Request.Builder().url("$url/api/transcribe").post(transcribeBody).build()).execute()
                val transcriptJson = transcribeResponse.body?.string().orEmpty()
                if (!transcribeResponse.isSuccessful) throw IllegalStateException("HTTP ${transcribeResponse.code}: ${errorMessage(transcriptJson)}")
                val text = JSONObject(transcriptJson).optString("transcript")
                val payload = JSONObject().put("flow", "B").put("lang", lang).put("input", JSONObject().put("text", text)).toString()
                val agentResponse = http.newCall(Request.Builder().url("$url/api/agent").post(payload.toRequestBody("application/json".toMediaType())).build()).execute()
                val agentJson = agentResponse.body?.string().orEmpty()
                if (!agentResponse.isSuccessful) throw IllegalStateException("HTTP ${agentResponse.code}: ${errorMessage(agentJson)}")
                runOnUiThread { onResult(text, formatReply(agentJson, lang == "es")) }
            } catch (e: Exception) {
                val short = e.message?.take(100) ?: "Network error."
                runOnUiThread { onResult("", Reply(getString(R.string.something_wrong), short)) }
            }
        }
    }

    private fun errorMessage(raw: String): String = try { JSONObject(raw).optString("error", raw).take(100) } catch (_: Exception) { raw.take(100) }

    private fun makeWav(data: ByteArray): ByteArray {
        val out = ByteArrayOutputStream()
        fun ascii(s: String) = out.write(s.toByteArray(Charsets.US_ASCII))
        fun le(value: Int) { out.write(value and 0xff); out.write((value shr 8) and 0xff); out.write((value shr 16) and 0xff); out.write((value shr 24) and 0xff) }
        ascii("RIFF"); le(data.size + 36); ascii("WAVEfmt "); le(16); out.write(1); out.write(0); out.write(1); out.write(0); le(16000); le(32000); out.write(2); out.write(0); out.write(16); out.write(0); ascii("data"); le(data.size); out.write(data); return out.toByteArray()
    }

    override fun onDestroy() { recording = false; recorder?.release(); tts?.stop(); tts?.shutdown(); executor.shutdownNow(); super.onDestroy() }
}
