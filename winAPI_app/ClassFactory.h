#pragma once
#include <windows.h>

class ShellExt;

class ClassFactory : public IClassFactory {
public:
    ClassFactory();
    ~ClassFactory();

    // IUnknown
    STDMETHODIMP QueryInterface(REFIID, void**);
    STDMETHODIMP_(ULONG) AddRef();
    STDMETHODIMP_(ULONG) Release();

    // IClassFactory
    STDMETHODIMP CreateInstance(IUnknown*, REFIID, void**);
    STDMETHODIMP LockServer(BOOL);

private:
    ULONG m_cRef;
};
