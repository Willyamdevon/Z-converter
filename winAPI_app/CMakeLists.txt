cmake_minimum_required(VERSION 3.10)

project(ConvertShellExt)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_WINDOWS_EXPORT_ALL_SYMBOLS ON)

add_library(ConvertShellExt SHARED
    ShellExt.cpp
    ClassFactory.cpp
    DllMain.cpp
    resource.rc
)

target_compile_definitions(ConvertShellExt PRIVATE UNICODE _UNICODE)
target_include_directories(ConvertShellExt PRIVATE ${CMAKE_CURRENT_SOURCE_DIR})
target_link_libraries(ConvertShellExt ole32 uuid)
set_target_properties(ConvertShellExt PROPERTIES SUFFIX ".dll")
target_link_libraries(ConvertShellExt ole32 uuid shlwapi)
