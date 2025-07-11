{
  "targets": [
    {
      "target_name": "deimos_cipher",
      "sources": [
        "src/addon/binding.cc",
        "src/addon/core.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "C:/Deimos Cipher Web Interface/Deimos-Cipher-UI/BackEnd/libraries/libsodium-stable/src/libsodium/include",
        "C:/Deimos Cipher Web Interface/Deimos-Cipher-UI/BackEnd/libraries/OpenSSL-Win64/include"
      ],
      "libraries": [
        "C:/Deimos Cipher Web Interface/Deimos-Cipher-UI/BackEnd/libraries/libsodium-stable/bin/x64/Release/v143/dynamic/libsodium.lib",
        "C:/Deimos Cipher Web Interface/Deimos-Cipher-UI/BackEnd/libraries/OpenSSL-Win64/lib/VC/x64/MD/libssl.lib",
        "C:/Deimos Cipher Web Interface/Deimos-Cipher-UI/BackEnd/libraries/OpenSSL-Win64/lib/VC/x64/MD/libcrypto.lib"
      ],
      "copies": [
        {
          "destination": "build/Release/",
          "files": [
            "C:/Deimos Cipher Web Interface/Deimos-Cipher-UI/BackEnd/libraries/libsodium-stable/bin/x64/Release/v143/dynamic/libsodium.dll",
            "C:/Deimos Cipher Web Interface/Deimos-Cipher-UI/BackEnd/libraries/OpenSSL-Win64/bin/libssl-3-x64.dll",
            "C:/Deimos Cipher Web Interface/Deimos-Cipher-UI/BackEnd/libraries/OpenSSL-Win64/bin/libcrypto-3-x64.dll"
          ]
        }
      ],
      "defines": [
        "NAPI_CPP_EXCEPTIONS"
      ],
      "cflags!": [
        "-fno-exceptions"
      ],
      "cflags_cc!": [
        "-fno-exceptions"
      ],
      "conditions": [
        [
          "OS=='win'",
          {
            "msvs_settings": {
              "VCCLCompilerTool": {
                "ExceptionHandling": 1,
                "RuntimeLibrary": 3
              }
            }
          }
        ]
      ]
    }
  ]
}