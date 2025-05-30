!include "MUI2.nsh"

Name "Z-Converter Installer"
OutFile "Z-Converter_Installer.exe"
InstallDir "$PROGRAMFILES\ZConvertShellExt"

; Порядок страниц
Page directory
Page instfiles
Page uninstConfirm

Section "Install"
    SetOutPath "$INSTDIR"
    File "build\libConvertShellExt.dll"

    ; Регистрируем DLL через regsvr32
    nsExec::ExecToLog 'regsvr32 /s "$INSTDIR\libConvertShellExt.dll"'

    ; Добавляем uninstall
    WriteUninstaller "$INSTDIR\Uninstall.exe"
SectionEnd

Section "Uninstall"
    nsExec::ExecToLog 'regsvr32 /u /s "$INSTDIR\libConvertShellExt.dll"'

    ; Обычное удаление DLL
    Delete "$INSTDIR\libConvertShellExt.dll"
    ; Если не получилось — то после ребута
    IfErrors 0 +2
    Delete /REBOOTOK "$INSTDIR\libConvertShellExt.dll"

    Delete "$INSTDIR\Uninstall.exe"
    RMDir "$INSTDIR"
SectionEnd