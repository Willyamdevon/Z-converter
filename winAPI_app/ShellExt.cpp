#include "ShellExt.h"
#include <shlwapi.h>
#include <strsafe.h>
#include <windows.h>
#include "resource.h"

ShellExt::ShellExt() : m_cRef(1) {
    m_szFile[0] = 0;
}

ShellExt::~ShellExt() {}

std::wstring GetModulePath() {
    wchar_t path[MAX_PATH] = {0};
    HMODULE hModule = nullptr;
    if (GetModuleHandleExW(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS,
                           (LPCWSTR)GetModulePath,
                           &hModule)) {
        GetModuleFileNameW(hModule, path, MAX_PATH);
        std::wstring fullPath(path);
        size_t pos = fullPath.find_last_of(L"\\/");
        if (pos != std::wstring::npos) {
            return fullPath.substr(0, pos);
        }
    }
    return L"";
}


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

    if (ext == L".jpg" || ext == L".png" || ext == L".ico") {
        if (ext != L".png") {
            AppendMenuW(hSubMenu, MF_STRING, idCmdFirst + commandOffset++, L"to png");
            m_formats.push_back(L"png");
        }
        if (ext != L".jpg") {
            AppendMenuW(hSubMenu, MF_STRING, idCmdFirst + commandOffset++, L"to jpg");
            m_formats.push_back(L"jpg");
        }
        if (ext != L".ico") {
            AppendMenuW(hSubMenu, MF_STRING, idCmdFirst + commandOffset++, L"to ico");
            m_formats.push_back(L"ico");
        }
        if (ext != L".gif") {
            AppendMenuW(hSubMenu, MF_STRING, idCmdFirst + commandOffset++, L"to gif");
            m_formats.push_back(L"gif");
        }
    } else if (ext == L".mp4" || ext == L".mov" || ext == L".mkv") {
        if (ext != L".mp4") {
            AppendMenuW(hSubMenu, MF_STRING, idCmdFirst + commandOffset++, L"to mp4");
            m_formats.push_back(L"mp4");
        }
        if (ext != L".mov") {
            AppendMenuW(hSubMenu, MF_STRING, idCmdFirst + commandOffset++, L"to mov");
            m_formats.push_back(L"mov");
        }
        if (ext != L".mkv") {
            AppendMenuW(hSubMenu, MF_STRING, idCmdFirst + commandOffset++, L"to mkv");
            m_formats.push_back(L"mkv");
        }

        AppendMenuW(hSubMenu, MF_STRING, idCmdFirst + commandOffset++, L"to mp3");
        m_formats.push_back(L"mp3");
        AppendMenuW(hSubMenu, MF_STRING, idCmdFirst + commandOffset++, L"to wav");
        m_formats.push_back(L"wav");

    } else {
        AppendMenuW(hSubMenu, MF_GRAYED, idCmdFirst + commandOffset++, L"Неподдерживаемый тип файла");
        m_formats.push_back(L"none");
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

    std::wstring from = GetFileExtension();
    if (!from.empty() && from[0] == L'.')
        from = from.substr(1);
    for (auto& ch : from) ch = towlower(ch);

    LPCWSTR toFormat = m_formats[cmd - 1].c_str();
    std::wstring to(toFormat);

    std::wstring inputPath(m_szFile);
    std::wstring outputPath = inputPath;

    size_t dotPos = outputPath.find_last_of(L".");
    if (dotPos != std::wstring::npos) {
        outputPath = outputPath.substr(0, dotPos);
    }
    outputPath += L"." + to;

    std::wstring exeDir = GetModulePath();
    std::wstring exePath = exeDir + L"\\Z-Converter.exe";

    std::wstring commandLine = L"\"" + exePath + L"\""
        + L" --from=" + from
        + L" --to=" + to
        + L" --file=\"" + inputPath + L"\""
        + L" --output=\"" + outputPath + L"\"";

    STARTUPINFOW si = { sizeof(si) };
    PROCESS_INFORMATION pi;
    BOOL result = CreateProcessW(
        NULL,
        (LPWSTR)commandLine.c_str(),
        NULL, NULL, FALSE,
        CREATE_NO_WINDOW,
        NULL, NULL,
        &si, &pi
    );

    if (result) {
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
    } else {
        MessageBoxW(NULL, L"Не удалось запустить Z-Converter.exe", L"Ошибка", MB_ICONERROR);
    }

    return S_OK;
}

STDMETHODIMP ShellExt::GetCommandString(UINT_PTR, UINT, UINT*, LPSTR, UINT) {
    return E_NOTIMPL;
}
