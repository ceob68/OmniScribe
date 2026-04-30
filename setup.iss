[Setup]
AppName=OmniScribe
AppVersion=1.0
AppPublisher=ceob68 / Vaultly
AppPublisherURL=https://github.com/ceob68
DefaultDirName={autopf}\OmniScribe
DefaultGroupName=OmniScribe
OutputDir=Output
OutputBaseFilename=OmniScribe_Setup_v1.0
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Files]
Source: "dist\OmniScribe\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "docs\Manual.pdf"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "docs\Guia_Rapida.pdf"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "LICENSE.txt"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\OmniScribe"; Filename: "{app}\OmniScribe.exe"
Name: "{commondesktop}\OmniScribe"; Filename: "{app}\OmniScribe.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Crear acceso directo en el escritorio"; GroupDescription: "Iconos adicionales:"

[Run]
Filename: "{app}\OmniScribe.exe"; Description: "Iniciar OmniScribe"; Flags: nowait postinstall skipifsilent
