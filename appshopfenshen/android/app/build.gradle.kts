plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
    id("com.google.gms.google-services")
}

android {
    namespace = "com.example.appshopfenshen"
    
    // THAY ĐỔI QUAN TRỌNG: Cấu hình cứng phiên bản SDK
    compileSdk = 36
    buildToolsVersion = "36.1.0"

    ndkVersion = "27.0.12077973"

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        applicationId = "com.example.appshopfenshen"
        
        // Cấu hình cứng min/target SDK
        minSdk = flutter.minSdkVersion
        targetSdk = 36
        
        // Đặt cứng version để tránh lỗi đọc biến môi trường lúc này
        versionCode = 1
        versionName = "1.0.0"
    }

    signingConfigs {
        create("my_debug") {
            storeFile = file("android_debug.keystore")
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
    }

    buildTypes {
        getByName("debug") {
            signingConfig = signingConfigs.getByName("my_debug")
        }
        release {
            signingConfig = signingConfigs.getByName("my_debug")
        }
    }
}

flutter {
    source = "../.."
}
