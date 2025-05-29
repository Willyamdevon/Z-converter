!include "MUI2.nsh"

Name "ConvertShellExt Installer"
OutFile "ConvertShellExt_Installer.exe"
InstallDir "$PROGRAMFILES\ConvertShellExt"

; Порядок страниц
Page directory
Page instfiles
Page uninstConfirm
Page instfiles  ; <-- БЫЛО uninstfiles (ОШИБКА), должно быть instfiles

Section "Install"
    SetOutPath "$INSTDIR"
    File "build\libConvertShellExt.dll"

    ; Регистрируем DLL через regsvr32
    nsExec::ExecToLog 'regsvr32 /s "$INSTDIR\libConvertShellExt.dll"'

    ; Добавляем uninstall
    WriteUninstaller "$INSTDIR\Uninstall.exe"
SectionEnd

Section "Uninstall"
    ; Удаляем регистрацию
    nsExec::ExecToLog 'regsvr32 /u /s "$INSTDIR\libConvertShellExt.dll"'

    Delete "$INSTDIR\libConvertShellExt.dll"
    Delete "$INSTDIR\Uninstall.exe"
    RMDir "$INSTDIR"
SectionEnd
