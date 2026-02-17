plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.example.appshopfenshen"
    
    // THAY ĐỔI QUAN TRỌNG: Cấu hình cứng phiên bản SDK
    compileSdk = 36
    buildToolsVersion = "35.0.0" 

    // CHÚ Ý: Đã comment dòng dưới để tránh lỗi tìm NDK 25.0.1
    // ndkVersion = flutter.ndkVersion

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

    buildTypes {
        release {
            // Dùng key debug để chạy release mode (chỉ dùng cho dev)
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

flutter {
    source = "../.."
}
