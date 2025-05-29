#include "ShellExt.h"
#include <shlwapi.h>
#include <strsafe.h>
#include <windows.h>
#include <strsafe.h>  // для StringCchPrintfW

ShellExt::ShellExt() : m_cRef(1) {
    m_szFile[0] = 0;
}

ShellExt::~ShellExt() {}

STDMETHODIMP ShellExt::QueryInterface(REFIID riid, void** ppv) {
    if (riid == IID_IUnknown || riid == IID_IShellExtInit)
        *ppv = (IShellExtInit*)this;
    else if (riid == IID_IContextMenu)
        *ppv = (IContextMenu*)this;
    else {
        *ppv = nullptr;
        return E_NOINTERFACE;
    }
    AddRef();
    return S_OK;
}

STDMETHODIMP_(ULONG) ShellExt::AddRef() {
    return InterlockedIncrement(&m_cRef);
}

STDMETHODIMP_(ULONG) ShellExt::Release() {
    ULONG cRef = InterlockedDecrement(&m_cRef);
    if (cRef == 0)
        delete this;
    return cRef;
}

STDMETHODIMP ShellExt::Initialize(LPCITEMIDLIST, LPDATAOBJECT pDataObj, HKEY) {
    if (!pDataObj) return E_INVALIDARG;

    FORMATETC fe = { CF_HDROP, NULL, DVASPECT_CONTENT, -1, TYMED_HGLOBAL };
    STGMEDIUM stm;

    if (FAILED(pDataObj->GetData(&fe, &stm)))
        return E_FAIL;

    HDROP hDrop = (HDROP)GlobalLock(stm.hGlobal);
    if (hDrop == nullptr)
        return E_FAIL;

    if (DragQueryFileW(hDrop, 0, m_szFile, MAX_PATH) == 0) {
        GlobalUnlock(stm.hGlobal);
        ReleaseStgMedium(&stm);
        return E_FAIL;
    }

    GlobalUnlock(stm.hGlobal);
    ReleaseStgMedium(&stm);
    return S_OK;
}

STDMETHODIMP ShellExt::QueryContextMenu(HMENU hMenu, UINT indexMenu, UINT idCmdFirst, UINT, UINT uFlags) {
    if (CMF_DEFAULTONLY & uFlags)
        return MAKE_HRESULT(SEVERITY_SUCCESS, 0, 0);

    HMENU hSubMenu = CreatePopupMenu();

    AppendMenuW(hSubMenu, MF_STRING, idCmdFirst + 1, L"to png");
    AppendMenuW(hSubMenu, MF_STRING, idCmdFirst + 2, L"to jpg");
    AppendMenuW(hSubMenu, MF_STRING, idCmdFirst + 3, L"to jpeg");
    InsertMenuW(hMenu, indexMenu, MF_BYPOSITION | MF_POPUP, (UINT_PTR)hSubMenu, L"Convert");


    return MAKE_HRESULT(SEVERITY_SUCCESS, 0, 4); // 3 commands + 1 submenu
}

STDMETHODIMP ShellExt::InvokeCommand(LPCMINVOKECOMMANDINFO pici) {
    if (HIWORD(pici->lpVerb) != 0)
        return E_FAIL;

    int cmd = LOWORD(pici->lpVerb);

    LPCWSTR format = L"";
    if (cmd == 1) format = L"png";
    else if (cmd == 2) format = L"jpg";
    else if (cmd == 3) format = L"jpeg";
    else return E_FAIL;

    WCHAR msg[256];
    StringCchPrintfW(msg, 256, L"Converting %s to %s...", m_szFile, format);
    MessageBoxW(NULL, msg, L"Info", MB_OK);
    return S_OK;
}

STDMETHODIMP ShellExt::GetCommandString(UINT_PTR, UINT, UINT*, LPSTR, UINT) {
    return E_NOTIMPL;
}
