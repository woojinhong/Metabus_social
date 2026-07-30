import com.github.spotbugs.snom.Confidence
import com.github.spotbugs.snom.Effort
import com.github.spotbugs.snom.SpotBugsTask
import org.springframework.boot.gradle.plugin.SpringBootPlugin

plugins {
    java
    id("org.springframework.boot") version "4.1.0"
    id("com.diffplug.spotless") version "8.8.0"
    id("com.github.spotbugs") version "6.5.9"
}

group = "metabus.social"
version = "0.1.0-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
        vendor = JvmVendorSpec.ADOPTIUM
    }
}

repositories {
    mavenCentral()
}

val springModulithVersion = "2.1.0"
val testcontainersVersion = "2.0.5"

dependencies {
    implementation(platform(SpringBootPlugin.BOM_COORDINATES))
    implementation("org.springframework.boot:spring-boot-starter")
    implementation("org.springframework.modulith:spring-modulith-api:$springModulithVersion")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation(platform("org.springframework.modulith:spring-modulith-bom:$springModulithVersion"))
    testImplementation("org.springframework.modulith:spring-modulith-starter-test")
    testImplementation(platform("org.testcontainers:testcontainers-bom:$testcontainersVersion"))
    testImplementation("org.testcontainers:testcontainers-junit-jupiter")
}

tasks.withType<Test>().configureEach {
    useJUnitPlatform()
}

spotbugs {
    toolVersion = "4.10.3"
    ignoreFailures = false
    effort = Effort.MAX
    reportLevel = Confidence.LOW
}

tasks.withType<SpotBugsTask>().configureEach {
    reports.create("xml") {
        required = true
    }
    reports.create("html") {
        required = true
    }
}

spotless {
    java {
        target("src/**/*.java")
        targetExclude("**/build/**")
        googleJavaFormat("1.35.0")
        removeUnusedImports()
        trimTrailingWhitespace()
        endWithNewline()
    }
    format("gradleKotlin") {
        target("*.gradle.kts")
        trimTrailingWhitespace()
        endWithNewline()
    }
}
