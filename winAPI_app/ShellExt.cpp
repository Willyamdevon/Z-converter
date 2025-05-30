#include "ShellExt.h"
#include <shlwapi.h>
#include <strsafe.h>
#include <windows.h>
#include "resource.h"

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

std::wstring ShellExt::GetFileExtension() const {
    LPCWSTR path = m_szFile;
    LPCWSTR ext = PathFindExtensionW(path);
    if (ext && *ext)
        return std::wstring(ext);
    return L"";
}

HBITMAP hbmpFromIcon(HICON hIcon) {
    ICONINFO iconInfo = {};
    GetIconInfo(hIcon, &iconInfo);
    return iconInfo.hbmColor;
}

STDMETHODIMP ShellExt::QueryContextMenu(HMENU hMenu, UINT indexMenu, UINT idCmdFirst, UINT, UINT uFlags) {
    if (CMF_DEFAULTONLY & uFlags)
        return MAKE_HRESULT(SEVERITY_SUCCESS, 0, 0);

    HMENU hSubMenu = CreatePopupMenu();
    int commandOffset = 1;
    m_formats.clear();

    std::wstring ext = GetFileExtension();
    for (auto& c : ext) c = towlower(c);

    if (ext == L".jpg" || ext == L".jpeg" || ext == L".png" || ext == L".bmp" || ext == L".webp") {
        if (ext != L".png") {
            AppendMenuW(hSubMenu, MF_STRING, idCmdFirst + commandOffset++, L"to png");
            m_formats.push_back(L"png");
        }
        if (ext != L".jpg") {
            AppendMenuW(hSubMenu, MF_STRING, idCmdFirst + commandOffset++, L"to jpg");
            m_formats.push_back(L"jpg");
        }
        if (ext != L".jpeg") {
            AppendMenuW(hSubMenu, MF_STRING, idCmdFirst + commandOffset++, L"to jpeg");
            m_formats.push_back(L"jpeg");
        }
    } else if (ext == L".mp4" || ext == L".avi" || ext == L".mov") {
        AppendMenuW(hSubMenu, MF_STRING, idCmdFirst + commandOffset++, L"to mp3");
        m_formats.push_back(L"mp3");

        AppendMenuW(hSubMenu, MF_STRING, idCmdFirst + commandOffset++, L"to wav");
        m_formats.push_back(L"wav");
    } else if (ext == L".pdf" || ext == L".docx") {
        AppendMenuW(hSubMenu, MF_STRING, idCmdFirst + commandOffset++, L"to txt");
        m_formats.push_back(L"txt");

        if (ext != L".pdf") {
            AppendMenuW(hSubMenu, MF_STRING, idCmdFirst + commandOffset++, L"to pdf");
            m_formats.push_back(L"pdf");
        }
    } else {
        AppendMenuW(hSubMenu, MF_STRING, idCmdFirst + commandOffset++, L"to png");
        m_formats.push_back(L"png");
    }

    HICON hIcon = (HICON)LoadImageW(GetModuleHandleW(L"libConvertShellExt.dll"),
                                    MAKEINTRESOURCEW(IDI_ICON1),
                                    IMAGE_ICON, 16, 16, LR_DEFAULTCOLOR);

    MENUITEMINFOW mii = { sizeof(MENUITEMINFOW) };
    mii.fMask = MIIM_SUBMENU | MIIM_STRING | MIIM_ID | MIIM_BITMAP;
    mii.hSubMenu = hSubMenu;
    mii.wID = idCmdFirst;
    mii.dwTypeData = (LPWSTR)L"Z-Converter";
    mii.hbmpItem = hbmpFromIcon(hIcon);

    InsertMenuItemW(hMenu, indexMenu, TRUE, &mii);

    return MAKE_HRESULT(SEVERITY_SUCCESS, 0, commandOffset); // включает заголовок
}

STDMETHODIMP ShellExt::InvokeCommand(LPCMINVOKECOMMANDINFO pici) {
    if (HIWORD(pici->lpVerb) != 0)
        return E_FAIL;

    int cmd = LOWORD(pici->lpVerb);
    if (cmd == 0 || cmd > (int)m_formats.size())
        return E_FAIL;

    LPCWSTR format = m_formats[cmd - 1].c_str();

    WCHAR msg[256];
    StringCchPrintfW(msg, 256, L"Converting %s to %s...", m_szFile, format);
    MessageBoxW(NULL, msg, L"Info", MB_OK);
    return S_OK;
}

STDMETHODIMP ShellExt::GetCommandString(UINT_PTR, UINT, UINT*, LPSTR, UINT) {
    return E_NOTIMPL;
}
