#include <napi.h>
#include "deimos_cipher.h"
#include <iostream>
#include <sodium.h>
#include <openssl/evp.h>

// Convert a JavaScript string to std::string
std::string JsStringToCpp(const Napi::Value &value)
{
    return value.As<Napi::String>().Utf8Value();
}

// Convert a std::vector<uint8_t> to a JavaScript Uint8Array
Napi::Uint8Array CppVectorToJs(Napi::Env env, const std::vector<uint8_t> &vec)
{
    Napi::Uint8Array result = Napi::Uint8Array::New(env, vec.size());
    memcpy(result.Data(), vec.data(), vec.size());
    return result;
}

// Convert JavaScript Uint8Array to std::vector<uint8_t>
std::vector<uint8_t> JsUint8ArrayToCpp(const Napi::Uint8Array &array)
{
    return std::vector<uint8_t>(array.Data(), array.Data() + array.ByteLength());
}

// Node.js wrapper for encryption
Napi::Value Encrypt(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();

    try
    {
        if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString())
        {
            Napi::TypeError::New(env, "Expected two strings (plaintext, password)").ThrowAsJavaScriptException();
            return env.Null();
        }

        std::string plaintext = JsStringToCpp(info[0]);
        std::string password = JsStringToCpp(info[1]);

        std::vector<uint8_t> ciphertext = deimosCipherEncrypt(plaintext, password);

        return CppVectorToJs(env, ciphertext);
    }
    catch (const std::exception &e)
    {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
    catch (...)
    {
        Napi::Error::New(env, "Unknown error in encryption").ThrowAsJavaScriptException();
        return env.Null();
    }
}

// Node.js wrapper for decryption
Napi::Value Decrypt(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();

    try
    {
        if (info.Length() < 2 || !info[0].IsTypedArray() ||
            info[0].As<Napi::TypedArray>().TypedArrayType() != napi_uint8_array ||
            !info[1].IsString())
        {
            Napi::TypeError::New(env, "Expected (ciphertext Uint8Array, password string)").ThrowAsJavaScriptException();
            return env.Null();
        }

        std::vector<uint8_t> ciphertext = JsUint8ArrayToCpp(info[0].As<Napi::Uint8Array>());
        std::string password = JsStringToCpp(info[1]);

        std::string plaintext = deimosCipherDecrypt(ciphertext, password);

        return Napi::String::New(env, plaintext);
    }
    catch (const std::exception &e)
    {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
    catch (...)
    {
        Napi::Error::New(env, "Unknown error in decryption").ThrowAsJavaScriptException();
        return env.Null();
    }
}

// Module initialization
Napi::Object Init(Napi::Env env, Napi::Object exports)
{
    // Initialize libsodium
    if (sodium_init() == -1)
    {
        Napi::Error::New(env, "Failed to initialize libsodium").ThrowAsJavaScriptException();
        return exports;
    }

    // Initialize OpenSSL algorithms
    OpenSSL_add_all_algorithms();

    exports.Set(Napi::String::New(env, "encrypt"), Napi::Function::New(env, Encrypt));
    exports.Set(Napi::String::New(env, "decrypt"), Napi::Function::New(env, Decrypt));

    return exports;
}

NODE_API_MODULE(deimos_cipher, Init)
