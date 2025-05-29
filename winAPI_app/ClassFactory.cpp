#include "ShellExt.h"
#include "ClassFactory.h"
#include <new>

extern long g_cDllRef;

ClassFactory::ClassFactory() : m_cRef(1) {
    InterlockedIncrement(&g_cDllRef);
}

ClassFactory::~ClassFactory() {
    InterlockedDecrement(&g_cDllRef);
}

STDMETHODIMP ClassFactory::QueryInterface(REFIID riid, void** ppv) {
    if (riid == IID_IUnknown || riid == IID_IClassFactory)
        *ppv = static_cast<IClassFactory*>(this);
    else {
        *ppv = nullptr;
        return E_NOINTERFACE;
    }
    AddRef();
    return S_OK;
}

STDMETHODIMP_(ULONG) ClassFactory::AddRef() {
    return InterlockedIncrement(&m_cRef);
}

STDMETHODIMP_(ULONG) ClassFactory::Release() {
    ULONG cRef = InterlockedDecrement(&m_cRef);
    if (cRef == 0)
        delete this;
    return cRef;
}

STDMETHODIMP ClassFactory::CreateInstance(IUnknown* pUnkOuter, REFIID riid, void** ppv) {
    if (pUnkOuter != nullptr)
        return CLASS_E_NOAGGREGATION;

    ShellExt* pExt = new (std::nothrow) ShellExt();
    if (!pExt)
        return E_OUTOFMEMORY;

    HRESULT hr = pExt->QueryInterface(riid, ppv);
    pExt->Release();
    return hr;
}

STDMETHODIMP ClassFactory::LockServer(BOOL fLock) {
    if (fLock)
        InterlockedIncrement(&g_cDllRef);
    else
        InterlockedDecrement(&g_cDllRef);
    return S_OK;
}
