#include <windows.h>

#define IDM_CONVERT 1001
#define IDM_TO_PNG  1101
#define IDM_TO_JPG  1102
#define IDM_TO_JPEG 1103

LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam)
{
    switch (msg)
    {
    case WM_CONTEXTMENU:
    {
        HMENU hMenu = CreatePopupMenu();
        if (hMenu)
        {
            // Создаём подменю "Convert"
            HMENU hSubMenu = CreatePopupMenu();
            AppendMenu(hSubMenu, MF_STRING, IDM_TO_PNG, L"to png");
            AppendMenu(hSubMenu, MF_STRING, IDM_TO_JPG, L"to jpg");
            AppendMenu(hSubMenu, MF_STRING, IDM_TO_JPEG, L"to jpeg");

            // Добавляем кнопку "Convert" с подменю
            AppendMenu(hMenu, MF_POPUP, (UINT_PTR)hSubMenu, L"Convert");

            // Показать контекстное меню
            POINT pt;
            pt.x = LOWORD(lParam);
            pt.y = HIWORD(lParam);
            TrackPopupMenu(hMenu, TPM_RIGHTBUTTON, pt.x, pt.y, 0, hwnd, NULL);

            DestroyMenu(hMenu);
        }
    }
    break;

    case WM_COMMAND:
        switch (LOWORD(wParam))
        {
        case IDM_TO_PNG:
            MessageBox(hwnd, L"Convert to PNG selected", L"Info", MB_OK);
            break;
        case IDM_TO_JPG:
            MessageBox(hwnd, L"Convert to JPG selected", L"Info", MB_OK);
            break;
        case IDM_TO_JPEG:
            MessageBox(hwnd, L"Convert to JPEG selected", L"Info", MB_OK);
            break;
        }
        break;

    case WM_DESTROY:
        PostQuitMessage(0);
        break;
    default:
        return DefWindowProc(hwnd, msg, wParam, lParam);
    }
    return 0;
}

int WINAPI wWinMain(HINSTANCE hInstance, HINSTANCE, PWSTR, int nCmdShow)
{
    const wchar_t CLASS_NAME[] = L"SampleWindowClass";

    WNDCLASS wc = {};
    wc.lpfnWndProc = WndProc;
    wc.hInstance = hInstance;
    wc.lpszClassName = CLASS_NAME;

    RegisterClass(&wc);

    HWND hwnd = CreateWindowEx(
        0,
        CLASS_NAME,
        L"Context Menu with Convert Submenu",
        WS_OVERLAPPEDWINDOW,
        CW_USEDEFAULT, CW_USEDEFAULT, 400, 300,
        NULL,
        NULL,
        hInstance,
        NULL
    );

    if (hwnd == NULL) return 0;

    ShowWindow(hwnd, nCmdShow);

    MSG msg = {};
    while (GetMessage(&msg, NULL, 0, 0))
    {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
    return 0;
}
