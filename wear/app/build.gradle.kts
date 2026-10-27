plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}
val serverUrl = providers.gradleProperty("asihServerUrl").orElse("http://10.0.2.2:3000")
android {
    namespace = "app.asih.wear"
    compileSdk = 35
    defaultConfig {
        applicationId = "app.asih.wear"
        minSdk = 30
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
        buildConfigField("String", "SERVER_URL", "\"${serverUrl.get()}\"")
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }
    buildFeatures { compose = true; buildConfig = true }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    kotlinOptions { jvmTarget = "17" }
}
dependencies {
    implementation("androidx.activity:activity-compose:1.10.1")
    implementation("androidx.compose.ui:ui:1.8.1")
    implementation("androidx.compose.ui:ui-tooling-preview:1.8.1")
    implementation("androidx.wear.compose:compose-material:1.4.1")
    implementation("androidx.wear.compose:compose-foundation:1.4.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("org.json:json:20240303")
    testImplementation("junit:junit:4.13.2")
}
