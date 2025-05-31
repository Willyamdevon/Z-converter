!include "MUI2.nsh"

Name "Z-Converter"
OutFile "Z-Converter_Installer.exe"
Icon "icon.ico"
UninstallIcon "icon.ico"
InstallDir "$PROGRAMFILES\ZConvertShellExt"

BrandingText "Z-Converter Installer"
RequestExecutionLevel admin

; ----------------
; UI НАСТРОЙКИ
; ----------------
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "header.bmp"
!define MUI_HEADERIMAGE_RIGHT
!define MUI_ABORTWARNING

; ----------------
; СТРАНИЦЫ
; ----------------
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "Russian"

; ----------------
; УСТАНОВКА
; ----------------
Section "Install"
    SetOutPath "$INSTDIR"
    File "build\libConvertShellExt.dll"

    nsExec::ExecToLog 'regsvr32 /s "$INSTDIR\libConvertShellExt.dll"'

    WriteUninstaller "$INSTDIR\Uninstall.exe"
SectionEnd

; ----------------
; УДАЛЕНИЕ
; ----------------
Section "Uninstall"
    nsExec::ExecToLog 'regsvr32 /u /s "$INSTDIR\libConvertShellExt.dll"'

    Delete "$INSTDIR\libConvertShellExt.dll"
    IfErrors 0 +2
    Delete /REBOOTOK "$INSTDIR\libConvertShellExt.dll"

    Delete "$INSTDIR\Uninstall.exe"
    RMDir "$INSTDIR"
SectionEnd
