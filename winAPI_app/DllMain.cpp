#include <windows.h>
#include <shlwapi.h>
#include <string>
#include <new>

#ifndef SELFREG_E_CLASS
#define SELFREG_E_CLASS HRESULT_FROM_WIN32(ERROR_CLASS_DOES_NOT_EXIST)
#endif

#include "ClassFactory.h"
#include "ShellExt.h"


#pragma comment(lib, "shlwapi.lib")

HINSTANCE g_hInst = nullptr;
long g_cDllRef = 0;

const CLSID CLSID_ShellExt = {
    0x8e269706, 0x2ad4, 0x47ca,
    { 0x87, 0xed, 0xd0, 0x9d, 0xdc, 0x1c, 0xb8, 0xdc }
};

BOOL APIENTRY DllMain(HMODULE hModule, DWORD ul_reason_for_call, LPVOID) {
    if (ul_reason_for_call == DLL_PROCESS_ATTACH) {
        g_hInst = hModule;
        DisableThreadLibraryCalls(hModule);
    }
    return TRUE;
}

STDAPI DllCanUnloadNow() {
    return (g_cDllRef == 0 ? S_OK : S_FALSE);
}

STDAPI DllGetClassObject(REFCLSID rclsid, REFIID riid, void** ppv) {
    if (rclsid != CLSID_ShellExt)
        return CLASS_E_CLASSNOTAVAILABLE;

    ClassFactory* pFactory = new (std::nothrow) ClassFactory();
    if (!pFactory)
        return E_OUTOFMEMORY;

    HRESULT hr = pFactory->QueryInterface(riid, ppv);
    pFactory->Release();
    return hr;
}

STDAPI DllRegisterServer() {
    WCHAR szModule[MAX_PATH];
    if (!GetModuleFileNameW(g_hInst, szModule, MAX_PATH))
        return HRESULT_FROM_WIN32(GetLastError());

    const wchar_t* clsidStr = L"{8e269706-2ad4-47ca-87ed-d09ddc1cb8dc}";
    HKEY hKey = nullptr;

    if (RegCreateKeyW(HKEY_CLASSES_ROOT, (std::wstring(L"CLSID\\") + clsidStr).c_str(), &hKey) != ERROR_SUCCESS)
        return SELFREG_E_CLASS;

    RegSetValueExW(hKey, nullptr, 0, REG_SZ, (BYTE*)L"ConvertShellExt Class", sizeof(L"ConvertShellExt Class"));
    HKEY hInproc = nullptr;

    if (RegCreateKeyW(hKey, L"InprocServer32", &hInproc) == ERROR_SUCCESS) {
        RegSetValueExW(hInproc, nullptr, 0, REG_SZ, (BYTE*)szModule, (lstrlenW(szModule) + 1) * sizeof(WCHAR));
        RegSetValueExW(hInproc, L"ThreadingModel", 0, REG_SZ, (BYTE*)L"Apartment", sizeof(L"Apartment"));
        RegCloseKey(hInproc);
    }
    RegCloseKey(hKey);

    if (RegCreateKeyW(HKEY_CLASSES_ROOT, L"*\\shellex\\ContextMenuHandlers\\ConvertShellExt", &hKey) == ERROR_SUCCESS) {
        RegSetValueExW(hKey, nullptr, 0, REG_SZ, (BYTE*)clsidStr, (lstrlenW(clsidStr) + 1) * sizeof(WCHAR));
        RegCloseKey(hKey);
    }

    return S_OK;
}

STDAPI DllUnregisterServer() {
    const wchar_t* clsidStr = L"{8e269706-2ad4-47ca-87ed-d09ddc1cb8dc}";
    std::wstring clsidKey = L"CLSID\\" + std::wstring(clsidStr);

    SHDeleteKeyW(HKEY_CLASSES_ROOT, clsidKey.c_str());
    SHDeleteKeyW(HKEY_CLASSES_ROOT, L"*\\shellex\\ContextMenuHandlers\\ConvertShellExt");

    return S_OK;
}
