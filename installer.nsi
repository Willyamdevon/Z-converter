!define MUI_ICON "icon.ico"
!define MUI_UNICON "icon.ico"
!include "MUI2.nsh"

Name "Z-Converter"
OutFile "Z-Converter_Setup.exe"
InstallDir "$PROGRAMFILES\ZConverter"

BrandingText "Z-Converter Installer"
RequestExecutionLevel admin

; ----------------
; UI НАСТРОЙКИ
; ----------------
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "header.bmp"
!define MUI_HEADERIMAGE_RIGHT
!define MUI_ABORTWARNING
!define MUI_COMPONENTSPAGE_NODESC

; Переменные для чекбоксов
Var CreateDesktopShortcut
Var CreateStartMenuShortcut

; ----------------
; СТРАНИЦЫ
; ----------------
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY

; Кастомная страница с чекбоксами для ярлыков
Page custom CreateShortcutsPage ValidateShortcutsPage

!insertmacro MUI_PAGE_INSTFILES

!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_CHECKED
!define MUI_FINISHPAGE_RUN_TEXT "Run Z-Converter"
!define MUI_FINISHPAGE_RUN_FUNCTION "LaunchApplication"

!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "Russian"

; ----------------
; ФУНКЦИИ ДЛЯ СТРАНИЦЫ ЧЕКБОКСОВ
; ----------------
Function CreateShortcutsPage
    !insertmacro MUI_HEADER_TEXT "Additional parameters" "Select additional installation options"
    
    nsDialogs::Create 1018
    Pop $0
    
    ${NSD_CreateLabel} 0 0 100% 24u "Select additional installation options:"
    Pop $0
    
    ${NSD_CreateCheckbox} 0 30u 100% 10u "Create a shortcut on the desktop"
    Pop $CreateDesktopShortcut
    ${NSD_SetState} $CreateDesktopShortcut ${BST_CHECKED}
    
    ${NSD_CreateCheckbox} 0 45u 100% 10u "Create a shortcut in the Start menu"
    Pop $CreateStartMenuShortcut
    ${NSD_SetState} $CreateStartMenuShortcut ${BST_CHECKED}
    
    nsDialogs::Show
FunctionEnd

Function ValidateShortcutsPage
    ; Сохраняем состояния чекбоксов
    ${NSD_GetState} $CreateDesktopShortcut $0
    StrCpy $CreateDesktopShortcut $0
    
    ${NSD_GetState} $CreateStartMenuShortcut $0
    StrCpy $CreateStartMenuShortcut $0
FunctionEnd

; ----------------
; УСТАНОВКА
; ----------------
Section "Install"
    SetOutPath "$INSTDIR"
    File "winAPI_app\build\libConvertShellExt.dll"

    nsExec::ExecToLog 'regsvr32 /s "$INSTDIR\libConvertShellExt.dll"'

    SetOutPath "$INSTDIR"
    File /r "electron_app\dist\win-unpacked\*"

    ; Создание ярлыков в зависимости от выбора пользователя
    ${If} $CreateDesktopShortcut == ${BST_CHECKED}
        CreateShortCut "$DESKTOP\Z-Converter.lnk" "$INSTDIR\Z-Converter.exe"
    ${EndIf}
    
    ${If} $CreateStartMenuShortcut == ${BST_CHECKED}
        CreateDirectory "$SMPROGRAMS\Z-Converter"
        CreateShortCut "$SMPROGRAMS\Z-Converter\Z-Converter.lnk" "$INSTDIR\Z-Converter.exe"
        CreateShortCut "$SMPROGRAMS\Z-Converter\Uninstall Z-Converter.lnk" "$INSTDIR\Uninstall.exe"
    ${EndIf}

    WriteUninstaller "$INSTDIR\Uninstall.exe"
    
    ; Добавляем информацию для удаления в реестр
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Z-Converter" \
                 "DisplayName" "Z-Converter"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Z-Converter" \
                 "UninstallString" "$\"$INSTDIR\Uninstall.exe$\""
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Z-Converter" \
                 "DisplayIcon" "$\"$INSTDIR\icon.ico$\""
SectionEnd

; Функция запуска приложения после установки
Function LaunchApplication
    Exec '"$INSTDIR\Z-Converter.exe"'
FunctionEnd

; ----------------
; УДАЛЕНИЕ
; ----------------
Section "Uninstall"
    nsExec::ExecToLog 'regsvr32 /u /s "$INSTDIR\libConvertShellExt.dll"'

    ; Удаление ярлыков
    Delete "$DESKTOP\Z-Converter.lnk"
    RMDir /r "$SMPROGRAMS\Z-Converter"

    Delete "$INSTDIR\libConvertShellExt.dll"
    IfErrors 0 +2
    Delete /REBOOTOK "$INSTDIR\libConvertShellExt.dll"

    Delete "$INSTDIR\Z-Converter.exe"
    Delete "$INSTDIR\*.pak"
    Delete "$INSTDIR\*.dll"
    Delete "$INSTDIR\*.bin"
    Delete "$INSTDIR\*.json"
    Delete "$INSTDIR\LICENSE*"
    Delete "$INSTDIR\resources\*.*"
    RMDir /r "$INSTDIR\resources"

    Delete "$INSTDIR\Uninstall.exe"
    RMDir "$INSTDIR"
    
    ; Удаление информации из реестра
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Z-Converter"
SectionEnd