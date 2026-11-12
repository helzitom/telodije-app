const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const REGLAS = `
# Conserva las clases de WorkManager que se crean por reflexión.
-keep class androidx.work.impl.WorkDatabase { *; }
-keep class * extends androidx.room.RoomDatabase { *; }
-keep class androidx.work.** { *; }
`;

const withWorkManagerRules = (config) =>
    withDangerousMod(config, [
        "android",
        async (config) => {
            const archivo = path.join(
                config.modRequest.platformProjectRoot,
                "app",
                "proguard-rules.pro"
            );
            fs.mkdirSync(path.dirname(archivo), { recursive: true });
            fs.appendFileSync(archivo, REGLAS);
            return config;
        },
    ]);

module.exports = withWorkManagerRules;