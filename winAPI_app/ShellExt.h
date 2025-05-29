#pragma once
#include <windows.h>
#include <shlobj.h>

class ShellExt : public IShellExtInit, public IContextMenu {
public:
    ShellExt();
    ~ShellExt();

    // IUnknown
    STDMETHODIMP QueryInterface(REFIID, void**);
    STDMETHODIMP_(ULONG) AddRef();
    STDMETHODIMP_(ULONG) Release();

    // IShellExtInit
    STDMETHODIMP Initialize(LPCITEMIDLIST, LPDATAOBJECT, HKEY);

    // IContextMenu
    STDMETHODIMP QueryContextMenu(HMENU, UINT, UINT, UINT, UINT);
    STDMETHODIMP InvokeCommand(LPCMINVOKECOMMANDINFO);
    STDMETHODIMP GetCommandString(UINT_PTR, UINT, UINT*, LPSTR, UINT);

private:
    ULONG m_cRef;
    WCHAR m_szFile[MAX_PATH];
};
